import { Server as SocketIOServer } from 'socket.io';

import { isBotEmbeddedHere } from '../lib/client.js';
import { AUTH_COOKIE_NAME } from '../services/auth.service.js';
import { createConfirmationBridge } from './confirmation.js';
import { ROOMS } from './rooms.js';

const STATUS_INTERVAL_MS = 1000;
const LOGS_INTERVAL_MS = 1200;
const BOT_LOGS_INTERVAL_MS = 1200;
const AUDIT_INTERVAL_MS = 5000;
const META_INTERVAL_MS = 8000;

function getSocketSession(socket, auth) {
	const cookie = String(socket?.handshake?.headers?.cookie || '');
	const queryToken = socket?.handshake?.auth?.token || socket?.handshake?.query?.token || '';
	const requestLike = {
		headers: {
			cookie: queryToken ? `${AUTH_COOKIE_NAME}=${queryToken};${cookie}` : cookie
		}
	};

	return auth.getSessionFromRequest(requestLike);
}

async function emitInitialSnapshot(socket, services) {
	const session = socket?.data?.session || null;

	if (!session) {
		return;
	}

	const { audit, system, monitor, users, profilePictures, botBridge } = services;

	socket.emit('dashboard:status', await system.getStatus());
	socket.emit('dashboard:commands', { commands: monitor.listCommands() });
	socket.emit('dashboard:flags', { flags: monitor.listFlags() });
	socket.emit('dashboard:users', {
		users: await users.list({ redactNumbers: session.role !== 'owner' && session.role !== 'superOwner' })
	});
	socket.emit('dashboard:profile-pictures', {
		picture: await profilePictures.getLatest()
	});

	if (session.role !== 'owner' && session.role !== 'superOwner') {
		return;
	}

	let logsPayload;

	if (isBotEmbeddedHere()) {
		logsPayload = monitor.getLogs({ since: 0, limit: 250 });
	} else {
		const result = await botBridge.fetchBotLogs({ since: 0, limit: 250 });

		logsPayload = result.ok ? (result.data || { lastId: 0, logs: [] }) : { lastId: 0, logs: [] };
	}

	socket.data.lastLogId = Number(logsPayload?.lastId || 0);
	socket.emit('dashboard:logs', logsPayload);

	const botLogsResult = await botBridge.fetchBotLogs({ since: 0, limit: 250 });

	if (botLogsResult.ok) {
		const botLogsPayload = botLogsResult.data || { lastId: 0, logs: [] };

		socket.data.lastBotLogId = Number(botLogsPayload?.lastId || 0);
		socket.emit('dashboard:bot-logs', botLogsPayload);
	} else {
		socket.emit('dashboard:bot-logs', {
			ok: false,
			message: botLogsResult.message || 'Bot log stream is not reachable.',
			lastId: Number(socket.data.lastBotLogId || 0),
			logs: []
		});
	}

	const filters = audit.sanitizeRealtimeFilters(socket.data?.auditFilters || {});
	const auditPayload = audit.list({
		since: 0,
		limit: filters.limit,
		action: filters.action,
		role: filters.role,
		query: filters.query
	});

	socket.data.lastAuditId = Number(auditPayload?.lastId || 0);
	socket.emit('dashboard:audit', auditPayload);
}

function startStatusInterval(io, services) {
	return setInterval(async () => {
		if (io.of('/').sockets.size === 0) {
			return;
		}

		const status = await services.system.getStatus();

		io.emit('dashboard:status', status);
	}, STATUS_INTERVAL_MS);
}

function startLogsInterval(io, services) {
	const embedded = isBotEmbeddedHere();

	return setInterval(async () => {
		const sockets = Array.from(io.of('/').sockets.values());

		if (!sockets.length) {
			return;
		}

		for (const socket of sockets) {
			if (socket.data?.session?.role !== 'owner' && socket.data?.session?.role !== 'superOwner') {
				continue;
			}

			const since = Number(socket.data?.lastLogId || 0);
			let payload;

			if (embedded) {
				payload = services.monitor.getLogs({ since, limit: 250 });
			} else {
				const result = await services.botBridge.fetchBotLogs({ since, limit: 250 });

				payload = result.ok ? (result.data || { lastId: since, logs: [] }) : { lastId: since, logs: [] };
			}

			socket.data.lastLogId = Number(payload?.lastId || since || 0);

			if (Array.isArray(payload?.logs) && payload.logs.length) {
				socket.emit('dashboard:logs', payload);
			}
		}
	}, LOGS_INTERVAL_MS);
}

function startBotLogsInterval(io, services) {
	return setInterval(async () => {
		const ownerSockets = Array.from(io.of('/').sockets.values()).filter(
			(socket) => socket.data?.session?.role === 'owner' || socket.data?.session?.role === 'superOwner'
		);

		if (!ownerSockets.length) {
			return;
		}

		const cursors = ownerSockets.map((s) => Number(s.data?.lastBotLogId || 0));
		const since = Math.max(0, ...cursors);

		const result = await services.botBridge.fetchBotLogs({ since, limit: 250 });

		if (!result.ok) {
			for (const socket of ownerSockets) {
				socket.emit('dashboard:bot-logs', {
					ok: false,
					message: result.message || 'Bot log stream is not reachable.',
					lastId: since,
					logs: []
				});
			}

			return;
		}

		const payload = result.data || { lastId: since, logs: [] };

		for (const socket of ownerSockets) {
			const lastId = Number(socket.data?.lastBotLogId || 0);

			socket.data.lastBotLogId = Number(payload?.lastId || lastId);

			socket.emit('dashboard:bot-logs', payload);
		}
	}, BOT_LOGS_INTERVAL_MS);
}

