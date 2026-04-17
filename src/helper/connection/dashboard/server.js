import { spawn } from 'child_process';
import crypto from 'crypto';
import express from 'express';
import validate from 'express-zod-safe';
import fs from 'fs-extra';
import { createServer } from 'http';
import os from 'os';
import path from 'path';
import puppeteer from 'puppeteer';
import { Server as SocketIOServer } from 'socket.io';
import { z } from 'zod';

import { color, loggers } from '../../../utils/modules/index.js';
import configuration from '../../config/connect.js';
import {
	getDashboardLogs,
	initializeDashboardMonitor,
	listDashboardCommands,
	listDashboardFlags,
	setDashboardCommandState,
	setDashboardFlagState
} from './dashboard-monitor.js';

const AUTH_COOKIE_NAME = 'aestherix_dashboard_auth';
const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_COOLDOWN_MS = 60 * 1000;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const LIVE_SESSION_WINDOW_MS = 30 * 1000;
const USERS_LIMIT_DIR = './databases/users/limit';
const USERS_BANNED_PATH = './databases/users/banned.json';
const DASHBOARD_SESSIONS_PATH = './databases/groups/dashboard-sessions.json';
const DASHBOARD_AUDIT_PATH = './databases/groups/dashboard-audit.json';
const ROOT_CHANGELOG_PATH = path.resolve(process.cwd(), 'CHANGELOG.md');
const MAX_AUDIT_LOGS = 1000;
const UNDO_WINDOW_MS = 12000;
const UNDO_WINDOW_SHORT_MS = 8000;
const UNDO_WINDOW_MEDIUM_MS = 10000;
const UNDO_WINDOW_LONG_MS = 15000;
const S_WHATSAPP_NET = '@s.whatsapp.net';

const otpStore = new Map();
const sessionStore = new Map();
const undoActionStore = new Map();
const SPOTIFY_STATUS_TTL_MS = 8000;
const spotifyNowPlayingCache = {
	data: {
		available: false,
		isPlaying: false,
		trackTitle: null,
		artists: null,
		progressMs: null,
		durationMs: null,
		message: 'Unavailable'
	},
	expiresAt: 0,
	pending: null
};
const auditState = {
	logs: [],
	lastId: 0
};
const projectVersion = (() => {
	try {
		return fs.readJSONSync('./package.json')?.version || 'unknown';
	} catch {
		return 'unknown';
	}
})();

const loadSessionStore = () => {
	try {
		if (!fs.pathExistsSync(DASHBOARD_SESSIONS_PATH)) {
			return;
		}

		const raw = fs.readJSONSync(DASHBOARD_SESSIONS_PATH);
		const sessions = Array.isArray(raw?.sessions) ? raw.sessions : [];
		const now = Date.now();

		for (const item of sessions) {
			const token = String(item?.token || '');
			const expiresAt = Number(item?.expiresAt || 0);

			if (!token || expiresAt <= now) {
				continue;
			}

			sessionStore.set(token, {
				role: item?.role === 'owner' ? 'owner' : 'viewer',
				phoneNumber: item?.phoneNumber || null,
				name: item?.name || null,
				lastSeenAt: Number(item?.lastSeenAt || now),
				expiresAt
			});
		}
	} catch (error) {
		loggers.warning(color('Failed loading dashboard sessions:', '#FF5555'), color(error.message, 'white'));
	}
};

const persistSessionStore = () => {
	try {
		const now = Date.now();
		const sessions = Array.from(sessionStore.entries())
			.filter(([, value]) => Number(value?.expiresAt || 0) > now)
			.map(([token, value]) => ({
				token,
				role: value.role,
				phoneNumber: value.phoneNumber || null,
				name: value.name || null,
				lastSeenAt: Number(value.lastSeenAt || now),
				expiresAt: Number(value.expiresAt || 0)
			}));

		fs.ensureDirSync(path.dirname(DASHBOARD_SESSIONS_PATH));
		fs.writeJSONSync(DASHBOARD_SESSIONS_PATH, { sessions }, { spaces: 2 });
	} catch (error) {
		loggers.warning(color('Failed persisting dashboard sessions:', '#FF5555'), color(error.message, 'white'));
	}
};

const loadAuditStore = () => {
	try {
		if (!fs.pathExistsSync(DASHBOARD_AUDIT_PATH)) {
			return;
		}

		const raw = fs.readJSONSync(DASHBOARD_AUDIT_PATH);
		const logs = Array.isArray(raw?.logs) ? raw.logs : [];

		auditState.logs = logs
			.map((entry) => ({
				id: Number(entry?.id || 0),
				timestamp: Number(entry?.timestamp || 0),
				action: String(entry?.action || 'unknown'),
				actorRole: String(entry?.actorRole || 'unknown'),
				actor: entry?.actor ? String(entry.actor) : null,
				target: entry?.target ? String(entry.target) : null,
				status: entry?.status === 'failed' ? 'failed' : 'ok',
				message: entry?.message ? String(entry.message) : null,
				before: entry?.before ?? null,
				after: entry?.after ?? null
			}))
			.filter((entry) => entry.id > 0)
			.slice(-MAX_AUDIT_LOGS);
		auditState.lastId = Number(raw?.lastId || auditState.logs.at(-1)?.id || 0);
	} catch (error) {
		loggers.warning(color('Failed loading dashboard audit logs:', '#FF5555'), color(error.message, 'white'));
	}
};

const persistAuditStore = () => {
	try {
		fs.ensureDirSync(path.dirname(DASHBOARD_AUDIT_PATH));
		fs.writeJSONSync(
			DASHBOARD_AUDIT_PATH,
			{
				lastId: auditState.lastId,
				logs: auditState.logs.slice(-MAX_AUDIT_LOGS)
			},
			{ spaces: 2 }
		);
	} catch (error) {
		loggers.warning(color('Failed persisting dashboard audit logs:', '#FF5555'), color(error.message, 'white'));
	}
};

const pushAuditEvent = ({
	action,
	session = null,
	target = null,
	status = 'ok',
	message = null,
	before = null,
	after = null
}) => {
	auditState.lastId += 1;

	const actorRole = session?.role === 'owner' ? 'owner' : session?.role === 'viewer' ? 'viewer' : 'system';
	const actor = session?.phoneNumber || session?.name || null;

	auditState.logs.push({
		id: auditState.lastId,
		timestamp: Date.now(),
		action: String(action || 'unknown'),
		actorRole,
		actor,
		target: target ? String(target) : null,
		status: status === 'failed' ? 'failed' : 'ok',
		message: message ? String(message) : null,
		before: before ?? null,
		after: after ?? null
	});

	if (auditState.logs.length > MAX_AUDIT_LOGS) {
		auditState.logs.splice(0, auditState.logs.length - MAX_AUDIT_LOGS);
	}

	persistAuditStore();
};

const getDashboardAuditLogs = ({ since = 0, limit = 200, action = '', role = '', query = '' } = {}) => {
	const safeSince = Number(since) || 0;
	const safeLimit = Math.max(1, Math.min(500, Number(limit) || 200));
	const actionFilters = String(action || '')
		.split(',')
		.map((value) => value.trim().toLowerCase())
		.filter(Boolean);
	const roleFilters = String(role || '')
		.split(',')
		.map((value) => value.trim().toLowerCase())
		.filter(Boolean);
	const queryFilter = String(query || '')
		.trim()
		.toLowerCase();

	const filtered = auditState.logs.filter((entry) => {
		if (entry.id <= safeSince) {
			return false;
		}

		if (actionFilters.length && !actionFilters.some((value) => entry.action.toLowerCase().includes(value))) {
			return false;
		}

		if (roleFilters.length && !roleFilters.includes(entry.actorRole.toLowerCase())) {
			return false;
		}

		if (!queryFilter) {
			return true;
		}

		const haystack = [entry.action, entry.actorRole, entry.actor || '', entry.target || '', entry.message || '']
			.join(' ')
			.toLowerCase();

		return haystack.includes(queryFilter);
	});

	return {
		lastId: auditState.lastId,
		logs: filtered.slice(-safeLimit)
	};
};

