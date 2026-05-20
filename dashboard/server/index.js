import express from 'express';
import { createServer } from 'http';

import { createGradientRouter } from '../../gradient/index.js';
import { createAuthMiddleware } from './middleware/auth.middleware.js';
import { createActionsRouter } from './routes/actions.routes.js';
import { createAuditRouter } from './routes/audit.routes.js';
import { createAuthRouter } from './routes/auth.routes.js';
import { createBroadcastRouter } from './routes/broadcast.routes.js';
import { createCommandsRouter } from './routes/commands.routes.js';
import { createEditorRouter } from './routes/editor.routes.js';
import { createFlagsRouter } from './routes/flags.routes.js';
import { createGroupsRouter } from './routes/groups.routes.js';
import { createLogsRouter } from './routes/logs.routes.js';
import { createMessageLogsRouter } from './routes/message-logs.routes.js';
import { createPrefixRouter } from './routes/prefix.routes.js';
import { createProfilePicturesRouter } from './routes/profile-pictures.routes.js';
import { createQuickActionsRouter } from './routes/quick-actions.routes.js';
import { createSpotifyRouter } from './routes/spotify.routes.js';
import { createStaticRouter } from './routes/static.routes.js';
import { createSettingsRouter } from './routes/settings.routes.js';
import { createStatusRouter } from './routes/status.routes.js';
import { createSystemRouter } from './routes/system.routes.js';
import { createUsersRouter } from './routes/users.routes.js';
import { createAuditService } from './services/audit.service.js';
import { createAuthService } from './services/auth.service.js';
import { createBotBridgeService } from './services/bot-bridge.service.js';
import { createBroadcastService } from './services/broadcast.service.js';
import { createEditorService } from './services/editor.service.js';
import { createGroupsService } from './services/groups.service.js';
import { createLifecycleService } from './services/lifecycle.service.js';
import { createMonitorService } from './services/monitor.service.js';
import { createProfilePicturesService } from './services/profile-pictures.service.js';
import { createSpotifyService } from './services/spotify.service.js';
import { createSystemService } from './services/system.service.js';
import { createSettingsService } from './services/settings.service.js';
import { createUndoService } from './services/undo.service.js';
import { createUsersService } from './services/users.service.js';
import { createSocketLayer } from './socket/index.js';

const DEFAULT_PORT = Number(process.env.DASHBOARD_PORT || 4000);
const API_BASE = '/api/dashboard';

function wireServices({ configuration, prisma }) {
	const audit = createAuditService({ prisma });
	const monitor = createMonitorService({ configuration });
	const users = createUsersService({ configuration, prisma });
	const profilePictures = createProfilePicturesService({ configuration, prisma });
	const editor = createEditorService();
	const groups = createGroupsService({ configuration });
	const spotify = createSpotifyService();
	const botBridge = createBotBridgeService();
	const broadcast = createBroadcastService({ configuration, botBridge, prisma });
	const settings = createSettingsService({ configuration, botBridge });
	const undo = createUndoService({ monitor, users, settings });
	const lifecycle = createLifecycleService();
	const auth = createAuthService({ prisma, audit, botBridge });
	const system = createSystemService({ configuration, prisma, monitor, spotify, auth, botBridge });

	return {
		audit,
		auth,
		undo,
		profilePictures,
		users,
		editor,
		groups,
		broadcast,
		spotify,
		system,
		botBridge,
		lifecycle,
		monitor,
		settings
	};
}

function createApp({ services, configuration, mountGradient = true, port = DEFAULT_PORT }) {
	const app = express();

	app.use(express.json());
	app.set('configuration', configuration);

	const middleware = createAuthMiddleware({ auth: services.auth });

	services.middleware = middleware;

	app.get(`${API_BASE}/_health`, (_req, res) => {
		res.json({ ok: true, server: 'dashboard/server', timestamp: Date.now() });
	});

	app.get('/status', async (req, res) => {
		try {
			const status = await services.system.getStatus();
			const data = {
				status: status.bot?.waConnected ? 'online' : 'offline',
				version: status.project?.version || 'unknown',
				uptime: Math.floor(process.uptime()),
				commands: status.commands?.total || 0,
				timestamp: Date.now()
			};

			if (req.accepts(['html', 'json']) === 'html') {
				const uptimeStr = data.uptime >= 3600
					? `${Math.floor(data.uptime / 3600)}h ${Math.floor((data.uptime % 3600) / 60)}m`
					: `${Math.floor(data.uptime / 60)}m`;

				res.type('html').send(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Aestherix Status</title>
<style>*{margin:0;box-sizing:border-box}body{font-family:system-ui,sans-serif;background:#0f0f1a;color:#e0e0e0;display:grid;place-items:center;min-height:100vh;padding:2rem}
.card{background:#1a1a2e;border:1px solid #2a2a3e;border-radius:1rem;padding:2.5rem;max-width:400px;width:100%;text-align:center}
.dot{display:inline-block;width:12px;height:12px;border-radius:50%;margin-right:0.5rem;vertical-align:middle}
.dot.online{background:#87f0c1;box-shadow:0 0 8px #87f0c1}
.dot.offline{background:#ff8e74;box-shadow:0 0 8px #ff8e74}
h1{font-size:1.8rem;margin-bottom:1rem}
.status{font-size:1.2rem;font-weight:600;margin-bottom:1.5rem}
.meta{display:flex;justify-content:center;gap:1.5rem;color:#888;font-size:0.85rem}
</style></head><body>
<div class="card">
<h1>Aestherix</h1>
<p class="status"><span class="dot ${data.status}"></span>${data.status === 'online' ? 'Online' : 'Offline'}</p>
<div class="meta"><span>v${data.version}</span><span>↑ ${uptimeStr}</span><span>${data.commands} cmds</span></div>
</div></body></html>`);
				return;
			}

			res.json(data);
		} catch {
			res.json({ status: 'unknown', timestamp: Date.now() });
		}
	});

	if (mountGradient) {
		app.use(createGradientRouter({ port }));
	}

	const apiRouters = [
		createAuthRouter({ services }),
		createBroadcastRouter({ services }),
		createSpotifyRouter({ services }),
		createActionsRouter({ services }),
		createCommandsRouter({ services, configuration }),
		createFlagsRouter({ services }),
		createGroupsRouter({ services, configuration }),
		createPrefixRouter({ services, configuration }),
		createSettingsRouter({ services }),
		createAuditRouter({ services }),
		createLogsRouter({ services }),
		createMessageLogsRouter({ services }),
		createEditorRouter({ services }),
		createProfilePicturesRouter({ services }),
		createQuickActionsRouter({ services }),
		createUsersRouter({ services, configuration }),
		createStatusRouter({ services }),
		createSystemRouter({ services })
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

	process.on('SIGTERM', () => {
		socketLayer.shutdown();
	});

	process.on('SIGINT', () => {
		socketLayer.shutdown();
	});

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