function startAuditInterval(io, services) {
	return setInterval(() => {
		const sockets = Array.from(io.of('/').sockets.values());

		if (!sockets.length) {
			return;
		}

		for (const socket of sockets) {
			if (socket.data?.session?.role !== 'owner' && socket.data?.session?.role !== 'superOwner') {
				continue;
			}

			const lastId = Number(socket.data?.lastAuditId || 0);
			const filters = services.audit.sanitizeRealtimeFilters(socket.data?.auditFilters || {});
			const payload = services.audit.list({
				since: lastId,
				limit: filters.limit,
				action: filters.action,
				role: filters.role,
				query: filters.query
			});

			if (!payload.logs.length && payload.lastId === lastId) {
				continue;
			}

			socket.data.lastAuditId = Number(payload.lastId || lastId);
			socket.emit('dashboard:audit', payload);
		}
	}, AUDIT_INTERVAL_MS);
}

function startMetaInterval(io, services) {
	let lastPictureKey = '';
	let lastCommandsSnapshot = '';
	let lastFlagsSnapshot = '';
	let lastUserCountOwner = -1;

	return setInterval(async () => {
		if (io.of('/').sockets.size === 0) {
			return;
		}

		const commands = services.monitor.listCommands();
		const flags = services.monitor.listFlags();
		const latestPicture = await services.profilePictures.getLatest();
		const currentKey = `${latestPicture?.timestamp || ''}|${latestPicture?.url || ''}`;

		const commandsJson = JSON.stringify(commands);
		const flagsJson = JSON.stringify(flags);

		if (commandsJson !== lastCommandsSnapshot) {
			lastCommandsSnapshot = commandsJson;
			io.emit('dashboard:commands', { commands });
		}

		if (flagsJson !== lastFlagsSnapshot) {
			lastFlagsSnapshot = flagsJson;
			io.emit('dashboard:flags', { flags });
		}

		if (currentKey && currentKey !== lastPictureKey) {
			lastPictureKey = currentKey;
			io.emit('dashboard:profile-pictures', { picture: latestPicture });
		}

		const usersForOwner = await services.users.list({ redactNumbers: false });
		const ownerCount = usersForOwner.length;

		if (ownerCount !== lastUserCountOwner) {
			lastUserCountOwner = ownerCount;

			const usersForViewer = await services.users.list({ redactNumbers: true });

			const sockets = Array.from(io.of('/').sockets.values());

			for (const socket of sockets) {
				const session = socket.data?.session || null;
				const list = (session?.role === 'owner' || session?.role === 'superOwner') ? usersForOwner : usersForViewer;

				socket.emit('dashboard:users', { users: list });
			}
		}
	}, META_INTERVAL_MS);
}

export function createSocketLayer(httpServer, services) {
	const io = new SocketIOServer(httpServer, {
		path: '/socket.io',
		serveClient: true
	});
	const loginNamespace = io.of('/login');
	const confirmationBridge = createConfirmationBridge({ auth: services.auth });

	confirmationBridge.bind(loginNamespace);

	io.use((socket, next) => {
		const session = getSocketSession(socket, services.auth);

		if (!session) {
			return next(new Error('Unauthorized'));
		}

		socket.data.session = session;
		socket.data.lastLogId = 0;
		socket.data.lastBotLogId = 0;
		socket.data.lastAuditId = 0;
		socket.data.auditFilters = services.audit.sanitizeRealtimeFilters({});

		next();
	});

	io.on('connection', (socket) => {
		const session = socket.data.session;

		socket.emit('dashboard:session', {
			role: session?.role || 'viewer',
			canEdit: session?.role === 'owner'
		});

		socket.on('dashboard:audit-filters', (incoming) => {
			socket.data.auditFilters = services.audit.sanitizeRealtimeFilters(incoming);

			if (socket.data.session?.role !== 'owner' && socket.data.session?.role !== 'superOwner') {
				return;
			}

			const filters = socket.data.auditFilters;
			const payload = services.audit.list({
				since: 0,
				limit: filters.limit,
				action: filters.action,
				role: filters.role,
				query: filters.query
			});

			socket.data.lastAuditId = Number(payload?.lastId || socket.data.lastAuditId || 0);
			socket.emit('dashboard:audit', payload);
		});

		void emitInitialSnapshot(socket, services);
	});

	const intervals = [
		startStatusInterval(io, services),
		startLogsInterval(io, services),
		startBotLogsInterval(io, services),
		startAuditInterval(io, services),
		startMetaInterval(io, services)
	];

	function shutdown() {
		for (const handle of intervals) {
			clearInterval(handle);
		}
	}

	const emit = (event, payload) => io.emit(event, payload);

	return {
		io,
		loginNamespace,
		confirmationBridge,
		shutdown,
		emit,
		emitStatus: (payload) => emit(ROOMS.STATUS, payload),
		emitCommands: (payload) => emit(ROOMS.COMMANDS, payload),
		emitFlags: (payload) => emit(ROOMS.FLAGS, payload),
		emitUsers: (payload) => emit(ROOMS.USERS, payload),
		emitLogs: (payload) => emit(ROOMS.LOGS, payload),
		emitProfilePictures: (payload) => emit(ROOMS.PROFILE_PICTURES, payload)
	};
}