const sanitizeAuditRealtimeFilters = (value) => {
	const safe = value && typeof value === 'object' ? value : {};

	return {
		action: String(safe.action || ''),
		role: String(safe.role || ''),
		query: String(safe.query || ''),
		limit: Math.max(1, Math.min(500, Number(safe.limit || 300) || 300))
	};
};

const gradientQuery = {
	colors: z.string().optional(),
	dimensions: z
		.string()
		.regex(/^\d+x\d+$/)
		.optional(),
	animate: z
		.string()
		.transform((v) => v === 'true')
		.optional(),
	time: z
		.string()
		.transform((v) => parseInt(v, 10))
		.optional(),
	seed: z
		.string()
		.transform((v) => parseInt(v, 10))
		.optional()
};

let previousSystemCpu = null;
let previousProcessCpu = {
	usage: process.cpuUsage(),
	time: process.hrtime.bigint()
};

const sampleSystemCpuPercent = () => {
	const cpus = os.cpus();
	const current = cpus.reduce(
		(acc, cpu) => {
			const total = Object.values(cpu.times).reduce((sum, value) => sum + value, 0);

			acc.idle += cpu.times.idle;
			acc.total += total;

			return acc;
		},
		{ idle: 0, total: 0 }
	);

	if (!previousSystemCpu) {
		previousSystemCpu = current;
		return 0;
	}

	const idleDelta = current.idle - previousSystemCpu.idle;
	const totalDelta = current.total - previousSystemCpu.total;

	previousSystemCpu = current;

	if (totalDelta <= 0) {
		return 0;
	}

	return Number((((totalDelta - idleDelta) / totalDelta) * 100).toFixed(2));
};

const sampleProcessCpuPercent = () => {
	const nowUsage = process.cpuUsage();
	const nowTime = process.hrtime.bigint();

	const elapsedMicros = Number(nowTime - previousProcessCpu.time) / 1000;
	const usedMicros = nowUsage.user - previousProcessCpu.usage.user + (nowUsage.system - previousProcessCpu.usage.system);

	previousProcessCpu = {
		usage: nowUsage,
		time: nowTime
	};

	if (elapsedMicros <= 0) {
		return 0;
	}

	return Number(((usedMicros / elapsedMicros) * 100).toFixed(2));
};

const isSessionLive = (session) => {
	return Date.now() - Number(session?.lastSeenAt || 0) <= LIVE_SESSION_WINDOW_MS;
};

const parseGithubLogin = ({ name = '', email = '' } = {}) => {
	const safeName = String(name || '').trim();
	const safeEmail = String(email || '')
		.trim()
		.toLowerCase();
	const emailMatch = safeEmail.match(/^(?:\d+\+)?([^@]+)@users\.noreply\.github\.com$/i);

	if (emailMatch?.[1]) {
		return emailMatch[1].trim();
	}

	if (/^[a-z0-9-]{2,39}$/i.test(safeName) && !safeName.includes(' ')) {
		return safeName;
	}

	return '';
};

const loadDashboardContributorsFromGit = async () => {
	return await new Promise((resolve, reject) => {
		const git = spawn('git', ['shortlog', '-sne', 'HEAD'], {
			cwd: process.cwd(),
			shell: false
		});

		let stdout = '';
		let stderr = '';

		git.stdout.on('data', (chunk) => {
			stdout += chunk.toString();
		});

		git.stderr.on('data', (chunk) => {
			stderr += chunk.toString();
		});

		git.on('error', (error) => {
			reject(error);
		});

		git.on('close', (code) => {
			if (code !== 0) {
				reject(new Error(stderr || `git shortlog failed with code ${code}`));
				return;
			}

			const rows = stdout
				.split(/\r?\n/)
				.map((line) => line.trimEnd())
				.filter(Boolean)
				.map((line) => {
					const match = line.match(/^\s*(\d+)\s+(.+?)\s+<([^>]+)>\s*$/);

					if (!match) {
						return null;
					}

					const commits = Number.parseInt(match[1], 10) || 0;
					const name = String(match[2] || '').trim();
					const email = String(match[3] || '').trim();
					const login = parseGithubLogin({ name, email });

					if (/\[bot\]$/i.test(login)) {
						return null;
					}

					const profileUrl = login ? `https://github.com/${login}` : '';
					const avatarUrl = login ? `https://github.com/${login}.png?size=128` : '';

					return {
						name,
						login,
						email,
						commits,
						profileUrl,
						avatarUrl
					};
				})
				.filter(Boolean);

			const deduped = [];
			const seen = new Set();

			for (const entry of rows) {
				const key = entry.login ? `login:${entry.login.toLowerCase()}` : `name:${entry.name.toLowerCase()}`;

				if (seen.has(key)) {
					continue;
				}

				seen.add(key);
				deduped.push(entry);
			}

			resolve(deduped);
		});
	});
};

const countActiveDashboardSessions = () => {
	const now = Date.now();

	for (const [token, value] of sessionStore.entries()) {
		if (value.expiresAt <= now) {
			sessionStore.delete(token);
		}
	}

	let total = 0;

	for (const session of sessionStore.values()) {
		if (isSessionLive(session)) {
			total += 1;
		}
	}

	return total;
};

// eslint-disable-next-line no-unused-vars
const getSpotifyNowPlaying = async () => {
	const now = Date.now();

	if (spotifyNowPlayingCache.pending) {
		return spotifyNowPlayingCache.pending;
	}

	if (spotifyNowPlayingCache.expiresAt > now) {
		return spotifyNowPlayingCache.data;
	}

	spotifyNowPlayingCache.pending = (async () => {
		let next = {
			available: false,
			isPlaying: false,
			trackTitle: null,
			artists: null,
			progressMs: null,
			durationMs: null,
			message: 'Unavailable'
		};

		try {
			const { spotifier } = await import('../../../utils/spotifier/index.js');
			const data = await spotifier.updateNowPlayingStates();

			if (data === false) {
				next = {
					...next,
					available: true,
					message: 'Idle'
				};
			} else if (data?.status === false) {
				next = {
					...next,
					message: data?.message || 'Unavailable'
				};
			} else if (data?.trackTitle) {
				next = {
					available: true,
					isPlaying: Boolean(data.isPlaying),
					trackTitle: data.trackTitle,
					artists: data.artists || null,
					progressMs: Number(data.progressMs || 0),
					durationMs: Number(data.durationMs || 0),
					message: null
				};
			}
		} catch {
			// Keep unavailable fallback when Spotify integration is not configured.
		}

		spotifyNowPlayingCache.data = next;
		spotifyNowPlayingCache.expiresAt = Date.now() + SPOTIFY_STATUS_TTL_MS;
		spotifyNowPlayingCache.pending = null;

		return next;
	})();

	return spotifyNowPlayingCache.pending;
};

const getDashboardStatus = async () => {
	const mem = process.memoryUsage();
	const disabledCount = configuration.cmds.disabledCommands?.size || 0;
	const flagEntries = Object.entries(configuration.OPTIONS || {}).filter(([, value]) => typeof value === 'boolean');
	const enabledFlags = flagEntries.filter(([, value]) => Boolean(value)).length;
	const spotify = spotifyNowPlayingCache.data;
	// const spotify = await getSpotifyNowPlaying();

	return {
		timestamp: Date.now(),
		project: {
			version: projectVersion
		},
		system: {
			platform: process.platform,
			nodeVersion: process.version,
			cpus: os.cpus().length,
			cpuPercent: sampleSystemCpuPercent(),
			totalMemory: os.totalmem(),
			freeMemory: os.freemem(),
			uptimeSeconds: os.uptime(),
			loadAverage: os.loadavg()
		},
		process: {
			pid: process.pid,
			uptimeSeconds: process.uptime(),
			cpuPercent: sampleProcessCpuPercent(),
			rss: mem.rss,
			heapUsed: mem.heapUsed,
			heapTotal: mem.heapTotal,
			external: mem.external
		},
		commands: {
			total: configuration.cmds.commands.size,
			disabled: disabledCount,
			enabled: Math.max(0, configuration.cmds.commands.size - disabledCount)
		},
		flags: {
			total: flagEntries.length,
			enabled: enabledFlags,
			disabled: Math.max(0, flagEntries.length - enabledFlags)
		},
		spotify,
		sessions: {
			activeUsers: countActiveDashboardSessions()
		}
	};
};

