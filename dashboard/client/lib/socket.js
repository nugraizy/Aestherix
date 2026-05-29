import { io } from 'socket.io-client';
import { MAX_LOGS } from './constants.js';
import { commands, flags, logs, status, toolPanels, users } from './stores.js';

let logSeq = 0;

export const socket = io({
	autoConnect: false,
	reconnectionAttempts: 5,
	reconnectionDelay: 2000,
	timeout: 5000,
	transports: ['polling', 'websocket'],
	upgrade: true
});

let bound = false;

function formatUptime(seconds) {
	const total = Math.max(0, Math.floor(Number(seconds) || 0));
	const hours = Math.floor(total / 3600);
	const minutes = Math.floor((total % 3600) / 60);

	return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export function connect() {
	if (socket.connected) {
		return;
	}

	if (!bound) {
		bindEvents();
		bound = true;
	}

	socket.connect();
}

export function disconnect() {
	socket.disconnect();
	bound = false;
}

export function clearLogs() {
	logs.set([]);
}

function applyStatus(payload) {
	const proc = payload?.process || {};
	const sys = payload?.system || {};
	const cmds = payload?.commands || {};
	const flagsBlock = payload?.flags || {};
	const sessions = payload?.sessions || {};
	const bot = payload?.bot || {};

	status.update((current) => ({
		...current,
		connected: true,
		uptime: formatUptime(proc.uptimeSeconds),
		uptimeSeconds: Number(proc.uptimeSeconds || 0),
		commands: Number(cmds.total || 0),
		commandsEnabled: Number(cmds.enabled || 0),
		flagsEnabled: Number(flagsBlock.enabled || 0),
		flagsTotal: Number(flagsBlock.total || 0),
		version: String(payload?.project?.version || ''),
		platform: String(sys.platform || ''),
		nodeVersion: String(sys.nodeVersion || ''),
		cpuCount: Number(sys.cpus || 0),
		cpuPercent: Number(sys.cpuPercent || 0),
		processCpu: Number(proc.cpuPercent || 0),
		totalMemory: Number(sys.totalMemory || 0),
		freeMemory: Number(sys.freeMemory || 0),
		rss: Number(proc.rss || 0),
		heapUsed: Number(proc.heapUsed || 0),
		heapTotal: Number(proc.heapTotal || 0),
		loadAverage: Array.isArray(sys.loadAverage) ? sys.loadAverage : current.loadAverage,
		processUptime: Number(proc.uptimeSeconds || 0),
		sessions: Number(sessions.activeUsers || 0),
		botOnline: bot?.online !== undefined ? Boolean(bot.online) : true,
		botMode: bot?.mode === 'split' ? 'split' : 'embedded',
		waConnected: Boolean(bot?.waConnected),
		pm2: Boolean(payload?.pm2)
	}));
}

function bindEvents() {
	socket.on('dashboard:status', (payload) => {
		if (payload && typeof payload === 'object') {
			applyStatus(payload);
		}
	});

	socket.on('dashboard:commands', (payload) => {
		if (Array.isArray(payload?.commands)) {
			commands.set(payload.commands);
		}
	});

	socket.on('dashboard:flags', (payload) => {
		if (!Array.isArray(payload?.flags)) {
			return;
		}

		const valid = payload.flags.filter((entry) => entry && typeof entry.name === 'string' && entry.name.length > 1);

		flags.set(valid);
	});

	socket.on('dashboard:users', (payload) => {
		users.set(payload?.users || []);
	});

	socket.on('dashboard:tools', (payload) => {
		if (Array.isArray(payload?.panels)) {
			toolPanels.set(payload.panels);
		}
	});

	socket.on('dashboard:logs', (payload) => {
		if (!payload?.logs?.length) {
			return;
		}

		logs.update((current) => {
			const merged = [...current, ...payload.logs.map((entry) => ({ ...entry, _id: ++logSeq }))];

			return merged.slice(-MAX_LOGS);
		});
	});

	socket.on('connect', () => {
		status.update((s) => ({ ...s, connected: true }));

		setTimeout(async () => {
			try {
				const [cmdRes, flagRes] = await Promise.all([
					fetch('/api/dashboard/commands', { credentials: 'include' }),
					fetch('/api/dashboard/flags', { credentials: 'include' })
				]);
				const [cmdData, flagData] = await Promise.all([cmdRes.json(), flagRes.json()]);

				if (Array.isArray(cmdData?.commands)) {
					commands.set(cmdData.commands);
				}

				if (Array.isArray(flagData?.flags)) {
					const valid = flagData.flags.filter((entry) => entry && typeof entry.name === 'string' && entry.name.length > 1);

					flags.set(valid);
				}
			} catch {
				// Ignore errors - the socket will update when the data is received
			}
		}, 1500);
	});

	socket.on('disconnect', () => {
		status.update((s) => ({ ...s, connected: false }));
	});
}
