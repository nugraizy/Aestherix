import { spawn } from 'child_process';
import crypto from 'crypto';
import express from 'express';
import validate from 'express-zod-safe';
import { getAverageColor } from 'fast-average-color-node';
import fs from 'fs-extra';
import { createServer } from 'http';
import os from 'os';
import path from 'path';
import prettier from 'prettier';
import puppeteer from 'puppeteer';
import { Server as SocketIOServer } from 'socket.io';
import { z } from 'zod';

import { color, loggers } from '../../utils/modules/index.js';
import configuration from '../../helper/config/connect.js';
import {
	addToBlocklist,
	appendAuditLog,
	deleteDashboardSession,
	deleteOtp,
	getAuditLogs,
	getDashboardBlocklist,
	getDashboardSessions,
	getLastAuditLogId,
	removeFromBlocklist,
	upsertDashboardSession,
	upsertOtp
} from '../../helper/database/adapters/dashboard.js';
import {
	listPinterestProfilePictures,
	upsertPinterestProfilePictures
} from '../../helper/database/adapters/pinterest-profile-pictures.js';
import {
	banUser,
	getAllUserLimits,
	getBannedUsers,
	getUserLimit,
	unbanUser,
	upsertUserLimit
} from '../../helper/database/adapters/user.js';
import prisma from '../../helper/database/prisma.js';
import { cmdId } from '../../helper/modules/prefix.js';
import {
	getDashboardLogs,
	initializeDashboardMonitor,
	listDashboardCommands,
	listDashboardFlags,
	setDashboardCommandState,
	setDashboardFlagState
} from './monitor.js';

const AUTH_COOKIE_NAME = 'aestherix_dashboard_auth';
const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_COOLDOWN_MS = 60 * 1000;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const LIVE_SESSION_WINDOW_MS = 30 * 1000;
const PROFILE_PICTURE_HISTORY_LIMIT = 900;
const PROFILE_PICTURES_DB_SYNC_THROTTLE_MS = 1000;
const PROFILE_PICTURES_COLOR_TOLERANCE_DEFAULT = 88;
const PROFILE_PICTURES_COLOR_TOLERANCE_MAX = 441;
const PROFILE_PICTURES_COLOR_FILTER_CONCURRENCY = Math.min(
	12,
	Math.max(4, Number(os.availableParallelism?.() || os.cpus()?.length || 6))
);
const PROFILE_PICTURE_COLOR_CACHE_LIMIT = 1500;
const ROOT_CHANGELOG_PATH = path.resolve(process.cwd(), 'CHANGELOG.md');
const EDITOR_ROOT_PATH = path.resolve(process.cwd(), 'src', 'commands');
const EDITOR_MAX_FILE_SIZE = 600 * 1024;
const EDITOR_MAX_NODES = 1400;
const EDITOR_MAX_DEPTH = 8;
const MAX_AUDIT_LOGS = 1000;
const UNDO_WINDOW_MS = 12000;
const UNDO_WINDOW_SHORT_MS = 8000;
const UNDO_WINDOW_MEDIUM_MS = 10000;
const UNDO_WINDOW_LONG_MS = 15000;
const S_WHATSAPP_NET = '@s.whatsapp.net';

const otpStore = new Map();
const sessionStore = new Map();
const undoActionStore = new Map();
const spotifyNowPlayingCache = {
	data: {
		available: false,
		isPlaying: false,
		trackTitle: null,
		artists: null,
		trackId: null,
		trackUri: null,
		trackUrl: null,
		coverUrl: null,
		progressMs: null,
		durationMs: null,
		message: 'Unavailable',
		timestamp: 0
	},
	expiresAt: 0,
	pending: null
};
const auditState = {
	logs: [],
	lastId: 0
};
const profilePicturesDbState = {
	lastSyncAt: 0
};

const deletedPictureTombstones = new Set();
const profilePictureColorCache = new Map();
const profilePictureColorPending = new Map();
const projectVersion = (() => {
	try {
		return fs.readJSONSync('./package.json')?.version || 'unknown';
	} catch {
		return 'unknown';
	}
})();

const DASHBOARD_PORT = Number(process.env.DASHBOARD_PORT || 4000);
const DASHBOARD_BOT_BRIDGE_URL = String(process.env.DASHBOARD_BOT_BRIDGE_URL || 'http://127.0.0.1:4010').replace(/\/+$/, '');
const DASHBOARD_BRIDGE_TOKEN = String(process.env.DASHBOARD_BRIDGE_TOKEN || 'aestherix-local-bridge-token');

const normalizePersistedUserJid = (input) => {
	let raw = String(input || '').trim();

	if (!raw) {
		return null;
	}

	if (raw.endsWith('@c.us')) {
		raw = raw.replace(/@c\.us$/i, S_WHATSAPP_NET);
	}

	if (raw.endsWith(S_WHATSAPP_NET)) {
		const local = raw.split('@')[0].replace(/\D/g, '');

		return local ? `${local}${S_WHATSAPP_NET}` : null;
	}

	const digits = raw.replace(/\D/g, '');

	if (!digits) {
		return null;
	}

	return `${digits}${S_WHATSAPP_NET}`;
};

const getSafeHttpUrl = (value) => {
	const normalized = String(value || '').trim();

	if (!/^https?:\/\//i.test(normalized)) {
		return '';
	}

	return normalized;
};

const getImageVariantsFromMap = (images) => {
	if (!images || typeof images !== 'object') {
		return [];
	}

	const variants = [];

	for (const [key, value] of Object.entries(images)) {
		const url = getSafeHttpUrl(value?.url || value);

		if (!url) {
			continue;
		}

		const width = Number(value?.width || String(key).match(/(\d+)x/i)?.[1] || 0);
		const height = Number(value?.height || String(key).match(/x(\d+)/i)?.[1] || 0);

		variants.push({
			url,
			width: Number.isFinite(width) ? width : 0,
			height: Number.isFinite(height) ? height : 0
		});
	}

	return variants;
};

const normalizePersistedPictureEntry = (entry) => {
	const variants = getImageVariantsFromMap(entry?.images);
	const sortedByArea = [...variants].sort((a, b) => b.width * b.height - a.width * a.height);

	const originalUrl =
		getSafeHttpUrl(entry?.original?.url) ||
		getSafeHttpUrl(entry?.url) ||
		getSafeHttpUrl(entry?.original) ||
		getSafeHttpUrl(entry?.image_url) ||
		getSafeHttpUrl(entry?.image) ||
		getSafeHttpUrl(entry?.images?.orig?.url) ||
		sortedByArea[0]?.url ||
		'';

	if (!/^https?:\/\//i.test(originalUrl)) {
		return null;
	}

	const thumbnailUrl =
		getSafeHttpUrl(entry?.thumbnail?.url) ||
		getSafeHttpUrl(entry?.previewUrl) ||
		getSafeHttpUrl(entry?.thumbnail) ||
		getSafeHttpUrl(entry?.images?.['474x']?.url) ||
		getSafeHttpUrl(entry?.images?.['236x']?.url) ||
		sortedByArea.at(-1)?.url ||
		originalUrl;

	return {
		original: {
			...(entry?.original && typeof entry.original === 'object' ? entry.original : {}),
			url: originalUrl
		},
		thumbnail: {
			...(entry?.thumbnail && typeof entry.thumbnail === 'object' ? entry.thumbnail : {}),
			url: /^https?:\/\//i.test(thumbnailUrl) ? thumbnailUrl : originalUrl
		}
	};
};

const loadDashboardBlocklist = async () => {
	try {
		const list = await getDashboardBlocklist(prisma);

		configuration.cache.blocklist = list.map((jid) => normalizePersistedUserJid(jid)).filter(Boolean);
	} catch (error) {
		loggers.warning(color('Failed loading dashboard blocklist:', 'red'), color(error.message, 'white'));
		configuration.cache.blocklist = Array.isArray(configuration.cache?.blocklist) ? configuration.cache.blocklist : [];
	}
};

const persistDashboardBlocklist = async (addedJids = [], removedJids = []) => {
	try {
		for (const jid of removedJids) {
			if (jid) {
				await removeFromBlocklist(prisma, jid).catch(() => {});
			}
		}

		for (const jid of addedJids) {
			if (jid) {
				await addToBlocklist(prisma, jid).catch(() => {});
			}
		}
	} catch (error) {
		loggers.warning(color('Failed persisting dashboard blocklist:', 'red'), color(error.message, 'white'));
	}
};

const hydrateProfilePicturesCache = async () => {
	if (typeof configuration.pinterestImages?.clear === 'function') {
		configuration.pinterestImages.clear();
	}

	try {
		const entries = await listPinterestProfilePictures(prisma, { limit: PROFILE_PICTURE_HISTORY_LIMIT });

		for (const entry of entries) {
			const timestamp = String(entry?.timestamp || '').trim();
			const normalized = normalizePersistedPictureEntry(entry);

			if (!timestamp || !normalized) {
				continue;
			}

			if (deletedPictureTombstones.has(timestamp)) {
				continue;
			}

			configuration.pinterestImages.set(timestamp, normalized);
		}

		profilePicturesDbState.lastSyncAt = Date.now();
	} catch (error) {
		loggers.warning(color('Failed hydrating dashboard profile pictures:', 'red'), color(error.message, 'white'));
	}
};