const authRequestBody = z.object({
	phoneNumber: z.string().min(5)
});

const confirmationStatusBody = z.object({
	phoneNumber: z.string().min(5),
	requestId: z.string().min(10),
	requestKey: z.string().min(10)
});

const finalizeConfirmationBody = z.object({
	requestId: z.string().min(10),
	requestKey: z.string().min(10)
});

const viewerLoginBody = z.object({
	name: z.string().max(60).optional()
});

const userLimitBody = z.object({
	limit: z.number().int().min(0)
});

const userToggleBody = z.object({
	enabled: z.boolean()
});

const undoActionBody = z.object({
	token: z.string().min(12)
});

const userIdParams = z.object({
	userId: z.string().min(3)
});

const normalizePhoneNumber = (input) => {
	let digits = String(input || '').replace(/\D/g, '');

	if (digits.startsWith('0')) {
		digits = `62${digits.slice(1)}`;
	}

	return digits;
};

const normalizeUserJid = (input) => {
	let raw = String(input || '').trim();

	try {
		raw = decodeURIComponent(raw);
	} catch {
		// Keep raw as-is when decode fails.
	}

	raw = raw.replace(/\.json$/i, '');

	if (raw.endsWith('@c.us')) {
		raw = raw.replace(/@c\.us$/i, S_WHATSAPP_NET);
	}

	if (raw.endsWith(S_WHATSAPP_NET)) {
		return raw;
	}

	if (raw.includes('@')) {
		const localPart = raw.split('@')[0].replace(/\D/g, '');

		if (!localPart) {
			return null;
		}

		return `${localPart}${S_WHATSAPP_NET}`;
	}

	const digits = raw.replace(/\D/g, '');

	if (!digits) {
		return null;
	}

	return `${digits}${S_WHATSAPP_NET}`;
};

const getUserLimitFilePath = (jid) => path.join(USERS_LIMIT_DIR, `${jid}.json`);

const defaultLimitState = (jid) => ({
	id: jid,
	limit: 30,
	role: 'FREE'
});

const readBannedUsers = async () => {
	if (!(await fs.pathExists(USERS_BANNED_PATH))) {
		await fs.ensureDir(path.dirname(USERS_BANNED_PATH));
		await fs.writeJSON(USERS_BANNED_PATH, [], { spaces: 2 });
		return [];
	}

	const list = await fs.readJSON(USERS_BANNED_PATH);

	return Array.isArray(list) ? list : [];
};

const writeBannedUsers = async (list) => {
	await fs.ensureDir(path.dirname(USERS_BANNED_PATH));
	await fs.writeJSON(USERS_BANNED_PATH, Array.from(new Set(list)), { spaces: 2 });
};

const readUserLimitState = async (jid) => {
	const filePath = getUserLimitFilePath(jid);

	if (!(await fs.pathExists(filePath))) {
		const fallback = defaultLimitState(jid);

		await fs.ensureDir(USERS_LIMIT_DIR);
		await fs.writeJSON(filePath, fallback, { spaces: 2 });
		return fallback;
	}

	const raw = await fs.readJSON(filePath);

	return {
		id: normalizeUserJid(raw?.id) || jid,
		limit: Math.max(0, Number(raw?.limit || 0)),
		role: raw?.role === 'PREMIUM' ? 'PREMIUM' : 'FREE'
	};
};

const writeUserLimitState = async (jid, data) => {
	const nextState = {
		id: jid,
		limit: Math.max(0, Number(data?.limit || 0)),
		role: data?.role === 'PREMIUM' ? 'PREMIUM' : 'FREE'
	};

	await fs.ensureDir(USERS_LIMIT_DIR);
	await fs.writeJSON(getUserLimitFilePath(jid), nextState, { spaces: 2 });
	configuration.user.limit.set(jid, { limit: nextState.limit, role: nextState.role });

	return nextState;
};

const redactUserIdMiddle = (rawId) => {
	const safeId = String(rawId || '').trim();

	if (!safeId) {
		return safeId;
	}

	const [localPart, domainPart] = safeId.split('@');
	const local = String(localPart || '');

	if (local.length <= 6) {
		return domainPart ? `${local}@${domainPart}` : local;
	}

	const prefix = local.slice(0, 3);
	const suffix = local.slice(-3);
	const middle = '*'.repeat(Math.max(1, local.length - 6));
	const masked = `${prefix}${middle}${suffix}`;

	return domainPart ? `${masked}@${domainPart}` : masked;
};

const listDashboardUsers = async ({ redactNumbers = false } = {}) => {
	await fs.ensureDir(USERS_LIMIT_DIR);
	const files = (await fs.readdir(USERS_LIMIT_DIR)).filter((name) => name.endsWith('.json'));
	const bannedUsers = await readBannedUsers();
	const bannedSet = new Set(bannedUsers);
	const blockSet = new Set(Array.isArray(configuration.cache?.blocklist) ? configuration.cache.blocklist : []);

	const users = await Promise.all(
		files.map(async (fileName) => {
			const filePath = path.join(USERS_LIMIT_DIR, fileName);
			const raw = await fs.readJSON(filePath).catch(() => null);
			const id = normalizeUserJid(raw?.id || fileName.replace(/\.json$/i, ''));

			if (!id) {
				return null;
			}

			const limit = Math.max(0, Number(raw?.limit || 0));
			const role = raw?.role === 'PREMIUM' ? 'PREMIUM' : 'FREE';

			return {
				id: redactNumbers ? redactUserIdMiddle(id) : id,
				limit,
				role,
				premium: role === 'PREMIUM',
				banned: bannedSet.has(id),
				blocked: blockSet.has(id)
			};
		})
	);

	return users.filter(Boolean).sort((a, b) => a.id.localeCompare(b.id));
};

const setDashboardUserLimit = async (userId, limit) => {
	const jid = normalizeUserJid(userId);

	if (!jid) {
		return { ok: false, message: 'Invalid user id.' };
	}

	const current = await readUserLimitState(jid);
	const next = await writeUserLimitState(jid, {
		...current,
		limit: Math.max(0, Number(limit || 0))
	});

	return { ok: true, user: next };
};

const setDashboardUserPremium = async (userId, enabled) => {
	const jid = normalizeUserJid(userId);

	if (!jid) {
		return { ok: false, message: 'Invalid user id.' };
	}

	const current = await readUserLimitState(jid);
	const next = await writeUserLimitState(jid, {
		...current,
		role: enabled ? 'PREMIUM' : 'FREE'
	});

	return { ok: true, user: next };
};

const setDashboardUserBanned = async (userId, enabled) => {
	const jid = normalizeUserJid(userId);

	if (!jid) {
		return { ok: false, message: 'Invalid user id.' };
	}

	const list = await readBannedUsers();
	const set = new Set(list);

	if (enabled) {
		set.add(jid);
	} else {
		set.delete(jid);
	}

	const next = Array.from(set);

	await writeBannedUsers(next);
	configuration.cache.bannedlist = next;

	return { ok: true, userId: jid, banned: enabled };
};

const setDashboardUserBlocked = async (userId, enabled) => {
	const jid = normalizeUserJid(userId);

	if (!jid) {
		return { ok: false, message: 'Invalid user id.' };
	}

	const waClient = global.client?.instance || null;

	if (!waClient?.updateBlockStatus) {
		return { ok: false, status: 503, message: 'WhatsApp client is not connected yet.' };
	}

	await waClient.updateBlockStatus(jid, enabled ? 'block' : 'unblock');

	const list = Array.isArray(configuration.cache?.blocklist) ? [...configuration.cache.blocklist] : [];
	const set = new Set(list);

	if (enabled) {
		set.add(jid);
	} else {
		set.delete(jid);
	}

	configuration.cache.blocklist = Array.from(set);

	return { ok: true, userId: jid, blocked: enabled };
};

