import express from 'express';
import { createServer } from 'http';

import { createGradientRouter } from '../../gradient/index.js';
import { createAuthMiddleware } from './middleware/auth.middleware.js';
import { createActionsRouter } from './routes/actions.routes.js';
import { createAuditRouter } from './routes/audit.routes.js';
import { createAuthRouter } from './routes/auth.routes.js';
import { createCommandsRouter } from './routes/commands.routes.js';
import { createEditorRouter } from './routes/editor.routes.js';
import { createFlagsRouter } from './routes/flags.routes.js';
import { createLogsRouter } from './routes/logs.routes.js';
import { createPrefixRouter } from './routes/prefix.routes.js';
import { createProfilePicturesRouter } from './routes/profile-pictures.routes.js';
import { createSpotifyRouter } from './routes/spotify.routes.js';
import { createStaticRouter } from './routes/static.routes.js';
import { createStatusRouter } from './routes/status.routes.js';
import { createUsersRouter } from './routes/users.routes.js';
import { createAuditService } from './services/audit.service.js';
import { createAuthService } from './services/auth.service.js';
import { createBotBridgeService } from './services/bot-bridge.service.js';
import { createEditorService } from './services/editor.service.js';
import { createMonitorService } from './services/monitor.service.js';
import { createProfilePicturesService } from './services/profile-pictures.service.js';
import { createSpotifyService } from './services/spotify.service.js';
import { createSystemService } from './services/system.service.js';
import { createUndoService } from './services/undo.service.js';
import { createUsersService } from './services/users.service.js';
import { createSocketLayer } from './socket/index.js';

const DEFAULT_PORT = Number(process.env.DASHBOARD_PORT || 4000);
const API_BASE = '/api/dashboard';

function wireServices({ configuration, prisma }) {
	const audit = createAuditService({ prisma });
	const monitor = createMonitorService({ configuration });
	const users = createUsersService({ configuration, prisma });
	const undo = createUndoService({ monitor, users });
	const profilePictures = createProfilePicturesService({ configuration, prisma });
	const editor = createEditorService();
	const spotify = createSpotifyService();
	const botBridge = createBotBridgeService();
	const auth = createAuthService({ prisma, audit, botBridge });
	const system = createSystemService({ configuration, prisma, monitor, spotify, auth, botBridge });

	return {
		audit,
		auth,
		undo,
		profilePictures,
		users,
		editor,
		spotify,
		system,
		botBridge,
		monitor
	};
}

function createApp({ services, configuration, mountGradient = true, port = DEFAULT_PORT }) {
	const app = express();

	app.use(express.json());

	const middleware = createAuthMiddleware({ auth: services.auth });

	services.middleware = middleware;

	app.get(`${API_BASE}/_health`, (_req, res) => {
		res.json({ ok: true, server: 'dashboard/server', timestamp: Date.now() });
	});

	if (mountGradient) {
		app.use(createGradientRouter({ port }));
	}

	const apiRouters = [
		createAuthRouter({ services }),
		createSpotifyRouter({ services }),
		createActionsRouter({ services }),
		createCommandsRouter({ services, configuration }),
		createFlagsRouter({ services }),
		createPrefixRouter({ services, configuration }),
		createAuditRouter({ services }),
		createLogsRouter({ services }),
		createEditorRouter({ services }),
		createProfilePicturesRouter({ services }),
		createUsersRouter({ services, configuration }),
		createStatusRouter({ services })
	];

	for (const router of apiRouters) {
		app.use(API_BASE, router);
	}

	app.use(createStaticRouter());

	return app;
}

export async function createDashboard({ configuration, prisma, mountGradient = true, port = DEFAULT_PORT } = {}) {
	if (!configuration) {
		throw new Error('createDashboard: configuration is required');
	}

	if (!prisma) {
		throw new Error('createDashboard: prisma is required');
	}

	const services = wireServices({ configuration, prisma });

	await services.audit.load?.();
	await services.auth.load?.();
	await services.users.load?.();
	await services.profilePictures.hydrate?.();
	await services.monitor.initialize?.();

	const app = createApp({ services, configuration, mountGradient, port });
	const httpServer = createServer(app);
	const socketLayer = createSocketLayer(httpServer, services);

	services.socket = socketLayer;

	return {
		app,
		httpServer,
		io: socketLayer.io,
		socket: socketLayer,
		services,
		listen(listenPort = port) {
			return new Promise((resolve) => {
				httpServer.listen(listenPort, () => resolve(httpServer));
			});
		}
	};
}

export async function startDashboard(opts = {}) {
	const configuration = opts.configuration || (await import('../../src/helper/config/connect.js')).default;
	const prisma = opts.prisma || (await import('../../src/helper/database/prisma.js')).default;

	if (configuration.dashboard?.expressInstances?.has?.('dashboard')) {
		return null;
	}

	const port = Number(opts.port || DEFAULT_PORT);
	const dashboard = await createDashboard({
		...opts,
		configuration,
		prisma,
		port
	});

	await dashboard.listen(port);

	if (configuration.dashboard) {
		configuration.dashboard.io = dashboard.io;
		configuration.dashboard.expressInstances?.set?.('dashboard', dashboard.httpServer);
		configuration.dashboard.processConfirmationAction = (payload) =>
			dashboard.services.auth.processConfirmationAction(payload);
	}

	return dashboard;
}