const refreshProfilePicturesCacheFromDb = async ({ force = false } = {}) => {
	const now = Date.now();

	if (!force && now - profilePicturesDbState.lastSyncAt < PROFILE_PICTURES_DB_SYNC_THROTTLE_MS) {
		return;
	}

	await hydrateProfilePicturesCache();
};

const applyNoStoreJsonHeaders = (res) => {
	res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
	res.setHeader('Pragma', 'no-cache');
	res.setHeader('Expires', '0');
};

const loadSessionStore = async () => {
	try {
		const now = Date.now();
		const rows = await getDashboardSessions(prisma);

		for (const item of rows) {
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
		loggers.warning(color('Failed loading dashboard sessions:', 'red'), color(error.message, 'white'));
	}
};

const persistSessionStore = async () => {
	try {
		const now = Date.now();

		for (const [token, value] of sessionStore.entries()) {
			if (Number(value?.expiresAt || 0) <= now) {
				sessionStore.delete(token);
				await deleteDashboardSession(prisma, token).catch(() => {});
				continue;
			}

			await upsertDashboardSession(prisma, {
				token,
				role: value.role,
				phoneNumber: value.phoneNumber || null,
				name: value.name || null,
				lastSeenAt: Number(value.lastSeenAt || now),
				expiresAt: Number(value.expiresAt || 0)
			}).catch(() => {});
		}
	} catch (error) {
		loggers.warning(color('Failed persisting dashboard sessions:', 'red'), color(error.message, 'white'));
	}
};

const loadAuditStore = async () => {
	try {
		const logs = await getAuditLogs(prisma, MAX_AUDIT_LOGS);

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
		auditState.lastId = await getLastAuditLogId(prisma);
	} catch (error) {
		loggers.warning(color('Failed loading dashboard audit logs:', 'red'), color(error.message, 'white'));
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

	void appendAuditLog(
		prisma,
		{
			id: auditState.lastId,
			timestamp: auditState.logs.at(-1)?.timestamp || Date.now(),
			action: String(action || 'unknown'),
			actorRole,
			actor,
			target: target ? String(target) : null,
			status: status === 'failed' ? 'failed' : 'ok',
			message: message ? String(message) : null,
			before: before ?? null,
			after: after ?? null
		},
		auditState.lastId
	).catch(() => {});
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

const KV_CONTRIBUTORS_KEY = 'dashboard_contributors';

const getLatestCommitHash = async () => {
	const headers = {
		Accept: 'application/vnd.github+json',
		'User-Agent': 'aestherix-bot'
	};

	if (process.env.GITHUB_AUTH_TOKEN) {
		headers.Authorization = `Bearer ${process.env.GITHUB_AUTH_TOKEN}`;
	}

	const response = await fetch('https://api.github.com/repos/nugraizy/aestherix/commits?per_page=1', { headers });

	if (!response.ok) {
		return null;
	}

	const [commit] = await response.json();

	return commit?.sha || null;
};

const fetchContributorsFromGitHub = async () => {
	const headers = {
		Accept: 'application/vnd.github+json',
		'User-Agent': 'aestherix-bot'
	};

	if (process.env.GITHUB_AUTH_TOKEN) {
		headers.Authorization = `Bearer ${process.env.GITHUB_AUTH_TOKEN}`;
	}

	const response = await fetch('https://api.github.com/repos/nugraizy/aestherix/contributors?per_page=50', { headers });

	if (!response.ok) {
		throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
	}

	const data = await response.json();

	return data
		.filter((user) => user.type === 'User')
		.map((user) => ({
			name: user.login,
			login: user.login,
			email: '',
			commits: user.contributions,
			profileUrl: user.html_url,
			avatarUrl: `https://avatars.githubusercontent.com/${user.login}?size=128`
		}));
};

const loadDashboardContributorsFromGit = async () => {
	const cached = await prisma.dashboardKV.findUnique({ where: { key: KV_CONTRIBUTORS_KEY } });
	const parsed = cached?.value ? JSON.parse(cached.value) : null;
	const latestHash = await getLatestCommitHash();

	if (parsed && latestHash && parsed.commitHash === latestHash) {
		return parsed.contributors;
	}

	const contributors = await fetchContributorsFromGitHub();

	await prisma.dashboardKV.deleteMany({ where: { key: KV_CONTRIBUTORS_KEY } });
	await prisma.dashboardKV.create({
		data: { key: KV_CONTRIBUTORS_KEY, value: JSON.stringify({ commitHash: latestHash, contributors }) }
	});

	return contributors;
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
			trackId: null,
			trackUri: null,
			trackUrl: null,
			progressMs: null,
			durationMs: null,
			message: 'Unavailable',
			timestamp: Date.now()
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
					trackId: data.trackId || null,
					trackUri: data.trackUri || null,
					trackUrl: data.trackUrl || null,
					coverUrl: data.coverUrl || null,
					progressMs: Number(data.progressMs || 0),
					durationMs: Number(data.durationMs || 0),
					message: null,
					timestamp: Date.now()
				};
			}
		} catch {
			// Keep unavailable fallback when Spotify integration is not configured.
		}

		spotifyNowPlayingCache.data = next;
		spotifyNowPlayingCache.expiresAt = Date.now();
		spotifyNowPlayingCache.pending = null;

		return next;
	})();

	return spotifyNowPlayingCache.pending;
};