const cleanExpiredUndoActions = () => {
	const now = Date.now();

	for (const [token, entry] of undoActionStore.entries()) {
		if (Number(entry?.expiresAt || 0) <= now) {
			undoActionStore.delete(token);
		}
	}
};

const registerUndoAction = ({ kind, target, before = null, actionLabel = 'Undo', ttlMs = UNDO_WINDOW_MS, risk = 'low' }) => {
	if (!kind || !target || before === null || typeof before === 'undefined') {
		return null;
	}

	cleanExpiredUndoActions();
	const safeTtlMs = Math.max(2000, Number(ttlMs || UNDO_WINDOW_MS));

	const token = crypto.randomBytes(18).toString('hex');
	const expiresAt = Date.now() + safeTtlMs;

	undoActionStore.set(token, {
		token,
		kind,
		target,
		before,
		expiresAt,
		actionLabel,
		risk: risk === 'high' ? 'high' : risk === 'medium' ? 'medium' : 'low'
	});

	return {
		token,
		expiresAt,
		ttlMs: safeTtlMs,
		actionLabel,
		risk: risk === 'high' ? 'high' : risk === 'medium' ? 'medium' : 'low'
	};
};

const applyUndoAction = async (entry) => {
	if (!entry?.kind) {
		return { ok: false, status: 400, message: 'Invalid undo action.' };
	}

	if (entry.kind === 'command.toggle') {
		const result = await setDashboardCommandState(configuration, entry.target, Boolean(entry.before?.enabled));

		if (!result.ok) {
			return { ok: false, status: 404, message: result.message || 'Command no longer exists.' };
		}

		return { ok: true, kind: entry.kind, target: entry.target, state: { enabled: Boolean(entry.before?.enabled) } };
	}

	if (entry.kind === 'flag.toggle') {
		const result = await setDashboardFlagState(configuration, entry.target, Boolean(entry.before?.enabled));

		if (!result.ok) {
			return { ok: false, status: 404, message: result.message || 'Flag no longer exists.' };
		}

		return { ok: true, kind: entry.kind, target: entry.target, state: { enabled: Boolean(entry.before?.enabled) } };
	}

	if (entry.kind === 'user.limit') {
		const result = await setDashboardUserLimit(entry.target, Number(entry.before?.limit || 0));

		if (!result.ok) {
			return { ok: false, status: 400, message: result.message || 'Unable to restore user limit.' };
		}

		return { ok: true, kind: entry.kind, target: result.user.id, state: { limit: result.user.limit } };
	}

	if (entry.kind === 'user.premium') {
		const result = await setDashboardUserPremium(entry.target, Boolean(entry.before?.premium));

		if (!result.ok) {
			return { ok: false, status: 400, message: result.message || 'Unable to restore premium role.' };
		}

		return {
			ok: true,
			kind: entry.kind,
			target: result.user.id,
			state: { premium: result.user.role === 'PREMIUM' }
		};
	}

	if (entry.kind === 'user.banned') {
		const result = await setDashboardUserBanned(entry.target, Boolean(entry.before?.banned));

		if (!result.ok) {
			return { ok: false, status: 400, message: result.message || 'Unable to restore banned state.' };
		}

		return { ok: true, kind: entry.kind, target: result.userId, state: { banned: result.banned } };
	}

	if (entry.kind === 'user.blocked') {
		const result = await setDashboardUserBlocked(entry.target, Boolean(entry.before?.blocked));

		if (!result.ok) {
			return { ok: false, status: result.status || 400, message: result.message || 'Unable to restore block state.' };
		}

		return { ok: true, kind: entry.kind, target: result.userId, state: { blocked: result.blocked } };
	}

	return { ok: false, status: 400, message: 'Unsupported undo action.' };
};

const getCookie = (req, name) => {
	const raw = req.headers.cookie || '';
	const entries = raw.split(';').map((value) => value.trim());

	for (const entry of entries) {
		const [key, ...rest] = entry.split('=');

		if (key === name) {
			return decodeURIComponent(rest.join('='));
		}
	}

	return null;
};

function cleanExpiredSessions() {
	const now = Date.now();

	for (const [token, value] of sessionStore.entries()) {
		if (value.expiresAt <= now) {
			sessionStore.delete(token);
		}
	}
}

const hasActiveOwnerSession = (phoneNumber) => {
	cleanExpiredSessions();

	for (const session of sessionStore.values()) {
		if (session.role !== 'owner') {
			continue;
		}

		if (!isSessionLive(session)) {
			continue;
		}

		if (normalizePhoneNumber(session.phoneNumber) === phoneNumber) {
			return true;
		}
	}

	return false;
};

const cleanExpiredOtps = () => {
	const now = Date.now();

	for (const [phone, value] of otpStore.entries()) {
		if (value.expiresAt <= now) {
			otpStore.delete(phone);
		}
	}
};

const getSessionFromRequest = (req) => {
	cleanExpiredSessions();
	const token = getCookie(req, AUTH_COOKIE_NAME);

	if (!token || !sessionStore.has(token)) {
		return null;
	}

	const currentSession = sessionStore.get(token);
	const nextSession = {
		...currentSession,
		lastSeenAt: Date.now()
	};

	sessionStore.set(token, nextSession);

	return {
		token,
		...nextSession
	};
};

const isDashboardAuthenticated = (req) => Boolean(getSessionFromRequest(req));

const requireDashboardAuth = (req, res, next) => {
	const session = getSessionFromRequest(req);

	if (!session) {
		return res.status(401).json({ ok: false, message: 'Unauthorized' });
	}

	req.dashboardSession = session;

	next();
};

const requireOwnerAuth = (req, res, next) => {
	const session = getSessionFromRequest(req);

	if (!session) {
		return res.status(401).json({ ok: false, message: 'Unauthorized' });
	}

	if (session.role !== 'owner') {
		return res.status(403).json({ ok: false, message: 'Owner permission required.' });
	}

	req.dashboardSession = session;

	next();
};

const getOwnerNumbers = async () => {
	const settings = await fs.readJSON('./src/helper/config/settings.json');
	const ownerCandidates = [settings.owner_number, ...(settings.team_number || [])]
		.filter(Boolean)
		.map((value) => normalizePhoneNumber(String(value).split('@')[0]));

	return new Set(ownerCandidates);
};

function getWhatsAppClient() {
	const runtimeClient = global.client?.instance;

	return runtimeClient || null;
}

const hashValue = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

const createSession = (res, payload) => {
	const token = crypto.randomBytes(32).toString('hex');

	sessionStore.set(token, {
		...payload,
		lastSeenAt: Date.now(),
		expiresAt: Date.now() + SESSION_TTL_MS
	});
	persistSessionStore();

	res.cookie(AUTH_COOKIE_NAME, token, {
		httpOnly: true,
		sameSite: 'lax',
		maxAge: SESSION_TTL_MS,
		path: '/'
	});
};

const sendConfirmationButton = async ({ waClient, to, buttonId, phoneNumber }) => {
	if (waClient.TemplateBuilder?.Native) {
		const builder = new waClient.TemplateBuilder.Native();

		await builder
			.destination(to)
			.body('A dashboard login request was made for your owner account. Confirm if this was you.')
			.footer(`Requested number: ${phoneNumber}`)
			.buttons(
				builder.button.reply({
					display: 'Confirm Login',
					id: buttonId
				})
			)
			.send();

		return;
	}

	await waClient.send(to, {
		text: `Dashboard login request detected.\n\nReply this exact code to confirm:\n${buttonId}`
	});
};

