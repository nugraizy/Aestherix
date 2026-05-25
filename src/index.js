import fs from 'fs-extra';
import P from 'pino';

import { Cli } from './core/cli.js';
import { manager } from './core/manager.js';
import { initializeDashboardMonitor } from '../dashboard/server/monitor.js';
import { startDashboardBridge } from './core/services/dashboard-bridge.js';
import { hydrateProfilePictureHistory, startProfilePictureService } from './core/services/profile-picture.js';
import { Store } from './core/store.js';
import configuration from './helper/config/connect.js';
import prisma from './helper/database/prisma.js';
import { runLimitScheduler } from './helper/groups/settings/limit.js';
import { color, loggers } from './utils/modules/index.js';

color.setTheme(configuration.logger_theme || 'dracula');

const cli = new Cli();

configuration.cli = cli.raw;
configuration.flags = cli.flags;

color.setRainbow(Boolean(configuration.flags.rainbow));
color.setRainbowResolver(() => Boolean(configuration.flags.rainbow));

void initializeDashboardMonitor(configuration).catch((error) => {
	loggers.error(color('Dashboard monitor init failed:', 'red'), color(error.message, 'white'));
});

const OPTIONS = configuration.flags;
const sessionName = await cli.resolveSessionName();

if (OPTIONS.limitReset) {
	runLimitScheduler();
}

if (OPTIONS.resetOnStart) {
	const { Auth } = await import('./core/auth.js');
	const { ClientSocket } = await import('./core/client-socket.js');
	const auth = new Auth(prisma, sessionName);
	const tempSocket = new ClientSocket(auth, { flags: OPTIONS });

	await tempSocket.resetSession(prisma);
}

export const runtime = Date.now();

configuration.flags.runtime = runtime;

if (!(await fs.exists('./src/media/temporary_files/'))) {
	await fs.mkdir('./src/media/temporary_files/');
}

const store = new Store(prisma, sessionName, {
	logger: P().child({ level: 'fatal', stream: 'store' })
});

store.initialize();

export const start = async () => {
	const { boot } = await import('./core/boot.js');

	try {
		await hydrateProfilePictureHistory(configuration);

		if (OPTIONS.help) {
			console.log(cli.help);
			process.exit(0);
		}

		store.localContacts = {};

		const { clientSocket } = await boot({
			cli,
			OPTIONS,
			store,
			sessionName
		});

		clientSocket.on('connected', () => {
			startProfilePictureService(clientSocket, configuration);
			startDashboardBridge(() => {
				for (const [, client] of manager.clients) {
					if (client?.state === 'connected') {
						return client;
					}
				}

				return null;
			});
		});
	} catch (error) {
		loggers.error(color('Boot failed:', 'red'), error);
	}
};

start().catch((error) => {
	loggers.error(color('Top-level start failed:', 'red'), error);
});

process.on('unhandledRejection', (reason) => {
	const err = reason instanceof Error ? reason : new Error(String(reason));

	loggers.error(color('Unhandled promise rejection:', 'red'), err);
});

process.on('uncaughtException', (error) => {
	loggers.error(color('Uncaught exception:', 'red'), error);
	// Process state may be corrupt after an uncaught exception. Exit so the
	// supervisor (PM2 / nodemon) can restart with a clean slate.
	process.exit(1);
});

const gracefulShutdown = async (signal) => {
	const { loggers: log, color: c } = await import('./utils/modules/index.js');

	log.warning(c(`Received ${signal}`, 'white'), c('— shutting down gracefully...', 'lilac'));

	const { manager: mgr } = await import('./core/manager.js');

	await mgr.disconnectAll().catch(() => {});

	if (configuration.dashboard.io) {
		configuration.dashboard.io.disconnectSockets(true);
		configuration.dashboard.io.close();
	}

	const servers = [...configuration.dashboard.expressInstances.entries()];

	await Promise.all(
		servers.map(
			([, server]) =>
				new Promise((resolve) => {
					if (typeof server.closeAllConnections === 'function') {
						server.closeAllConnections();
					}

					server.close(() => resolve());
					setTimeout(resolve, 3000);
				})
		)
	).catch(() => {});

	log.warning(c('Goodbye.', 'lilac'));
	process.exit(0);
};

process.once('SIGINT', () => gracefulShutdown('SIGINT'));
process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