const getDashboardStatus = async () => {
	const mem = process.memoryUsage();
	const commands = listDashboardCommands(configuration);
	const totalCommands = commands.length;
	const enabledCommands = commands.filter((command) => command.enabled).length;
	const disabledCount = Math.max(0, totalCommands - enabledCommands);
	const flagEntries = Object.entries(configuration.OPTIONS || {}).filter(([, value]) => typeof value === 'boolean');
	const enabledFlags = flagEntries.filter(([, value]) => Boolean(value)).length;
	const spotify = await getSpotifyNowPlaying();

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
			total: totalCommands,
			disabled: disabledCount,
			enabled: enabledCommands
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

const deleteProfilePictureBody = z.object({
	timestamp: z.string().min(1),
	url: z.string().url()
});

const downloadProfilePictureQuery = z.object({
	url: z.string().url(),
	timestamp: z.string().optional()
});

const undoActionBody = z.object({
	token: z.string().min(12)
});

const editorFileQuery = z.object({
	path: z.string().min(1)
});

const editorWriteBody = z.object({
	path: z.string().min(1),
	content: z.string()
});

const editorFormatBody = z.object({
	path: z.string().min(1),
	content: z.string(),
	configJson: z.string().nullable().optional()
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

const extensionFromMime = (mimeType) => {
	const normalized = String(mimeType || '')
		.toLowerCase()
		.split(';')[0]
		.trim();

	if (normalized === 'image/jpeg') {
		return 'jpg';
	}

	if (normalized === 'image/png') {
		return 'png';
	}

	if (normalized === 'image/webp') {
		return 'webp';
	}

	if (normalized === 'image/gif') {
		return 'gif';
	}

	if (normalized === 'image/bmp') {
		return 'bmp';
	}

	if (normalized === 'image/avif') {
		return 'avif';
	}

	if (normalized === 'image/svg+xml') {
		return 'svg';
	}

	return '';
};

const extensionFromUrl = (urlValue) => {
	try {
		const parsed = new URL(String(urlValue || ''));
		const ext = path
			.extname(parsed.pathname || '')
			.replace('.', '')
			.toLowerCase();

		if (!/^[a-z0-9]{2,5}$/i.test(ext)) {
			return '';
		}

		return ext;
	} catch {
		return '';
	}
};

const sanitizeDownloadFilename = (rawValue) => {
	const safeValue = String(rawValue || '')
		.trim()
		.replace(/[^a-z0-9._-]+/gi, '_')
		.replace(/_+/g, '_')
		.slice(0, 120);

	if (!safeValue) {
		return 'album-image';
	}

	return safeValue;
};

const buildProfilePictureFilename = ({ timestamp = '', imageUrl = '', mimeType = '' } = {}) => {
	const base = sanitizeDownloadFilename(timestamp ? `album-${timestamp}` : `album-${Date.now()}`);
	const extension = extensionFromMime(mimeType) || extensionFromUrl(imageUrl) || 'jpg';

	return `${base}.${extension}`;
};

const isBlockedDownloadHost = (hostname) => {
	const safeHost = String(hostname || '')
		.trim()
		.toLowerCase();

	if (!safeHost) {
		return true;
	}

	if (safeHost === 'localhost' || safeHost === '127.0.0.1' || safeHost === '::1') {
		return true;
	}

	return false;
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

const defaultLimitState = (jid) => ({
	id: jid,
	limit: 30,
	role: 'FREE'
});

const readBannedUsers = async () => {
	return getBannedUsers(prisma);
};

const writeBannedUsers = async (list) => {
	const current = await getBannedUsers(prisma);
	const currentSet = new Set(current);
	const newSet = new Set(Array.from(new Set(list)));

	for (const jid of newSet) {
		if (!currentSet.has(jid)) {
			await banUser(prisma, jid).catch(() => {});
		}
	}

	for (const jid of currentSet) {
		if (!newSet.has(jid)) {
			await unbanUser(prisma, jid).catch(() => {});
		}
	}
};

const readUserLimitState = async (jid) => {
	const raw = await getUserLimit(prisma, jid);

	if (!raw) {
		return defaultLimitState(jid);
	}

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

	await upsertUserLimit(prisma, jid, nextState.limit, nextState.role);
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
	const allUsers = await getAllUserLimits(prisma);
	const bannedUsers = await readBannedUsers();
	const bannedSet = new Set(bannedUsers);
	const blockSet = new Set(Array.isArray(configuration.cache?.blocklist) ? configuration.cache.blocklist : []);

	return allUsers
		.map(({ id, limit, role }) => {
			const normalizedId = normalizeUserJid(id);

			if (!normalizedId) {
				return null;
			}

			return {
				id: redactNumbers ? redactUserIdMiddle(normalizedId) : normalizedId,
				limit,
				role,
				premium: role === 'PREMIUM',
				banned: bannedSet.has(normalizedId),
				blocked: blockSet.has(normalizedId)
			};
		})
		.filter(Boolean)
		.sort((a, b) => a.id.localeCompare(b.id));
};

const toImageVariant = (variant, fallbackUrl) => {
	const variantUrl = getSafeHttpUrl(variant?.url) || getSafeHttpUrl(variant) || fallbackUrl;

	if (!variantUrl) {
		return null;
	}

	if (variant && typeof variant === 'object') {
		return {
			...variant,
			url: variantUrl
		};
	}

	return {
		url: variantUrl
	};
};

const normalizeDashboardPicture = (value) => {
	const variants = getImageVariantsFromMap(value?.images);
	const sortedByArea = [...variants].sort((a, b) => b.width * b.height - a.width * a.height);

	const originalUrl =
		getSafeHttpUrl(value?.original?.url) ||
		getSafeHttpUrl(value?.url) ||
		getSafeHttpUrl(value?.original) ||
		getSafeHttpUrl(value?.image_url) ||
		getSafeHttpUrl(value?.image) ||
		getSafeHttpUrl(value?.images?.orig?.url) ||
		sortedByArea[0]?.url ||
		getSafeHttpUrl(value);

	if (!originalUrl) {
		return null;
	}

	const original = toImageVariant(value?.original, originalUrl) || { url: originalUrl };
	const thumbnail = toImageVariant(
		value?.thumbnail,
		getSafeHttpUrl(value?.thumbnail?.url) ||
			getSafeHttpUrl(value?.previewUrl) ||
			getSafeHttpUrl(value?.thumbnail) ||
			getSafeHttpUrl(value?.images?.['474x']?.url) ||
			getSafeHttpUrl(value?.images?.['236x']?.url) ||
			sortedByArea.at(-1)?.url ||
			originalUrl
	) || { url: originalUrl };

	return {
		original,
		thumbnail
	};
};

const normalizeHexColor = (value) => {
	const normalized = String(value || '')
		.trim()
		.replace(/^#/, '');

	if (/^[0-9a-fA-F]{3}$/.test(normalized)) {
		const expanded = normalized
			.split('')
			.map((character) => `${character}${character}`)
			.join('');

		return `#${expanded.toLowerCase()}`;
	}

	if (/^[0-9a-fA-F]{6}$/.test(normalized)) {
		return `#${normalized.toLowerCase()}`;
	}

	if (/^[0-9a-fA-F]{8}$/.test(normalized)) {
		return `#${normalized.slice(0, 6).toLowerCase()}`;
	}

	return '';
};

const hexToRgb = (value) => {
	const normalized = normalizeHexColor(value);

	if (!normalized) {
		return null;
	}

	const hex = normalized.slice(1);

	return {
		r: Number.parseInt(hex.slice(0, 2), 16),
		g: Number.parseInt(hex.slice(2, 4), 16),
		b: Number.parseInt(hex.slice(4, 6), 16)
	};
};

const rgbToHex = ({ r = 0, g = 0, b = 0 } = {}) => {
	const toHex = (channel) => {
		const safe = Math.max(0, Math.min(255, Number(channel) || 0));

		return safe.toString(16).padStart(2, '0');
	};

	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const rgbDistance = (left, right) => {
	if (!left || !right) {
		return Number.POSITIVE_INFINITY;
	}

	const deltaR = Number(left.r || 0) - Number(right.r || 0);
	const deltaG = Number(left.g || 0) - Number(right.g || 0);
	const deltaB = Number(left.b || 0) - Number(right.b || 0);

	return Math.sqrt(deltaR * deltaR + deltaG * deltaG + deltaB * deltaB);
};

const setProfilePictureColorCache = (cacheKey, colorPayload) => {
	if (!cacheKey || !colorPayload) {
		return;
	}

	if (profilePictureColorCache.has(cacheKey)) {
		profilePictureColorCache.delete(cacheKey);
	}

	profilePictureColorCache.set(cacheKey, colorPayload);

	if (profilePictureColorCache.size <= PROFILE_PICTURE_COLOR_CACHE_LIMIT) {
		return;
	}

	const oldestKey = profilePictureColorCache.keys().next().value;

	if (oldestKey) {
		profilePictureColorCache.delete(oldestKey);
	}
};

const getProfilePictureDominantColor = async (url) => {
	const normalizedUrl = getSafeHttpUrl(url);

	if (!normalizedUrl) {
		return null;
	}

	const cacheKey = normalizedUrl.toLowerCase();
	const cached = profilePictureColorCache.get(cacheKey);

	if (cached) {
		return cached;
	}

	const pending = profilePictureColorPending.get(cacheKey);

	if (pending) {
		return pending;
	}

	const task = (async () => {
		try {
			const color = await getAverageColor(normalizedUrl, {
				mode: 'speed'
			});
			const rgb = Array.isArray(color?.value)
				? {
						r: Math.round(Number(color.value[0] || 0)),
						g: Math.round(Number(color.value[1] || 0)),
						b: Math.round(Number(color.value[2] || 0))
					}
				: null;

			if (!rgb) {
				return null;
			}

			const payload = {
				hex: rgbToHex(rgb),
				rgb
			};

			setProfilePictureColorCache(cacheKey, payload);

			return payload;
		} catch {
			return null;
		} finally {
			profilePictureColorPending.delete(cacheKey);
		}
	})();

	profilePictureColorPending.set(cacheKey, task);

	return task;
};

const mapWithConcurrency = async (items, mapper, { concurrency = PROFILE_PICTURES_COLOR_FILTER_CONCURRENCY } = {}) => {
	const safeConcurrency = Math.max(1, Number(concurrency || PROFILE_PICTURES_COLOR_FILTER_CONCURRENCY));
	const input = Array.isArray(items) ? items : [];
	const results = new Array(input.length);
	let index = 0;

	const worker = async () => {
		while (index < input.length) {
			const currentIndex = index;

			index += 1;

			results[currentIndex] = await mapper(input[currentIndex], currentIndex);
		}
	};

	const workers = Array.from({ length: Math.min(safeConcurrency, input.length) }, () => worker());

	await Promise.all(workers);

	return results;
};

const filterDashboardProfilePicturesByColor = async (pictures, { colorHex, tolerance } = {}) => {
	const target = hexToRgb(colorHex);

	if (!target) {
		return Array.isArray(pictures) ? pictures : [];
	}

	const safeTolerance = Math.max(
		0,
		Math.min(PROFILE_PICTURES_COLOR_TOLERANCE_MAX, Number(tolerance || PROFILE_PICTURES_COLOR_TOLERANCE_DEFAULT))
	);
	const source = Array.isArray(pictures) ? pictures : [];
	const matched = await mapWithConcurrency(source, async (picture) => {
		const dominant = await getProfilePictureDominantColor(picture?.url);

		if (!dominant?.rgb) {
			return false;
		}

		return rgbDistance(target, dominant.rgb) <= safeTolerance;
	});

	return source.filter((_picture, pictureIndex) => matched[pictureIndex]);
};

const listDashboardProfilePictures = async ({ limit = 180 } = {}) => {
	await refreshProfilePicturesCacheFromDb();

	const entries = Array.isArray(configuration.pinterestImages?.entries?.()) ? configuration.pinterestImages.entries() : [];
	const safeLimit = Math.max(1, Math.min(500, Number(limit) || 180));
	const seenUrls = new Set();

	const pictures = entries
		.map(([timestamp, value]) => {
			const normalized = normalizeDashboardPicture(value);

			if (!normalized) {
				return null;
			}

			return {
				timestamp: String(timestamp || ''),
				url: normalized.original.url,
				thumbnail: normalized.thumbnail.url
			};
		})
		.filter(Boolean)
		.reverse()
		.filter((picture) => {
			const dedupeKey = picture.url.toLowerCase();

			if (seenUrls.has(dedupeKey)) {
				return false;
			}

			seenUrls.add(dedupeKey);
			return true;
		})
		.slice(0, safeLimit);

	return pictures;
};

const getLatestDashboardProfilePicture = async () => {
	const [latestPicture] = await listDashboardProfilePictures({ limit: 1 });

	return latestPicture || null;
};

const persistDashboardProfilePictures = async () => {
	const seenUrls = new Set();
	const entries = (Array.isArray(configuration.pinterestImages?.entries?.()) ? configuration.pinterestImages.entries() : [])
		.map(([timestamp, value]) => {
			const normalized = normalizeDashboardPicture(value);

			if (!normalized) {
				return null;
			}

			return {
				timestamp: String(timestamp || '').trim(),
				url: normalized.original.url,
				thumbnail: normalized.thumbnail.url
			};
		})
		.filter((entry) => entry && entry.timestamp && /^https?:\/\//i.test(entry.url))
		.reverse()
		.filter((entry) => {
			const dedupeKey = entry.url.toLowerCase();

			if (seenUrls.has(dedupeKey)) {
				return false;
			}

			seenUrls.add(dedupeKey);
			return true;
		})
		.reverse()
		.slice(-PROFILE_PICTURE_HISTORY_LIMIT);

	await upsertPinterestProfilePictures(prisma, entries);
	profilePicturesDbState.lastSyncAt = Date.now();
};

const deleteDashboardProfilePicture = async ({ timestamp = '', url = '' } = {}) => {
	const safeTimestamp = String(timestamp || '').trim();
	const safeUrl = String(url || '').trim();

	if (!safeTimestamp || !/^https?:\/\//i.test(safeUrl)) {
		return { ok: false, message: 'Invalid profile picture payload.' };
	}

	let deletedCount = 0;
	const safeUrlKey = safeUrl.toLowerCase();
	const currentValue = configuration.pinterestImages.get(safeTimestamp);
	const currentUrl = String(normalizeDashboardPicture(currentValue)?.original?.url || '')
		.trim()
		.toLowerCase();

	if (currentUrl && currentUrl === safeUrlKey) {
		configuration.pinterestImages.delete(safeTimestamp);
		deletedPictureTombstones.add(safeTimestamp);
		deletedCount += 1;
	}

	for (const [key, value] of configuration.pinterestImages.entries()) {
		const parsedUrl = String(normalizeDashboardPicture(value)?.original?.url || '')
			.trim()
			.toLowerCase();

		if (parsedUrl && parsedUrl === safeUrlKey) {
			configuration.pinterestImages.delete(key);
			deletedPictureTombstones.add(key);
			deletedCount += 1;
		}
	}

	if (!deletedCount) {
		return { ok: false, message: 'Profile picture not found.' };
	}

	await persistDashboardProfilePictures();

	return { ok: true, deletedCount };
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
	let liveApplied = false;

	if (waClient?.updateBlockStatus) {
		await waClient.updateBlockStatus(jid, enabled ? 'block' : 'unblock');
		liveApplied = true;
	}

	const list = Array.isArray(configuration.cache?.blocklist) ? [...configuration.cache.blocklist] : [];
	const set = new Set(list);

	if (enabled) {
		set.add(jid);
	} else {
		set.delete(jid);
	}

	configuration.cache.blocklist = Array.from(set);
	await persistDashboardBlocklist(enabled ? [jid] : [], enabled ? [] : [jid]);

	return {
		ok: true,
		userId: jid,
		blocked: enabled,
		liveApplied,
		pendingSync: !liveApplied
	};
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

const loadOtpStore = async () => {
	try {
		const now = Date.now();
		const rows = await prisma.dashboardOtp.findMany();
		const seen = new Set();

		for (const item of rows) {
			const phoneNumber = normalizePhoneNumber(item?.phoneNumber || '');
			const expiresAt = Number(item?.expiresAt || 0);

			if (!phoneNumber || expiresAt <= now) {
				continue;
			}

			seen.add(phoneNumber);

			const existing = otpStore.get(phoneNumber);
			const dbCreatedAt = Number(item?.createdAt || now);

			if (existing && Number(existing.createdAt || 0) > dbCreatedAt) {
				continue;
			}

			const status = item?.status === 'approved' ? 'approved' : item?.status === 'rejected' ? 'rejected' : 'pending';

			otpStore.set(phoneNumber, {
				requestId: String(item?.requestId || ''),
				requestKeyHash: String(item?.requestKeyHash || ''),
				actionTokenHash: String(item?.actionTokenHash || ''),
				status,
				createdAt: dbCreatedAt,
				expiresAt,
				confirmedAt: item?.confirmedAt ? Number(item.confirmedAt) : null
			});
		}

		for (const [phone, value] of otpStore.entries()) {
			if (!seen.has(phone) && value.expiresAt <= now) {
				otpStore.delete(phone);
			}
		}
	} catch (error) {
		loggers.warning(color('Failed loading dashboard OTP store:', 'red'), color(error.message, 'white'));
	}
};

const persistOtpStore = async () => {
	try {
		const now = Date.now();

		for (const [phoneNumber, value] of otpStore.entries()) {
			const expiresAt = Number(value?.expiresAt || 0);

			if (expiresAt <= now) {
				otpStore.delete(phoneNumber);
				await deleteOtp(prisma, phoneNumber).catch((error) => {
					loggers.warning(color('Failed deleting expired OTP:', 'red'), color(error.message, 'white'));
				});
				continue;
			}

			const status = value?.status === 'approved' ? 'approved' : value?.status === 'rejected' ? 'rejected' : 'pending';

			await upsertOtp(prisma, {
				phoneNumber,
				requestId: String(value?.requestId || ''),
				requestKeyHash: String(value?.requestKeyHash || ''),
				actionTokenHash: String(value?.actionTokenHash || ''),
				status,
				createdAt: Number(value?.createdAt || now),
				expiresAt,
				confirmedAt: value?.confirmedAt ? Number(value.confirmedAt) : null
			}).catch((error) => {
				loggers.warning(color('Failed upserting OTP for', 'red'), color(phoneNumber, 'lilac'), color(error.message, 'white'));
			});
		}
	} catch (error) {
		loggers.warning(color('Failed persisting dashboard OTP store:', 'red'), color(error.message, 'white'));
	}
};

const cleanExpiredOtps = async () => {
	await loadOtpStore();
	const now = Date.now();

	for (const [phone, value] of otpStore.entries()) {
		if (value.expiresAt <= now) {
			otpStore.delete(phone);
			await deleteOtp(prisma, phone).catch(() => {});
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

const normalizeEditorPath = (value) => {
	const raw = String(value || '')
		.trim()
		.replace(/\\/g, '/')
		.replace(/^\/+/, '');

	if (!raw || raw.includes('\u0000')) {
		return null;
	}

	const resolved = path.resolve(EDITOR_ROOT_PATH, raw);
	const relative = path.relative(EDITOR_ROOT_PATH, resolved);

	if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
		return null;
	}

	return {
		resolved,
		relative: relative.replace(/\\/g, '/')
	};
};

const buildEditorTree = async () => {
	let nodeCount = 0;

	const walk = async (dirPath, relativePath, depth) => {
		if (depth > EDITOR_MAX_DEPTH || nodeCount >= EDITOR_MAX_NODES) {
			return null;
		}

		let entries = [];

		try {
			entries = await fs.readdir(dirPath, { withFileTypes: true });
		} catch {
			return null;
		}

		const children = [];

		for (const entry of entries) {
			if (nodeCount >= EDITOR_MAX_NODES) {
				break;
			}

			if (entry.isSymbolicLink()) {
				continue;
			}

			const nextPath = path.join(dirPath, entry.name);
			const nextRelative = path.join(relativePath, entry.name).replace(/\\/g, '/');

			if (entry.isDirectory()) {
				const child = await walk(nextPath, nextRelative, depth + 1);

				if (child) {
					children.push(child);
					nodeCount += 1;
				}

				continue;
			}

			if (entry.isFile()) {
				children.push({
					type: 'file',
					name: entry.name,
					path: nextRelative
				});
				nodeCount += 1;
			}
		}

		children.sort((a, b) => {
			if (a.type !== b.type) {
				return a.type === 'folder' ? -1 : 1;
			}

			return a.name.localeCompare(b.name);
		});

		return {
			type: 'folder',
			name: relativePath ? path.basename(dirPath) : 'commands',
			path: relativePath,
			children
		};
	};

	return await walk(EDITOR_ROOT_PATH, '', 0);
};

const loadPrettierConfig = async (filePath, configJson) => {
	let baseConfig = {};

	try {
		const resolved = await prettier.resolveConfig(filePath, {
			config: path.resolve(process.cwd(), '.prettierrc.json')
		});

		if (resolved && typeof resolved === 'object') {
			baseConfig = resolved;
		}
	} catch {
		baseConfig = {};
	}

	if (!Object.keys(baseConfig).length) {
		try {
			baseConfig = await fs.readJSON(path.resolve(process.cwd(), '.prettierrc.json'));
		} catch {
			baseConfig = {};
		}
	}

	let customConfig = {};

	if (configJson) {
		try {
			const parsed = JSON.parse(configJson);

			if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
				return { error: 'Custom Prettier config must be a JSON object.' };
			}

			customConfig = parsed;
		} catch {
			return { error: 'Invalid custom Prettier config JSON.' };
		}
	}

	return {
		config: {
			...baseConfig,
			...customConfig,
			filepath: filePath
		}
	};
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

const resolveConfirmationStatus = async ({ phoneNumber, requestId, requestKey }) => {
	await cleanExpiredOtps();

	const normalizedPhone = normalizePhoneNumber(phoneNumber);
	const safeRequestId = String(requestId || '').trim();
	const safeRequestKey = String(requestKey || '').trim();
	const owners = await getOwnerNumbers();

	if (!owners.has(normalizedPhone)) {
		return { ok: false, status: 403, message: 'This number does not have owner permission.' };
	}

	const otpData = otpStore.get(normalizedPhone);

	if (!otpData || otpData.expiresAt <= Date.now()) {
		otpStore.delete(normalizedPhone);
		await persistOtpStore();
		return { ok: false, status: 400, message: 'Confirmation expired or not found. Request a new code.' };
	}

	if (otpData.requestId !== safeRequestId) {
		return { ok: false, status: 400, message: 'Request mismatch. Start over.' };
	}

	if (otpData.requestKeyHash !== hashValue(safeRequestKey)) {
		return { ok: false, status: 403, message: 'Invalid request key.' };
	}

	return { ok: true, status: otpData.status || 'pending' };
};

const createSession = (res, payload) => {
	const token = crypto.randomBytes(32).toString('hex');

	sessionStore.set(token, {
		...payload,
		lastSeenAt: Date.now(),
		expiresAt: Date.now() + SESSION_TTL_MS
	});
	void persistSessionStore();

	res.cookie(AUTH_COOKIE_NAME, token, {
		httpOnly: true,
		sameSite: 'lax',
		maxAge: SESSION_TTL_MS,
		path: '/'
	});
};

const sendConfirmationButton = async ({ waClient, to, approveButtonId, rejectButtonId, phoneNumber }) => {
	if (waClient.TemplateBuilder?.Native) {
		const builder = new waClient.TemplateBuilder.Native();

		await builder
			.destination(to)
			.body('A dashboard login request was made for your owner account. Confirm if this was you.')
			.footer(`Requested number: ${phoneNumber}`)
			.buttons(
				builder.button.reply({
					display: 'Confirm Login',
					id: approveButtonId
				}),
				builder.button.reply({
					display: 'Reject Login',
					id: rejectButtonId
				})
			)
			.send();

		return;
	}

	await waClient.send(to, {
		text: `Dashboard login request detected.\n\nReply one of these codes:\nConfirm: ${approveButtonId}\nReject: ${rejectButtonId}`
	});
};

const sendConfirmationThroughBridge = async ({ to, approveButtonId, rejectButtonId, phoneNumber }) => {
	if (!DASHBOARD_BOT_BRIDGE_URL) {
		return false;
	}

	try {
		const response = await fetch(`${DASHBOARD_BOT_BRIDGE_URL}/internal/dashboard/send-confirmation`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-dashboard-bridge-token': DASHBOARD_BRIDGE_TOKEN
			},
			body: JSON.stringify({
				to,
				approveButtonId,
				rejectButtonId,
				phoneNumber
			})
		});

		if (!response.ok) {
			return false;
		}

		const payload = await response.json().catch(() => ({}));

		return payload?.ok === true;
	} catch {
		return false;
	}
};

const sendRuntimeSyncThroughBridge = async ({ type, payload }) => {
	if (!DASHBOARD_BOT_BRIDGE_URL) {
		return { ok: false, status: 503, message: 'Runtime bridge URL is not configured.' };
	}

	try {
		const response = await fetch(`${DASHBOARD_BOT_BRIDGE_URL}/internal/dashboard/runtime-sync`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-dashboard-bridge-token': DASHBOARD_BRIDGE_TOKEN
			},
			body: JSON.stringify({ type, payload })
		});

		const data = await response.json().catch(() => ({}));

		if (!response.ok) {
			return {
				ok: false,
				status: response.status,
				message: data?.message || 'Runtime bridge request failed.'
			};
		}

		return {
			ok: true,
			data
		};
	} catch {
		return {
			ok: false,
			status: 503,
			message: 'Runtime bridge is not reachable.'
		};
	}
};

const fetchBotLogsThroughBridge = async ({ since = 0, limit = 200 } = {}) => {
	if (!DASHBOARD_BOT_BRIDGE_URL) {
		return { ok: false, status: 503, message: 'Runtime bridge URL is not configured.' };
	}

	try {
		const params = new URLSearchParams({
			since: String(Number(since) || 0),
			limit: String(Math.max(1, Math.min(500, Number(limit) || 200)))
		});

		const response = await fetch(`${DASHBOARD_BOT_BRIDGE_URL}/internal/dashboard/logs?${params.toString()}`, {
			headers: {
				'x-dashboard-bridge-token': DASHBOARD_BRIDGE_TOKEN
			}
		});

		const data = await response.json().catch(() => ({}));

		if (!response.ok) {
			return {
				ok: false,
				status: response.status,
				message: data?.message || 'Bot logs bridge request failed.'
			};
		}

		return {
			ok: true,
			data
		};
	} catch {
		return {
			ok: false,
			status: 503,
			message: 'Bot logs bridge is not reachable.'
		};
	}
};

const requestBotRestartThroughBridge = async () => {
	if (!DASHBOARD_BOT_BRIDGE_URL) {
		return { ok: false, status: 503, message: 'Runtime bridge URL is not configured.' };
	}

	try {
		const response = await fetch(`${DASHBOARD_BOT_BRIDGE_URL}/internal/dashboard/restart`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-dashboard-bridge-token': DASHBOARD_BRIDGE_TOKEN
			}
		});

		const data = await response.json().catch(() => ({}));

		if (!response.ok) {
			return {
				ok: false,
				status: response.status,
				message: data?.message || 'Bot restart bridge request failed.'
			};
		}

		return {
			ok: true,
			data
		};
	} catch {
		return {
			ok: false,
			status: 503,
			message: 'Bot restart bridge is not reachable.'
		};
	}
};

export const processDashboardConfirmationAction = async ({ actionId, senderJid }) => {
	await cleanExpiredOtps();

	const id = String(actionId || '').trim();

	if (!id.startsWith('dashauth:confirm:') && !id.startsWith('dashauth:reject:')) {
		return { handled: false };
	}

	const parts = id.split(':');

	if (parts.length !== 4) {
		return { handled: true, approved: false, message: 'Malformed confirmation button payload.' };
	}

	const [, action, requestId, token] = parts;
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

	if (action === 'reject') {
		otpData.status = 'rejected';
		otpData.confirmedAt = Date.now();
		otpStore.set(phoneNumber, otpData);
		await persistOtpStore();
		return { handled: true, approved: false, message: 'Dashboard login request rejected.' };
	}

	if (action !== 'confirm') {
		return { handled: true, approved: false, message: 'Unknown confirmation action.' };
	}

	otpData.status = 'approved';
	otpData.confirmedAt = Date.now();
	otpStore.set(phoneNumber, otpData);
	await persistOtpStore();

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

export const server = async () => {
	if (configuration.expressInstances.has('dashboard')) {
		return;
	}

	configuration.cache.blocklist = Array.isArray(configuration.cache?.blocklist) ? configuration.cache.blocklist : [];

	if (!configuration?.OPTIONS || typeof configuration.OPTIONS !== 'object') {
		configuration.OPTIONS = {};
	}

	await loadSessionStore();
	await loadAuditStore();
	await loadOtpStore();
	void loadDashboardBlocklist();
	void hydrateProfilePicturesCache();

	const app = express();
	const httpServer = createServer(app);
	const io = new SocketIOServer(httpServer, {
		path: '/socket.io',
		serveClient: true
	});
	const loginIo = io.of('/login');
	const PORT = Number.isFinite(DASHBOARD_PORT) && DASHBOARD_PORT > 0 ? DASHBOARD_PORT : 4000;
	let realtimeBotLogCursor = 0;

	loginIo.on('connection', (socket) => {
		let pollTimer = null;
		let lastStatus = null;

		const stopConfirmationPolling = () => {
			if (pollTimer) {
				clearInterval(pollTimer);
				pollTimer = null;
			}
		};

		const emitConfirmationStatus = async () => {
			if (!socket.data?.confirmation) {
				return;
			}

			const result = await resolveConfirmationStatus(socket.data.confirmation);

			if (!result.ok) {
				socket.emit('dashboard:confirmation:error', {
					message: result.message || 'Confirmation failed.',
					status: result.status || 400
				});
				stopConfirmationPolling();
				return;
			}

			if (result.status === lastStatus) {
				return;
			}

			lastStatus = result.status;
			socket.emit('dashboard:confirmation:status', { status: result.status });

			if (result.status === 'approved' || result.status === 'rejected') {
				stopConfirmationPolling();
			}
		};

		socket.on('dashboard:confirmation:start', (payload) => {
			stopConfirmationPolling();
			lastStatus = null;

			const phoneNumber = normalizePhoneNumber(payload?.phoneNumber || '');
			const requestId = String(payload?.requestId || '').trim();
			const requestKey = String(payload?.requestKey || '').trim();

			if (!phoneNumber || !requestId || !requestKey) {
				socket.emit('dashboard:confirmation:error', { message: 'Invalid confirmation payload.' });
				return;
			}

			socket.data.confirmation = {
				phoneNumber,
				requestId,
				requestKey
			};

			void emitConfirmationStatus();

			pollTimer = setInterval(() => {
				void emitConfirmationStatus();
			}, 1500);
		});

		socket.on('dashboard:confirmation:stop', () => {
			socket.data.confirmation = null;
			stopConfirmationPolling();
		});

		socket.on('disconnect', () => {
			stopConfirmationPolling();
		});
	});

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
		socket.emit('dashboard:profile-pictures', {
			picture: await getLatestDashboardProfilePicture()
		});

		if (session.role === 'owner') {
			const logsPayload = getDashboardLogs({ since: 0, limit: 250 });

			socket.data.lastLogId = Number(logsPayload?.lastId || 0);
			socket.emit('dashboard:logs', logsPayload);

			const botLogsResult = await fetchBotLogsThroughBridge({ since: 0, limit: 250 });

			if (botLogsResult.ok) {
				const botLogsPayload = botLogsResult.data || { lastId: 0, logs: [] };

				socket.data.lastBotLogId = Number(botLogsPayload?.lastId || 0);
				realtimeBotLogCursor = Math.max(realtimeBotLogCursor, socket.data.lastBotLogId);
				socket.emit('dashboard:bot-logs', botLogsPayload);
			} else {
				socket.emit('dashboard:bot-logs', {
					ok: false,
					message: botLogsResult.message || 'Bot log stream is not reachable.',
					lastId: Number(socket.data.lastBotLogId || 0),
					logs: []
				});
			}

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
		socket.data.lastBotLogId = 0;
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
	}, 1000);

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
		void (async () => {
			const sockets = Array.from(io.of('/').sockets.values()).filter((socket) => socket.data?.session?.role === 'owner');

			if (!sockets.length) {
				return;
			}

			const result = await fetchBotLogsThroughBridge({ since: realtimeBotLogCursor, limit: 250 });

			if (!result.ok) {
				for (const socket of sockets) {
					socket.emit('dashboard:bot-logs', {
						ok: false,
						message: result.message || 'Bot log stream is not reachable.',
						lastId: Number(socket.data?.lastBotLogId || realtimeBotLogCursor || 0),
						logs: []
					});
				}

				return;
			}

			const payload = result.data || { lastId: realtimeBotLogCursor, logs: [] };

			realtimeBotLogCursor = Number(payload?.lastId || realtimeBotLogCursor || 0);

			if (!Array.isArray(payload?.logs) || payload.logs.length === 0) {
				return;
			}

			for (const socket of sockets) {
				socket.data.lastBotLogId = realtimeBotLogCursor;
				socket.emit('dashboard:bot-logs', payload);
			}
		})();
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
			const latestPicture = await getLatestDashboardProfilePicture();

			io.emit('dashboard:commands', { commands });
			io.emit('dashboard:flags', { flags });
			io.emit('dashboard:profile-pictures', { picture: latestPicture });

			const sockets = Array.from(io.of('/').sockets.values());

			for (const socket of sockets) {
				const session = socket.data?.session || null;
				const users = session?.role === 'owner' ? usersForOwner : usersForViewer;

				socket.emit('dashboard:users', { users });
			}
		})();
	}, 8000);

	void initializeDashboardMonitor(configuration).catch((error) => {
		loggers.error(color('Dashboard monitor init failed:', 'red'), color(error.message, 'white'));
	});

	app.use(express.json());
	app.use(
		express.static(path.join(__dirname, 'public'), {
			index: false
		})
	);

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
		res.sendFile(path.join(__dirname, 'public', 'dashboard', 'home.html'));
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

	app.get('/dashboard/editor', (req, res) => {
		const session = getSessionFromRequest(req);

		if (!session) {
			return res.redirect('/dashboard/login');
		}

		if (session.role !== 'owner') {
			return res.status(403).sendFile(path.join(__dirname, 'public', 'dashboard', '403.html'));
		}

		res.sendFile(path.join(__dirname, 'public', 'dashboard', 'index.html'));
	});

	app.get('/albums', (req, res) => {
		if (!isDashboardAuthenticated(req)) {
			return res.redirect('/dashboard/login');
		}

		res.sendFile(path.join(__dirname, 'public', 'dashboard', 'index.html'));
	});

	app.post('/api/dashboard/auth/request-code', validate({ body: authRequestBody }), async (req, res) => {
		try {
			await cleanExpiredOtps();

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

			const requestId = crypto.randomBytes(16).toString('hex');
			const requestKey = crypto.randomBytes(24).toString('hex');
			const actionToken = crypto.randomBytes(24).toString('hex');
			const approveActionId = `dashauth:confirm:${requestId}:${actionToken}`;
			const rejectActionId = `dashauth:reject:${requestId}:${actionToken}`;
			const approveButtonId = cmdId('dashconfirm', approveActionId);
			const rejectButtonId = cmdId('dashconfirm', rejectActionId);
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
			await persistOtpStore();

			const recipient = `${phoneNumber}@s.whatsapp.net`;
			let sent = false;

			if (waClient?.send) {
				await sendConfirmationButton({
					waClient,
					to: recipient,
					approveButtonId,
					rejectButtonId,
					phoneNumber
				});
				sent = true;
			} else {
				sent = await sendConfirmationThroughBridge({
					to: recipient,
					approveButtonId,
					rejectButtonId,
					phoneNumber
				});
			}

			if (!sent) {
				otpStore.delete(phoneNumber);
				await persistOtpStore();
				return res.status(503).json({
					ok: false,
					message: 'WhatsApp bridge is not reachable yet. Please ensure bot process is online and try again.'
				});
			}

			loggers.info(color('Dashboard login confirmation sent to', 'white'), color(phoneNumber, 'lilac'));
			res.json({
				ok: true,
				message: 'Confirmation request sent to your WhatsApp.',
				requestId,
				requestKey
			});
		} catch (error) {
			loggers.error(color('Failed to send dashboard confirmation:', 'red'), color(error.message, 'white'));
			res.status(500).json({ ok: false, message: 'Failed to send code. Try again.' });
		}
	});

	app.post('/api/dashboard/auth/confirmation-status', validate({ body: confirmationStatusBody }), async (req, res) => {
		const result = await resolveConfirmationStatus({
			phoneNumber: req.body.phoneNumber,
			requestId: req.body.requestId,
			requestKey: req.body.requestKey
		});

		if (!result.ok) {
			return res.status(result.status || 400).json({ ok: false, message: result.message || 'Request failed.' });
		}

		return res.json({ ok: true, status: result.status || 'pending' });
	});

	app.post('/api/dashboard/auth/finalize-confirmation', validate({ body: finalizeConfirmationBody }), async (req, res) => {
		await cleanExpiredOtps();
		const { requestId, requestKey } = req.body;

		const phoneEntry = Array.from(otpStore.entries()).find(([, value]) => value.requestId === requestId);

		if (!phoneEntry) {
			return res.status(400).json({ ok: false, message: 'Confirmation request not found.' });
		}

		const [phoneNumber, otpData] = phoneEntry;

		if (otpData.expiresAt <= Date.now()) {
			otpStore.delete(phoneNumber);
			await persistOtpStore();
			return res.status(400).json({ ok: false, message: 'Confirmation request expired.' });
		}

		if (otpData.requestKeyHash !== hashValue(requestKey)) {
			return res.status(403).json({ ok: false, message: 'Invalid request key.' });
		}

		if (otpData.status !== 'approved') {
			return res.status(400).json({ ok: false, message: 'Request is not approved yet.' });
		}

		otpStore.delete(phoneNumber);
		await persistOtpStore();
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

		loggers.info(color('Dashboard login verified for', 'white'), color(phoneNumber, 'lilac'));
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
			loggers.error(color('Failed reading root changelog:', 'red'), color(error.message, 'white'));
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
			loggers.error(color('Failed loading dashboard contributors:', 'red'), color(error.message, 'white'));
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
			void persistSessionStore();
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

	app.get('/api/dashboard/spotify', async (_req, res) => {
		res.json({ ok: true, spotify: await getSpotifyNowPlaying() });
	});

	app.get('/api/dashboard/editor/tree', requireOwnerAuth, async (_req, res) => {
		applyNoStoreJsonHeaders(res);
		const tree = await buildEditorTree();

		if (!tree) {
			return res.status(500).json({ ok: false, message: 'Failed building command tree.' });
		}

		return res.json({ ok: true, root: tree });
	});

	app.get('/api/dashboard/editor/file', requireOwnerAuth, validate({ query: editorFileQuery }), async (req, res) => {
		applyNoStoreJsonHeaders(res);
		const resolved = normalizeEditorPath(req.query?.path);

		if (!resolved) {
			return res.status(400).json({ ok: false, message: 'Invalid file path.' });
		}

		try {
			const stats = await fs.stat(resolved.resolved);

			if (!stats.isFile()) {
				return res.status(400).json({ ok: false, message: 'Path is not a file.' });
			}

			if (stats.size > EDITOR_MAX_FILE_SIZE) {
				return res.status(413).json({ ok: false, message: 'File is too large to open.' });
			}

			const content = await fs.readFile(resolved.resolved, 'utf8');

			return res.json({ ok: true, path: resolved.relative, content });
		} catch (error) {
			return res.status(404).json({ ok: false, message: error?.message || 'File not found.' });
		}
	});

	app.post('/api/dashboard/editor/file', requireOwnerAuth, validate({ body: editorWriteBody }), async (req, res) => {
		applyNoStoreJsonHeaders(res);
		const resolved = normalizeEditorPath(req.body?.path);
		const content = String(req.body?.content ?? '');

		if (!resolved) {
			return res.status(400).json({ ok: false, message: 'Invalid file path.' });
		}

		if (Buffer.byteLength(content, 'utf8') > EDITOR_MAX_FILE_SIZE) {
			return res.status(413).json({ ok: false, message: 'File is too large to save.' });
		}

		try {
			const stats = await fs.stat(resolved.resolved);

			if (!stats.isFile()) {
				return res.status(400).json({ ok: false, message: 'Path is not a file.' });
			}

			await fs.writeFile(resolved.resolved, content, 'utf8');
			pushAuditEvent({
				action: 'editor.save',
				session: req.dashboardSession,
				target: resolved.relative,
				message: 'Command file saved.'
			});

			return res.json({ ok: true, path: resolved.relative });
		} catch (error) {
			return res.status(500).json({ ok: false, message: error?.message || 'Failed saving file.' });
		}
	});

	app.post('/api/dashboard/editor/format', requireOwnerAuth, validate({ body: editorFormatBody }), async (req, res) => {
		applyNoStoreJsonHeaders(res);
		const resolved = normalizeEditorPath(req.body?.path);
		const content = String(req.body?.content ?? '');
		const configJson = req.body?.configJson ?? null;

		if (!resolved) {
			return res.status(400).json({ ok: false, message: 'Invalid file path.' });
		}

		const configResult = await loadPrettierConfig(resolved.resolved, configJson);

		if (configResult?.error) {
			return res.status(400).json({ ok: false, message: configResult.error });
		}

		try {
			const formatted = await prettier.format(content, configResult.config);

			return res.json({ ok: true, content: formatted });
		} catch (error) {
			return res.status(400).json({ ok: false, message: error?.message || 'Failed formatting file.' });
		}
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

	app.get('/api/dashboard/logs/dashboard', requireDashboardAuth, (req, res) => {
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

	app.get('/api/dashboard/logs/bot', requireDashboardAuth, async (req, res) => {
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
		const result = await fetchBotLogsThroughBridge({ since, limit });

		if (!result.ok) {
			return res.status(result.status || 503).json({
				ok: false,
				message: result.message || 'Failed loading bot logs.',
				lastId: since,
				logs: []
			});
		}

		return res.json(result.data || { lastId: since, logs: [] });
	});

	app.post('/api/dashboard/bot/restart', requireOwnerAuth, async (_req, res) => {
		const result = await requestBotRestartThroughBridge();

		if (!result.ok) {
			return res.status(result.status || 503).json({ ok: false, message: result.message || 'Failed restarting bot.' });
		}

		return res.json({ ok: true, restarting: true });
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

	app.get('/api/dashboard/prefix', requireDashboardAuth, (_req, res) => {
		const prefixConfig = configuration.cache?.prefixConfig || {};
		const settings = fs.readJSONSync('./src/helper/config/settings.json', { throws: false }) || {};
		const settingsPrefix = settings.prefix || {};

		res.json({
			mode: prefixConfig.multi ? 'multi' : prefixConfig.nopref ? 'nopref' : 'single',
			pref: prefixConfig.pref || settingsPrefix.pref || '.',
			multi: prefixConfig.multi ?? Boolean(settingsPrefix.multi),
			nopref: prefixConfig.nopref ?? Boolean(settingsPrefix.nopref),
			cliPrefixes: prefixConfig.cliPrefixes || [],
			prefixValues: prefixConfig.prefixValues || []
		});
	});

	app.post('/api/dashboard/prefix', requireOwnerAuth, async (req, res) => {
		const session = req.dashboardSession || null;
		const { mode, pref } = req.body || {};

		if (!['single', 'multi', 'nopref'].includes(mode)) {
			pushAuditEvent({
				action: 'prefix.change',
				session,
				target: 'prefix',
				status: 'failed',
				message: 'Invalid prefix mode. Must be single, multi, or nopref.'
			});
			return res.status(400).json({ ok: false, message: 'Invalid mode. Must be single, multi, or nopref.' });
		}

		let newPrefixConfig;
		let newPrefixReg = null;
		let newPrefixValues = [];
		const currentPrefixConfig = configuration.cache?.prefixConfig || {};
		const currentMode = currentPrefixConfig.multi ? 'multi' : currentPrefixConfig.nopref ? 'nopref' : 'single';

		if (mode === 'multi') {
			const cliPrefixes = Array.isArray(req.body.prefixes)
				? req.body.prefixes.filter((p) => typeof p === 'string' && p.length > 0)
				: [];
			const baseMultiChars = '°π÷×¶∆£¢€¥®™✓_=+|~!#$%^&./\\©^>';

			newPrefixValues = cliPrefixes.length ? [...new Set([...baseMultiChars, ...cliPrefixes])] : [...baseMultiChars];
			const escCharClass = (str) => str.replace(/[[\]\\^$]/g, (m) => `\\${m}`);
			const escaped = newPrefixValues.map(escCharClass).join('');

			newPrefixReg = new RegExp(`^[${escaped}]`);
			newPrefixConfig = {
				multi: true,
				nopref: false,
				pref: '.',
				cliPrefixes,
				prefixValues: newPrefixValues
			};
		} else if (mode === 'nopref') {
			newPrefixConfig = {
				multi: false,
				nopref: true,
				pref: pref || '.',
				cliPrefixes: [],
				prefixValues: []
			};
			newPrefixValues = [];
		} else {
			const singlePref = typeof pref === 'string' && pref.length > 0 ? pref[0] : '.';

			newPrefixConfig = {
				multi: false,
				nopref: false,
				pref: singlePref,
				cliPrefixes: [],
				prefixValues: [singlePref]
			};
			newPrefixValues = [singlePref];
		}

		const sameArray = (left, right) =>
			Array.isArray(left) &&
			Array.isArray(right) &&
			left.length === right.length &&
			left.every((value, index) => value === right[index]);

		const isSameConfig =
			currentMode === mode &&
			currentPrefixConfig.pref === newPrefixConfig.pref &&
			Boolean(currentPrefixConfig.multi) === Boolean(newPrefixConfig.multi) &&
			Boolean(currentPrefixConfig.nopref) === Boolean(newPrefixConfig.nopref) &&
			sameArray(currentPrefixConfig.cliPrefixes || [], newPrefixConfig.cliPrefixes || []) &&
			sameArray(currentPrefixConfig.prefixValues || [], newPrefixConfig.prefixValues || []);

		if (isSameConfig) {
			return res.json({
				ok: true,
				mode,
				pref: newPrefixConfig.pref,
				multi: newPrefixConfig.multi,
				nopref: newPrefixConfig.nopref
			});
		}

		configuration.cache.prefixConfig = newPrefixConfig;
		configuration.cache.prefixMode = mode;
		configuration.cache.prefixReg = newPrefixReg;
		configuration.cache.prefixValues = newPrefixValues;
		configuration.cache.prf = mode === 'nopref' ? '' : newPrefixConfig.pref || '.';

		const settingsPath = './src/helper/config/settings.json';
		const currentSettings = await fs.readJSON(settingsPath).catch(() => ({}));

		currentSettings.prefix = {
			multi: newPrefixConfig.multi,
			nopref: newPrefixConfig.nopref,
			pref: newPrefixConfig.pref,
			customPrefixes: newPrefixConfig.cliPrefixes || []
		};
		await fs.writeJSON(settingsPath, currentSettings, { spaces: 2 }).catch(() => {});

		pushAuditEvent({
			action: 'prefix.change',
			session,
			target: 'prefix',
			before: {
				mode: configuration.cache.prefixConfig?.multi
					? 'multi'
					: configuration.cache.prefixConfig?.nopref
						? 'nopref'
						: 'single',
				pref: configuration.cache.prefixConfig?.pref
			},
			after: { mode, pref: newPrefixConfig.pref }
		});

		loggers.info(
			color('Dashboard changed prefix:', 'white'),
			color(mode, 'lilac'),
			color('pref:', 'white'),
			color(newPrefixConfig.pref, 'lilac')
		);

		res.json({ ok: true, mode, pref: newPrefixConfig.pref, multi: newPrefixConfig.multi, nopref: newPrefixConfig.nopref });
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

	app.get('/api/dashboard/profile-pictures', requireDashboardAuth, async (req, res) => {
		applyNoStoreJsonHeaders(res);

		const limit = Number(req.query?.limit || 100);
		const color = normalizeHexColor(req.query?.color);
		const tolerance = Math.max(
			0,
			Math.min(PROFILE_PICTURES_COLOR_TOLERANCE_MAX, Number(req.query?.tolerance || PROFILE_PICTURES_COLOR_TOLERANCE_DEFAULT))
		);
		let pictures = await listDashboardProfilePictures({ limit });

		if (color) {
			pictures = await filterDashboardProfilePicturesByColor(pictures, {
				colorHex: color,
				tolerance
			});
		}

		res.json({
			count: pictures.length,
			pictures,
			filter: color
				? {
						color,
						tolerance
					}
				: null
		});
	});

	app.get(
		'/api/dashboard/profile-pictures/download',
		requireDashboardAuth,
		validate({ query: downloadProfilePictureQuery }),
		async (req, res) => {
			const imageUrl = String(req.query?.url || '').trim();
			const timestamp = String(req.query?.timestamp || '').trim();

			let parsedUrl;

			try {
				parsedUrl = new URL(imageUrl);
			} catch {
				return res.status(400).json({ ok: false, message: 'Invalid image URL.' });
			}

			if (!/^https?:$/i.test(parsedUrl.protocol) || isBlockedDownloadHost(parsedUrl.hostname)) {
				return res.status(400).json({ ok: false, message: 'Image URL is not allowed.' });
			}

			let upstream;

			try {
				upstream = await fetch(parsedUrl.toString(), { redirect: 'follow' });
			} catch {
				return res.status(502).json({ ok: false, message: 'Failed fetching image source.' });
			}

			if (!upstream.ok) {
				return res.status(502).json({ ok: false, message: 'Image source is unavailable.' });
			}

			const mimeType = String(upstream.headers.get('content-type') || 'application/octet-stream');
			const filename = buildProfilePictureFilename({
				timestamp,
				imageUrl: parsedUrl.toString(),
				mimeType
			});
			const encodedFilename = encodeURIComponent(filename);

			const bytes = Buffer.from(await upstream.arrayBuffer());

			res.setHeader('Content-Type', mimeType);
			res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`);
			res.setHeader('Cache-Control', 'no-store');
			res.setHeader('X-Content-Type-Options', 'nosniff');

			res.send(bytes);
		}
	);

	app.delete(
		'/api/dashboard/profile-pictures',
		requireOwnerAuth,
		validate({ body: deleteProfilePictureBody }),
		async (req, res) => {
			const session = req.dashboardSession || null;
			const payload = {
				timestamp: String(req.body?.timestamp || '').trim(),
				url: String(req.body?.url || '').trim()
			};

			const result = await deleteDashboardProfilePicture(payload);

			if (!result.ok) {
				pushAuditEvent({
					action: 'profile_picture.delete',
					session,
					target: payload.timestamp || payload.url || 'profile-picture',
					status: 'failed',
					message: result.message || 'Failed deleting profile picture.'
				});

				return res.status(404).json({
					ok: false,
					message: result.message || 'Profile picture not found.'
				});
			}

			io.emit('dashboard:profile-pictures', {
				picture: await getLatestDashboardProfilePicture(),
				deleted: payload
			});

			pushAuditEvent({
				action: 'profile_picture.delete',
				session,
				target: payload.timestamp || payload.url || 'profile-picture',
				message: 'Owner deleted a profile picture from albums.'
			});

			const pictures = await listDashboardProfilePictures();

			res.json({
				ok: true,
				count: pictures.length,
				pictures
			});
		}
	);

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

		if (!getWhatsAppClient()?.send) {
			const runtimeSync = await sendRuntimeSyncThroughBridge({
				type: 'command.toggle',
				payload: {
					commandName,
					enabled
				}
			});

			if (!runtimeSync.ok) {
				return res.status(runtimeSync.status || 503).json({ ok: false, message: runtimeSync.message });
			}
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
			color(commandName, 'lilac'),
			color('=>', 'white'),
			color(enabled ? 'enabled' : 'disabled', enabled ? 'green' : 'red')
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

		if (!getWhatsAppClient()?.send) {
			const runtimeSync = await sendRuntimeSyncThroughBridge({
				type: 'flag.toggle',
				payload: {
					flagName,
					enabled
				}
			});

			if (!runtimeSync.ok) {
				return res.status(runtimeSync.status || 503).json({ ok: false, message: runtimeSync.message });
			}
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
			color(flagName, 'lilac'),
			color('⤑ ', 'white'),
			color(enabled ? 'enabled' : 'disabled', enabled ? 'green' : 'red')
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

			if (!getWhatsAppClient()?.send) {
				const runtimeSync = await sendRuntimeSyncThroughBridge({
					type: 'user.limit',
					payload: {
						userId: result.user.id,
						limit: result.user.limit
					}
				});

				if (!runtimeSync.ok) {
					return res.status(runtimeSync.status || 503).json({ ok: false, message: runtimeSync.message });
				}
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
				color(result.user.id, 'lilac'),
				color('=>', 'white'),
				color(String(result.user.limit), 'green')
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

			if (!getWhatsAppClient()?.send) {
				const runtimeSync = await sendRuntimeSyncThroughBridge({
					type: 'user.premium',
					payload: {
						userId: result.user.id,
						enabled: result.user.role === 'PREMIUM'
					}
				});

				if (!runtimeSync.ok) {
					return res.status(runtimeSync.status || 503).json({ ok: false, message: runtimeSync.message });
				}
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
				color(result.user.id, 'lilac'),
				color('=>', 'white'),
				color(result.user.role, result.user.role === 'PREMIUM' ? 'green' : 'red')
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

			if (!getWhatsAppClient()?.send) {
				const runtimeSync = await sendRuntimeSyncThroughBridge({
					type: 'user.banned',
					payload: {
						userId: result.userId,
						enabled: result.banned
					}
				});

				if (!runtimeSync.ok) {
					return res.status(runtimeSync.status || 503).json({ ok: false, message: runtimeSync.message });
				}
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
				color(result.userId, 'lilac'),
				color('=>', 'white'),
				color(result.banned ? 'banned' : 'unbanned', result.banned ? 'red' : 'green')
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

			if (!getWhatsAppClient()?.send || result.pendingSync) {
				const runtimeSync = await sendRuntimeSyncThroughBridge({
					type: 'user.blocked',
					payload: {
						userId: result.userId,
						enabled: result.blocked
					}
				});

				if (!runtimeSync.ok) {
					return res.status(runtimeSync.status || 503).json({ ok: false, message: runtimeSync.message });
				}

				result.liveApplied = true;
				result.pendingSync = false;
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
				color(result.userId, 'lilac'),
				color('=>', 'white'),
				color(result.blocked ? 'blocked' : 'unblocked', result.blocked ? 'red' : 'green')
			);

			res.json({
				ok: true,
				userId: result.userId,
				blocked: result.blocked,
				liveApplied: Boolean(result.liveApplied),
				pendingSync: Boolean(result.pendingSync),
				undo
			});
		}
	);

	app.use('/api', (req, res) => {
		res.status(404).json({ ok: false, message: 'API route not found.' });
	});

	app.use((req, res) => {
		res.status(404).sendFile(path.join(__dirname, 'public', 'dashboard', '404.html'));
	});

	const appToStore = httpServer.listen(PORT, '0.0.0.0', () => {
		loggers.info(color('Server Mesh Gradient', 'white'), color('started on port', 'lilac'), color(PORT, 'white'));
		loggers.info(
			color('Dashboard', 'white'),
			color('available at', 'lilac'),
			color(`http://localhost:${PORT}/dashboard`, 'white')
		);
	});

	configuration.expressInstances.set('dashboard', appToStore);

	configuration.dashboardIO = io;
};