export const processDashboardConfirmationAction = ({ actionId, senderJid }) => {
	cleanExpiredOtps();

	const id = String(actionId || '').trim();

	if (!id.startsWith('dashauth:confirm:')) {
		return { handled: false };
	}

	const parts = id.split(':');

	if (parts.length !== 4) {
		return { handled: true, approved: false, message: 'Malformed confirmation button payload.' };
	}

	const [, , requestId, token] = parts;
	const phoneNumber = normalizePhoneNumber(String(senderJid || '').split('@')[0]);
	const otpData = otpStore.get(phoneNumber);

	if (!otpData || otpData.expiresAt <= Date.now()) {
		otpStore.delete(phoneNumber);
		return { handled: true, approved: false, message: 'Confirmation request expired.' };
	}

	if (otpData.requestId !== requestId) {
		return { handled: true, approved: false, message: 'Confirmation request mismatch.' };
	}

	if (otpData.actionTokenHash !== hashValue(token)) {
		return { handled: true, approved: false, message: 'Invalid confirmation token.' };
	}

	otpData.status = 'approved';
	otpData.confirmedAt = Date.now();
	otpStore.set(phoneNumber, otpData);

	return { handled: true, approved: true, phoneNumber };
};

async function webmToMp4Buffer(inputBuffer) {
	return new Promise((resolve, reject) => {
		const ffmpeg = spawn('ffmpeg', [
			'-i',
			'pipe:0',
			'-f',
			'mp4',
			'-movflags',
			'frag_keyframe+empty_moov',
			'-preset',
			'ultrafast',
			'-an',
			'pipe:1'
		]);

		const chunks = [];
		let stderr = '';

		ffmpeg.stdout.on('data', (chunk) => chunks.push(chunk));
		ffmpeg.stderr.on('data', (data) => (stderr += data.toString()));

		ffmpeg.on('close', (code) => {
			if (code === 0) {
				resolve(Buffer.concat(chunks));
			} else {
				reject(new Error(`ffmpeg exited with code ${code}: ${stderr}`));
			}
		});

		ffmpeg.stdin.write(inputBuffer);
		ffmpeg.stdin.end();
	});
}

export const server = () => {
	if (configuration.expressInstances.has('dashboard')) {
		return;
	}

	loadSessionStore();
	loadAuditStore();

	const app = express();
	const httpServer = createServer(app);
	const io = new SocketIOServer(httpServer, {
		path: '/socket.io',
		serveClient: true
	});
	const PORT = 4000;

	const getSocketSession = (socket) => {
		const cookie = String(socket?.handshake?.headers?.cookie || '');
		const requestLike = {
			headers: {
				cookie
			}
		};

		return getSessionFromRequest(requestLike);
	};

	const emitRealtimeSnapshot = async (socket) => {
		const session = socket?.data?.session || null;

		if (!session) {
			return;
		}

		socket.emit('dashboard:status', await getDashboardStatus());
		socket.emit('dashboard:commands', {
			commands: listDashboardCommands(configuration)
		});
		socket.emit('dashboard:flags', {
			flags: listDashboardFlags(configuration)
		});
		socket.emit('dashboard:users', {
			users: await listDashboardUsers({
				redactNumbers: session.role !== 'owner'
			})
		});

		if (session.role === 'owner') {
			const logsPayload = getDashboardLogs({ since: 0, limit: 250 });

			socket.data.lastLogId = Number(logsPayload?.lastId || 0);
			socket.emit('dashboard:logs', logsPayload);

			const filters = sanitizeAuditRealtimeFilters(socket.data?.auditFilters || {});
			const auditPayload = getDashboardAuditLogs({
				since: 0,
				limit: filters.limit,
				action: filters.action,
				role: filters.role,
				query: filters.query
			});

			socket.data.lastAuditId = Number(auditPayload?.lastId || 0);
			socket.emit('dashboard:audit', auditPayload);
		}
	};

	io.use((socket, next) => {
		const session = getSocketSession(socket);

		if (!session) {
			return next(new Error('Unauthorized'));
		}

		socket.data.session = session;
		socket.data.lastLogId = 0;
		socket.data.lastAuditId = 0;
		socket.data.auditFilters = sanitizeAuditRealtimeFilters({});

		next();
	});

	io.on('connection', (socket) => {
		const session = socket.data.session;

		socket.emit('dashboard:session', {
			role: session?.role || 'viewer',
			canEdit: session?.role === 'owner'
		});

		socket.on('dashboard:audit-filters', (incoming) => {
			socket.data.auditFilters = sanitizeAuditRealtimeFilters(incoming);

			if (socket.data.session?.role !== 'owner') {
				return;
			}

			const filters = socket.data.auditFilters;
			const auditPayload = getDashboardAuditLogs({
				since: 0,
				limit: filters.limit,
				action: filters.action,
				role: filters.role,
				query: filters.query
			});

			socket.data.lastAuditId = Number(auditPayload?.lastId || socket.data.lastAuditId || 0);
			socket.emit('dashboard:audit', auditPayload);
		});

		void emitRealtimeSnapshot(socket);
	});

	setInterval(() => {
		void (async () => {
			if (io.of('/').sockets.size === 0) {
				return;
			}

			const status = await getDashboardStatus();

			io.emit('dashboard:status', status);
		})();
	}, 2000);

	setInterval(() => {
		const sockets = Array.from(io.of('/').sockets.values());

		if (!sockets.length) {
			return;
		}

		for (const socket of sockets) {
			const session = socket.data?.session || null;

			if (session?.role !== 'owner') {
				continue;
			}

			const since = Number(socket.data?.lastLogId || 0);
			const logsPayload = getDashboardLogs({ since, limit: 250 });

			socket.data.lastLogId = Number(logsPayload?.lastId || since || 0);

			if (Array.isArray(logsPayload?.logs) && logsPayload.logs.length) {
				socket.emit('dashboard:logs', logsPayload);
			}
		}
	}, 1200);

	setInterval(() => {
		const sockets = Array.from(io.of('/').sockets.values());

		if (!sockets.length) {
			return;
		}

		for (const socket of sockets) {
			const session = socket.data?.session || null;

			if (session?.role !== 'owner') {
				continue;
			}

			const filters = sanitizeAuditRealtimeFilters(socket.data?.auditFilters || {});
			const auditPayload = getDashboardAuditLogs({
				since: 0,
				limit: filters.limit,
				action: filters.action,
				role: filters.role,
				query: filters.query
			});

			socket.data.lastAuditId = Number(auditPayload?.lastId || socket.data.lastAuditId || 0);
			socket.emit('dashboard:audit', auditPayload);
		}
	}, 3000);

	setInterval(() => {
		void (async () => {
			if (io.of('/').sockets.size === 0) {
				return;
			}

			const commands = listDashboardCommands(configuration);
			const flags = listDashboardFlags(configuration);
			const usersForOwner = await listDashboardUsers({ redactNumbers: false });
			const usersForViewer = await listDashboardUsers({ redactNumbers: true });

			io.emit('dashboard:commands', { commands });
			io.emit('dashboard:flags', { flags });

			const sockets = Array.from(io.of('/').sockets.values());

			for (const socket of sockets) {
				const session = socket.data?.session || null;
				const users = session?.role === 'owner' ? usersForOwner : usersForViewer;

				socket.emit('dashboard:users', { users });
			}
		})();
	}, 8000);

	void initializeDashboardMonitor(configuration).catch((error) => {
		loggers.error(color('Dashboard monitor init failed:', '#FF5555'), color(error.message, 'white'));
	});

	app.use(express.json());
	app.use(express.static(path.join(__dirname, 'public')));

	const parseQuery = (query) => {
		const { colors, dimensions, animate, seed, time } = query;

		const SEED = seed !== 'undefined' ? Number(seed) : Math.floor(Math.random() * 10_000);
		const [WIDTH, HEIGHT] = (dimensions || '1280x720').split('x').map(Number);
		const COLORS = (colors || '295C96,D0CBC7,899FB6').split(',').map((c) => `#${c}`);
		const SHOULD_ANIMATE = animate === true;
		const TIME = time ? Number(time) : 2;

		return { SEED, WIDTH, HEIGHT, COLORS, SHOULD_ANIMATE, TIME };
	};

	app.get('/render', validate({ query: gradientQuery }), (req, res) => {
		const { SEED, WIDTH, HEIGHT, COLORS, SHOULD_ANIMATE, TIME } = parseQuery(req.query);

		const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Mesh Gradient</title>
  <script src="http://localhost:${PORT}/build/CCapture.all.min.js"></script>
  <style>
    body, html { margin: 0; padding: 0; overflow: hidden; background: black; }
    canvas { display: block; }
  </style>
</head>
<body>
  <canvas id="canvas" width="${WIDTH}" height="${HEIGHT}"></canvas>
  <script type="module">
    import MeshGradient from "https://esm.sh/mesh-gradient.js";

    function mulberry32(seed) {
      return function() {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    const seedValue = ${SEED};
    const rng = seedValue ? mulberry32(seedValue) : Math.random;
    if (seedValue) Math.random = rng;

    const gradient = new MeshGradient();
    gradient.initGradient('#canvas', ${JSON.stringify(COLORS)});
    gradient.setCanvasSize(${WIDTH}, ${HEIGHT});

    const animate = ${SHOULD_ANIMATE};
    const fps = 30;
    const runningTime = ${TIME} * fps
    const capturer = new CCapture({ format: 'webm', quality: 100, framerate: fps });
    const frames = runningTime;

    let t = seedValue ? 0 : Math.random() * 1000;
    const speed = 0.05;
    let frameCount = 0;
    const interval = 1000 / fps;

    if (animate) capturer.start();

    function renderFrame() {
      gradient.changePosition(t);
      if (animate) capturer.capture(document.querySelector('canvas'));
      t += speed;
      frameCount++;


      if (frameCount < frames) {
        setTimeout(renderFrame, interval);
      } else if (animate) {
        capturer.stop();
        capturer.save(blob => {
          window.finalBlob = blob;
          window.ready = true;
        });
      } else {
        window.ready = true;
      }
    }

    renderFrame();
  </script>
</body>
</html>
`;

		res.send(html);
	});

	app.get('/gradient', validate({ query: gradientQuery }), async (req, res) => {
		const { SEED, WIDTH, HEIGHT, COLORS, SHOULD_ANIMATE, TIME } = parseQuery(req.query);

		const browser = await puppeteer.launch({ headless: 'shell', args: ['--no-sandbox'] });
		const page = await browser.newPage();

		await page.setViewport({ width: WIDTH, height: HEIGHT });

		const url = `http://localhost:${PORT}/render?colors=${COLORS.map((c) => c.replace('#', '')).join(',')}&dimensions=${WIDTH}x${HEIGHT}&animate=${SHOULD_ANIMATE}&seed=${isNaN(SEED) ? 0 : SEED}&time=${TIME}`;

		await page.goto(url, { waitUntil: 'networkidle0' });

		await page.waitForFunction('window.ready === true', { timeout: 0 });

		let buffer;
		let contentType;

		if (SHOULD_ANIMATE) {
			const blobBuffer = await page.evaluate(async () => {
				const arrayBuffer = await window.finalBlob.arrayBuffer();

				return Array.from(new Uint8Array(arrayBuffer));
			});

			buffer = await webmToMp4Buffer(Buffer.from(blobBuffer));

			contentType = 'video/mp4';
		} else {
			buffer = await page.screenshot({ omitBackground: false });
			contentType = 'image/png';
		}

		await browser.close();

		res.setHeader('Content-Type', contentType);
		res.setHeader('Content-Disposition', `inline; filename="gradient.${SHOULD_ANIMATE ? 'mp4' : 'png'}"`);
		res.end(buffer);
	});

	app.get('/', (req, res) => {
		res.redirect('/dashboard/login');
	});

	app.get('/dashboard/login', (req, res) => {
		if (isDashboardAuthenticated(req)) {
			return res.redirect('/dashboard');
		}

		res.sendFile(path.join(__dirname, 'public', 'dashboard', 'login.html'));
	});

	app.get('/dashboard', (req, res) => {
		if (!isDashboardAuthenticated(req)) {
			return res.redirect('/dashboard/login');
		}

		res.sendFile(path.join(__dirname, 'public', 'dashboard', 'index.html'));
	});

	app.post('/api/dashboard/auth/request-code', validate({ body: authRequestBody }), async (req, res) => {
		try {
			cleanExpiredOtps();

			const phoneNumber = normalizePhoneNumber(req.body.phoneNumber);

			if (phoneNumber.length < 9) {
				return res.status(400).json({ ok: false, message: 'Invalid phone number.' });
			}

			const owners = await getOwnerNumbers();

			if (!owners.has(phoneNumber)) {
				return res.status(403).json({ ok: false, message: 'This number does not have owner permission.' });
			}

			if (hasActiveOwnerSession(phoneNumber)) {
				return res.status(409).json({
					ok: false,
					message: 'This owner number is already logged in on dashboard. Please logout first.'
				});
			}

			const previous = otpStore.get(phoneNumber);

			if (previous && Date.now() - previous.createdAt < OTP_COOLDOWN_MS) {
				return res.status(429).json({ ok: false, message: 'Please wait before requesting another code.' });
			}

			const waClient = getWhatsAppClient();

			if (!waClient?.send) {
				return res.status(503).json({ ok: false, message: 'WhatsApp client is not connected yet.' });
			}

			const requestId = crypto.randomBytes(16).toString('hex');
			const requestKey = crypto.randomBytes(24).toString('hex');
			const actionToken = crypto.randomBytes(24).toString('hex');
			const buttonId = `dashauth:confirm:${requestId}:${actionToken}`;
			const expiresAt = Date.now() + OTP_TTL_MS;

			otpStore.set(phoneNumber, {
				requestId,
				requestKeyHash: hashValue(requestKey),
				actionTokenHash: hashValue(actionToken),
				status: 'pending',
				createdAt: Date.now(),
				expiresAt,
				confirmedAt: null
			});

			await sendConfirmationButton({
				waClient,
				to: `${phoneNumber}@s.whatsapp.net`,
				buttonId,
				phoneNumber
			});

			loggers.info(color('Dashboard login confirmation sent to', 'white'), color(phoneNumber, '#E4C1F9'));
			res.json({
				ok: true,
				message: 'Confirmation request sent to your WhatsApp.',
				requestId,
				requestKey
			});
		} catch (error) {
			loggers.error(color('Failed to send dashboard confirmation:', '#FF5555'), color(error.message, 'white'));
			res.status(500).json({ ok: false, message: 'Failed to send code. Try again.' });
		}
	});

	app.post('/api/dashboard/auth/confirmation-status', validate({ body: confirmationStatusBody }), async (req, res) => {
		cleanExpiredOtps();

		const phoneNumber = normalizePhoneNumber(req.body.phoneNumber);
		const { requestId, requestKey } = req.body;

		const owners = await getOwnerNumbers();

		if (!owners.has(phoneNumber)) {
			return res.status(403).json({ ok: false, message: 'This number does not have owner permission.' });
		}

		const otpData = otpStore.get(phoneNumber);

		if (!otpData || otpData.expiresAt <= Date.now()) {
			otpStore.delete(phoneNumber);
			return res.status(400).json({ ok: false, message: 'Confirmation expired or not found. Request a new code.' });
		}

		if (otpData.requestId !== requestId) {
			return res.status(400).json({ ok: false, message: 'Request mismatch. Start over.' });
		}

		if (otpData.requestKeyHash !== hashValue(requestKey)) {
			return res.status(403).json({ ok: false, message: 'Invalid request key.' });
		}

		return res.json({ ok: true, status: otpData.status || 'pending' });
	});

	app.post('/api/dashboard/auth/finalize-confirmation', validate({ body: finalizeConfirmationBody }), async (req, res) => {
		cleanExpiredOtps();
		const { requestId, requestKey } = req.body;

		const phoneEntry = Array.from(otpStore.entries()).find(([, value]) => value.requestId === requestId);

		if (!phoneEntry) {
			return res.status(400).json({ ok: false, message: 'Confirmation request not found.' });
		}

		const [phoneNumber, otpData] = phoneEntry;

		if (otpData.expiresAt <= Date.now()) {
			otpStore.delete(phoneNumber);
			return res.status(400).json({ ok: false, message: 'Confirmation request expired.' });
		}

		if (otpData.requestKeyHash !== hashValue(requestKey)) {
			return res.status(403).json({ ok: false, message: 'Invalid request key.' });
		}

		if (otpData.status !== 'approved') {
			return res.status(400).json({ ok: false, message: 'Request is not approved yet.' });
		}

		otpStore.delete(phoneNumber);
		createSession(res, {
			role: 'owner',
			phoneNumber,
			name: 'Owner'
		});
		pushAuditEvent({
			action: 'auth.owner_login',
			session: { role: 'owner', phoneNumber, name: 'Owner' },
			target: 'dashboard',
			message: 'Owner login confirmed by WhatsApp.'
		});

		loggers.info(color('Dashboard login verified for', 'white'), color(phoneNumber, '#E4C1F9'));
		res.json({ ok: true });
	});

	app.post('/api/dashboard/auth/viewer-login', validate({ body: viewerLoginBody }), (req, res) => {
		const name = (req.body?.name || 'Viewer').trim() || 'Viewer';

		createSession(res, {
			role: 'viewer',
			phoneNumber: null,
			name
		});

		pushAuditEvent({
			action: 'auth.viewer_login',
			session: { role: 'viewer', phoneNumber: null, name },
			target: 'dashboard',
			message: 'Viewer session started.'
		});

		res.json({ ok: true, role: 'viewer' });
	});

	app.get('/api/dashboard/auth/session', (req, res) => {
		const session = getSessionFromRequest(req);

		res.json({
			ok: true,
			authenticated: Boolean(session),
			phoneNumber: session?.phoneNumber || null,
			role: session?.role || null,
			name: session?.name || null
		});
	});

	app.get('/api/dashboard/changelog', requireDashboardAuth, async (_req, res) => {
		try {
			if (!(await fs.pathExists(ROOT_CHANGELOG_PATH))) {
				return res.status(404).send('Changelog file not found.');
			}

			const markdown = await fs.readFile(ROOT_CHANGELOG_PATH, 'utf8');

			res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
			return res.status(200).send(markdown);
		} catch (error) {
			loggers.error(color('Failed reading root changelog:', '#FF5555'), color(error.message, 'white'));
			return res.status(500).send('Failed to load changelog.');
		}
	});

	app.get('/api/dashboard/contributors', requireDashboardAuth, async (_req, res) => {
		try {
			const contributors = await loadDashboardContributorsFromGit();

			return res.json({
				ok: true,
				totalContributors: contributors.length,
				contributors
			});
		} catch (error) {
			loggers.error(color('Failed loading dashboard contributors:', '#FF5555'), color(error.message, 'white'));
			return res.status(500).json({
				ok: false,
				message: 'Failed to load contributors.',
				totalContributors: 0,
				contributors: []
			});
		}
	});

	app.post('/api/dashboard/auth/logout', (req, res) => {
		const session = getSessionFromRequest(req);
		const token = session?.token || getCookie(req, AUTH_COOKIE_NAME);

		if (token) {
			sessionStore.delete(token);
			persistSessionStore();
		}

		if (session) {
			pushAuditEvent({
				action: 'auth.logout',
				session,
				target: 'dashboard',
				message: 'Session logged out.'
			});
		}

		res.clearCookie(AUTH_COOKIE_NAME, { path: '/' });
		res.json({ ok: true });
	});

	app.get('/api/dashboard/status', requireDashboardAuth, async (_req, res) => {
		res.json(await getDashboardStatus());
	});

	app.get('/api/dashboard/logs', requireDashboardAuth, (req, res) => {
		const session = getSessionFromRequest(req);

		if (session?.role !== 'owner') {
			return res.json({
				lastId: 0,
				logs: [],
				redacted: true
			});
		}

		const since = Number(req.query?.since || 0);
		const limit = Number(req.query?.limit || 200);

		res.json(getDashboardLogs({ since, limit }));
	});

	app.get('/api/dashboard/commands', requireDashboardAuth, (_req, res) => {
		const commands = listDashboardCommands(configuration);

		res.json({
			count: commands.length,
			commands
		});
	});

	app.get('/api/dashboard/flags', requireDashboardAuth, (_req, res) => {
		const flags = listDashboardFlags(configuration);

		res.json({
			count: flags.length,
			flags
		});
	});

	app.get('/api/dashboard/users', requireDashboardAuth, async (req, res) => {
		const session = req.dashboardSession || getSessionFromRequest(req);
		const users = await listDashboardUsers({
			redactNumbers: session?.role !== 'owner'
		});

		res.json({
			count: users.length,
			users
		});
	});

	app.get('/api/dashboard/audit', requireOwnerAuth, (req, res) => {
		const since = Number(req.query?.since || 0);
		const limit = Number(req.query?.limit || 200);
		const action = String(req.query?.action || '');
		const role = String(req.query?.role || '');
		const query = String(req.query?.query || '');

		res.json(getDashboardAuditLogs({ since, limit, action, role, query }));
	});

	app.post('/api/dashboard/actions/undo', requireOwnerAuth, validate({ body: undoActionBody }), async (req, res) => {
		cleanExpiredUndoActions();

		const token = String(req.body?.token || '').trim();
		const entry = undoActionStore.get(token);
		const session = req.dashboardSession || null;

		if (!entry) {
			return res.status(404).json({ ok: false, message: 'Undo token not found or expired.' });
		}

		undoActionStore.delete(token);

		const result = await applyUndoAction(entry);

		if (!result.ok) {
			pushAuditEvent({
				action: 'undo.apply',
				session,
				target: entry.target,
				status: 'failed',
				message: result.message || 'Undo operation failed.',
				before: { kind: entry.kind }
			});

			return res.status(result.status || 400).json(result);
		}

		pushAuditEvent({
			action: 'undo.apply',
			session,
			target: result.target || entry.target,
			before: { kind: entry.kind },
			after: result.state || null
		});

		res.json({ ok: true, undone: entry.kind, target: result.target || entry.target, state: result.state || null });
	});

	app.post('/api/dashboard/commands/:commandName', requireOwnerAuth, async (req, res) => {
		const { commandName } = req.params;
		const enabled = Boolean(req.body?.enabled);
		const session = req.dashboardSession || null;
		const previousState = listDashboardCommands(configuration).find((item) => item.name === commandName) || null;
		const result = await setDashboardCommandState(configuration, commandName, enabled);

		if (!result.ok) {
			pushAuditEvent({
				action: 'command.toggle',
				session,
				target: commandName,
				status: 'failed',
				message: result.message || 'Command not found.',
				after: { enabled }
			});
			return res.status(404).json(result);
		}

		pushAuditEvent({
			action: 'command.toggle',
			session,
			target: commandName,
			before: previousState ? { enabled: Boolean(previousState.enabled) } : null,
			after: { enabled }
		});

		const undo =
			previousState && typeof previousState.enabled === 'boolean' && previousState.enabled !== enabled
				? registerUndoAction({
						kind: 'command.toggle',
						target: commandName,
						before: { enabled: Boolean(previousState.enabled) },
						actionLabel: 'Undo Toggle',
						ttlMs: UNDO_WINDOW_SHORT_MS,
						risk: 'low'
					})
				: null;

		loggers.info(
			color('Dashboard changed command state:', 'white'),
			color(commandName, '#E4C1F9'),
			color('=>', 'white'),
			color(enabled ? 'enabled' : 'disabled', enabled ? '#50FA7B' : '#FF5555')
		);

		res.json({ ok: true, commandName, enabled, undo });
	});

	app.post('/api/dashboard/flags/:flagName', requireOwnerAuth, async (req, res) => {
		const { flagName } = req.params;
		const enabled = Boolean(req.body?.enabled);
		const session = req.dashboardSession || null;
		const previousState = listDashboardFlags(configuration).find((item) => item.name === flagName) || null;
		const result = await setDashboardFlagState(configuration, flagName, enabled);

		if (!result.ok) {
			pushAuditEvent({
				action: 'flag.toggle',
				session,
				target: flagName,
				status: 'failed',
				message: result.message || 'Flag not found.',
				after: { enabled }
			});
			return res.status(404).json(result);
		}

		pushAuditEvent({
			action: 'flag.toggle',
			session,
			target: flagName,
			before: previousState ? { enabled: Boolean(previousState.enabled) } : null,
			after: { enabled }
		});

		const undo =
			previousState && typeof previousState.enabled === 'boolean' && previousState.enabled !== enabled
				? registerUndoAction({
						kind: 'flag.toggle',
						target: flagName,
						before: { enabled: Boolean(previousState.enabled) },
						actionLabel: 'Undo Toggle',
						ttlMs: UNDO_WINDOW_SHORT_MS,
						risk: 'low'
					})
				: null;

		loggers.info(
			color('Dashboard changed flag state:', 'white'),
			color(flagName, '#E4C1F9'),
			color('=>', 'white'),
			color(enabled ? 'enabled' : 'disabled', enabled ? '#50FA7B' : '#FF5555')
		);

		res.json({ ok: true, flagName, enabled, undo });
	});

	app.post(
		'/api/dashboard/users/:userId/limit',
		requireOwnerAuth,
		validate({ params: userIdParams, body: userLimitBody }),
		async (req, res) => {
			const session = req.dashboardSession || null;
			const normalizedUserId = normalizeUserJid(req.params.userId);
			const beforeState = normalizedUserId ? await readUserLimitState(normalizedUserId).catch(() => null) : null;
			const result = await setDashboardUserLimit(req.params.userId, req.body.limit);

			if (!result.ok) {
				pushAuditEvent({
					action: 'user.limit',
					session,
					target: req.params.userId,
					status: 'failed',
					message: result.message || 'Invalid user id.',
					after: { limit: req.body.limit }
				});
				return res.status(400).json(result);
			}

			pushAuditEvent({
				action: 'user.limit',
				session,
				target: result.user.id,
				before: beforeState ? { limit: beforeState.limit } : null,
				after: { limit: result.user.limit }
			});

			const undo =
				beforeState && Number(beforeState.limit) !== Number(result.user.limit)
					? registerUndoAction({
							kind: 'user.limit',
							target: result.user.id,
							before: { limit: Number(beforeState.limit || 0) },
							actionLabel: 'Undo Limit',
							ttlMs: UNDO_WINDOW_MEDIUM_MS,
							risk: 'medium'
						})
					: null;

			loggers.info(
				color('Dashboard changed user limit:', 'white'),
				color(result.user.id, '#E4C1F9'),
				color('=>', 'white'),
				color(String(result.user.limit), '#50FA7B')
			);

			res.json({ ok: true, user: result.user, undo });
		}
	);

	app.post(
		'/api/dashboard/users/:userId/premium',
		requireOwnerAuth,
		validate({ params: userIdParams, body: userToggleBody }),
		async (req, res) => {
			const session = req.dashboardSession || null;
			const normalizedUserId = normalizeUserJid(req.params.userId);
			const beforeState = normalizedUserId ? await readUserLimitState(normalizedUserId).catch(() => null) : null;
			const result = await setDashboardUserPremium(req.params.userId, req.body.enabled);

			if (!result.ok) {
				pushAuditEvent({
					action: 'user.premium',
					session,
					target: req.params.userId,
					status: 'failed',
					message: result.message || 'Invalid user id.',
					after: { enabled: req.body.enabled }
				});
				return res.status(400).json(result);
			}

			pushAuditEvent({
				action: 'user.premium',
				session,
				target: result.user.id,
				before: beforeState ? { premium: beforeState.role === 'PREMIUM' } : null,
				after: { premium: result.user.role === 'PREMIUM' }
			});

			const previousPremium = beforeState?.role === 'PREMIUM';
			const nextPremium = result.user.role === 'PREMIUM';
			const undo =
				beforeState && previousPremium !== nextPremium
					? registerUndoAction({
							kind: 'user.premium',
							target: result.user.id,
							before: { premium: previousPremium },
							actionLabel: 'Undo Role',
							ttlMs: UNDO_WINDOW_LONG_MS,
							risk: 'high'
						})
					: null;

			loggers.info(
				color('Dashboard changed user role:', 'white'),
				color(result.user.id, '#E4C1F9'),
				color('=>', 'white'),
				color(result.user.role, result.user.role === 'PREMIUM' ? '#50FA7B' : '#FF5555')
			);

			res.json({ ok: true, user: result.user, undo });
		}
	);

	app.post(
		'/api/dashboard/users/:userId/banned',
		requireOwnerAuth,
		validate({ params: userIdParams, body: userToggleBody }),
		async (req, res) => {
			const session = req.dashboardSession || null;
			const normalizedUserId = normalizeUserJid(req.params.userId);
			const bannedList = await readBannedUsers();
			const beforeBanned = normalizedUserId ? bannedList.includes(normalizedUserId) : null;
			const result = await setDashboardUserBanned(req.params.userId, req.body.enabled);

			if (!result.ok) {
				pushAuditEvent({
					action: 'user.banned',
					session,
					target: req.params.userId,
					status: 'failed',
					message: result.message || 'Invalid user id.',
					after: { banned: req.body.enabled }
				});
				return res.status(400).json(result);
			}

			pushAuditEvent({
				action: 'user.banned',
				session,
				target: result.userId,
				before: beforeBanned === null ? null : { banned: beforeBanned },
				after: { banned: result.banned }
			});

			const undo =
				typeof beforeBanned === 'boolean' && beforeBanned !== result.banned
					? registerUndoAction({
							kind: 'user.banned',
							target: result.userId,
							before: { banned: beforeBanned },
							actionLabel: 'Undo Ban',
							ttlMs: UNDO_WINDOW_LONG_MS,
							risk: 'high'
						})
					: null;

			loggers.info(
				color('Dashboard changed user banned state:', 'white'),
				color(result.userId, '#E4C1F9'),
				color('=>', 'white'),
				color(result.banned ? 'banned' : 'unbanned', result.banned ? '#FF5555' : '#50FA7B')
			);

			res.json({ ok: true, userId: result.userId, banned: result.banned, undo });
		}
	);

	app.post(
		'/api/dashboard/users/:userId/blocked',
		requireOwnerAuth,
		validate({ params: userIdParams, body: userToggleBody }),
		async (req, res) => {
			const session = req.dashboardSession || null;
			const normalizedUserId = normalizeUserJid(req.params.userId);
			const beforeBlocked = normalizedUserId
				? Array.isArray(configuration.cache?.blocklist) && configuration.cache.blocklist.includes(normalizedUserId)
				: null;
			const result = await setDashboardUserBlocked(req.params.userId, req.body.enabled);

			if (!result.ok) {
				pushAuditEvent({
					action: 'user.blocked',
					session,
					target: req.params.userId,
					status: 'failed',
					message: result.message || 'Failed to update block state.',
					after: { blocked: req.body.enabled }
				});
				return res.status(result.status || 400).json(result);
			}

			pushAuditEvent({
				action: 'user.blocked',
				session,
				target: result.userId,
				before: beforeBlocked === null ? null : { blocked: beforeBlocked },
				after: { blocked: result.blocked }
			});

			const undo =
				typeof beforeBlocked === 'boolean' && beforeBlocked !== result.blocked
					? registerUndoAction({
							kind: 'user.blocked',
							target: result.userId,
							before: { blocked: beforeBlocked },
							actionLabel: 'Undo Block',
							ttlMs: UNDO_WINDOW_LONG_MS,
							risk: 'high'
						})
					: null;

			loggers.info(
				color('Dashboard changed user block state:', 'white'),
				color(result.userId, '#E4C1F9'),
				color('=>', 'white'),
				color(result.blocked ? 'blocked' : 'unblocked', result.blocked ? '#FF5555' : '#50FA7B')
			);

			res.json({ ok: true, userId: result.userId, blocked: result.blocked, undo });
		}
	);

	const appToStore = httpServer.listen(PORT, '0.0.0.0', () => {
		loggers.info(color('Server Mesh Gradient', 'white'), color('started on port', '#E4C1F9'), color(PORT, 'white'));
		loggers.info(
			color('Dashboard', 'white'),
			color('available at', '#E4C1F9'),
			color(`http://localhost:${PORT}/dashboard`, 'white')
		);
	});

	configuration.expressInstances.set('dashboard', appToStore);
};
