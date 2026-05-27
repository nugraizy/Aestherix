import crypto from 'crypto';
import fs from 'fs-extra';

import {
	deleteDashboardSession,
	deleteOtp,
	getDashboardSessions,
	upsertDashboardSession,
	upsertOtp
} from '../../../src/helper/database/adapters/dashboard.js';
import { color, loggers } from '../../../src/utils/modules/index.js';
import { getEmbeddedWaClient } from '../lib/client.js';

export const AUTH_COOKIE_NAME = 'aestherix_dashboard_auth';
export const OTP_TTL_MS = 5 * 60 * 1000;
export const OTP_COOLDOWN_MS = 60 * 1000;
export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
export const LIVE_SESSION_WINDOW_MS = 30 * 1000;

const SETTINGS_PATH = './src/helper/config/settings.json';

function normalizePhoneNumber(input) {
	let digits = String(input || '').replace(/\D/g, '');

	if (digits.startsWith('0')) {
		digits = `62${digits.slice(1)}`;
	}

	return digits;
}

function hashValue(value) {
	return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function getCookie(req, name) {
	const raw = req.headers.cookie || '';
	const entries = raw.split(';').map((value) => value.trim());

	for (const entry of entries) {
		const [key, ...rest] = entry.split('=');

		if (key === name) {
			return decodeURIComponent(rest.join('='));
		}
	}

	return null;
}

function isSessionLive(session) {
	return Date.now() - Number(session?.lastSeenAt || 0) <= LIVE_SESSION_WINDOW_MS;
}

async function getOwnerNumbers() {
	const settings = await fs.readJSON(SETTINGS_PATH);
	const superOwner = normalizePhoneNumber(String(settings.owner_number || '').split('@')[0]);
	const all = [settings.owner_number, ...(settings.team_number || [])]
		.filter(Boolean)
		.map((value) => normalizePhoneNumber(String(value).split('@')[0]));

	return { all: new Set(all), superOwner };
}

function getWhatsAppClient() {
	return getEmbeddedWaClient();
}

export function createAuthService({ prisma, audit, botBridge } = {}) {
	if (!prisma) {
		throw new Error('auth.service: prisma is required');
	}

	const otpStore = new Map();
	const sessionStore = new Map();

	function cleanExpiredSessions() {
		const now = Date.now();

		for (const [token, value] of sessionStore.entries()) {
			if (Number(value?.expiresAt || 0) <= now) {
				sessionStore.delete(token);
			}
		}
	}

	async function loadSessionStore() {
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
					role: item?.role === 'superOwner' ? 'superOwner' : item?.role === 'owner' ? 'owner' : 'viewer',
					phoneNumber: item?.phoneNumber || null,
					name: item?.name || null,
					lastSeenAt: Number(item?.lastSeenAt || now),
					expiresAt
				});
			}
		} catch (error) {
			loggers.warning(color('Failed loading dashboard sessions:', 'red'), color(error.message, 'white'));
		}
	}

	async function persistSessionStore() {
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
	}

	async function loadOtpStore() {
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
	}

	async function persistOtpStore() {
		try {
			const now = Date.now();

			for (const [phoneNumber, value] of otpStore.entries()) {
				const expiresAt = Number(value?.expiresAt || 0);

				if (expiresAt <= now) {
					otpStore.delete(phoneNumber);
					await deleteOtp(prisma, phoneNumber).catch(() => {});
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
				}).catch(() => {});
			}
		} catch (error) {
			loggers.warning(color('Failed persisting dashboard OTP store:', 'red'), color(error.message, 'white'));
		}
	}

	async function cleanExpiredOtps() {
		await loadOtpStore();
		const now = Date.now();

		for (const [phone, value] of otpStore.entries()) {
			if (value.expiresAt <= now) {
				otpStore.delete(phone);
				await deleteOtp(prisma, phone).catch(() => {});
			}
		}
	}

	function hasActiveOwnerSession(phoneNumber) {
		cleanExpiredSessions();

		const target = normalizePhoneNumber(phoneNumber);

		for (const session of sessionStore.values()) {
			if (session.role !== 'owner') {
				continue;
			}

			if (!isSessionLive(session)) {
				continue;
			}

			if (normalizePhoneNumber(session.phoneNumber) === target) {
				return true;
			}
		}

		return false;
	}

	function getSessionFromRequest(req) {
		cleanExpiredSessions();
		const token = getCookie(req, AUTH_COOKIE_NAME);

		if (!token || !sessionStore.has(token)) {
			return null;
		}

		const current = sessionStore.get(token);
		const next = { ...current, lastSeenAt: Date.now() };

		sessionStore.set(token, next);

		return { token, ...next };
	}

	function isAuthenticated(req) {
		return Boolean(getSessionFromRequest(req));
	}

	function createCookie(res, payload) {
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

		return token;
	}

	async function sendConfirmationButton({ to, approveButtonId, rejectButtonId, phoneNumber, loginRole }) {
		const isGroupAdmin = loginRole === 'groupAdmin';
		const bodyText = isGroupAdmin
			? 'A group manager login request was made for the dashboard. Confirm if this was you.'
			: 'A dashboard login request was made for your owner account. Confirm if this was you.';
		const waClient = getWhatsAppClient();

		if (waClient?.send) {
			if (waClient.TemplateBuilder?.Native) {
				const builder = new waClient.TemplateBuilder.Native();

				await builder
					.destination(to)
					.body(bodyText)
					.footer(`Requested number: ${phoneNumber}`)
					.buttons(
						builder.button.reply({ display: 'Confirm Login', id: approveButtonId }),
						builder.button.reply({ display: 'Reject Login', id: rejectButtonId })
					)
					.send();

				return true;
			}

			await waClient.send(to, {
				text: `${bodyText}\n\nReply one of these codes:\nConfirm: ${approveButtonId}\nReject: ${rejectButtonId}`
			});
			return true;
		}

		if (botBridge?.sendConfirmation) {
			const bridgeResult = await botBridge.sendConfirmation({
				to,
				approveButtonId,
				rejectButtonId,
				phoneNumber
			});

			return Boolean(bridgeResult?.ok);
		}

		return false;
	}

	async function issueOtp({ phoneNumber: rawPhone, role: loginRole }) {
		await cleanExpiredOtps();

		const phoneNumber = normalizePhoneNumber(rawPhone);

		if (phoneNumber.length < 9) {
			return { ok: false, status: 400, message: 'Invalid phone number.' };
		}

		const owners = await getOwnerNumbers();

		if (!owners.all.has(phoneNumber)) {
			return { ok: false, status: 403, message: 'This number does not have owner permission.' };
		}

		if (hasActiveOwnerSession(phoneNumber)) {
			return {
				ok: false,
				status: 409,
				message: 'This owner number is already logged in on dashboard. Please logout first.'
			};
		}

		const previous = otpStore.get(phoneNumber);

		if (previous && Date.now() - previous.createdAt < OTP_COOLDOWN_MS) {
			const retryAfter = Math.ceil((OTP_COOLDOWN_MS - (Date.now() - previous.createdAt)) / 1000);

			return { ok: false, status: 429, message: 'Please wait before requesting another code.', retryAfter };
		}

		const requestId = crypto.randomBytes(16).toString('hex');
		const requestKey = crypto.randomBytes(24).toString('hex');
		const actionToken = crypto.randomBytes(24).toString('hex');
		const approveActionId = `dashauth:confirm:${requestId}:${actionToken}`;
		const rejectActionId = `dashauth:reject:${requestId}:${actionToken}`;
		const approveButtonId = approveActionId;
		const rejectButtonId = rejectActionId;
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
		const sent = await sendConfirmationButton({
			to: recipient,
			approveButtonId,
			rejectButtonId,
			phoneNumber,
			loginRole
		});

		if (!sent) {
			otpStore.delete(phoneNumber);
			await persistOtpStore();
			return {
				ok: false,
				status: 503,
				message: 'WhatsApp bridge is not reachable yet. Please ensure bot process is online and try again.'
			};
		}

		loggers.info(color('Dashboard login confirmation sent to', 'white'), color(phoneNumber, 'lilac'));

		return {
			ok: true,
			message: 'Confirmation request sent to your WhatsApp.',
			requestId,
			requestKey
		};
	}

	async function getConfirmationStatus({ phoneNumber: rawPhone, requestId, requestKey }) {
		await cleanExpiredOtps();

		const phoneNumber = normalizePhoneNumber(rawPhone);
		const safeRequestId = String(requestId || '').trim();
		const safeRequestKey = String(requestKey || '').trim();
		const owners = await getOwnerNumbers();

		if (!owners.all.has(phoneNumber)) {
			return { ok: false, status: 403, message: 'This number does not have owner permission.' };
		}

		const otpData = otpStore.get(phoneNumber);

		if (!otpData || otpData.expiresAt <= Date.now()) {
			otpStore.delete(phoneNumber);
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
	}

	async function finalizeConfirmation({ requestId, requestKey, res }) {
		await cleanExpiredOtps();

		const entry = Array.from(otpStore.entries()).find(([, value]) => value.requestId === requestId);

		if (!entry) {
			return { ok: false, status: 400, message: 'Confirmation request not found.' };
		}

		const [phoneNumber, otpData] = entry;

		if (otpData.expiresAt <= Date.now()) {
			otpStore.delete(phoneNumber);
			await persistOtpStore();
			return { ok: false, status: 400, message: 'Confirmation request expired.' };
		}

		if (otpData.requestKeyHash !== hashValue(requestKey)) {
			return { ok: false, status: 403, message: 'Invalid request key.' };
		}

		if (otpData.status !== 'approved') {
			return { ok: false, status: 400, message: 'Request is not approved yet.' };
		}

		otpStore.delete(phoneNumber);
		await persistOtpStore();

		const ownerInfo = await getOwnerNumbers();
		const isSuperOwner = phoneNumber === ownerInfo.superOwner;
		const session = { role: isSuperOwner ? 'superOwner' : 'owner', phoneNumber, name: isSuperOwner ? 'Super Owner' : 'Owner' };

		createCookie(res, session);

		audit?.push({
			action: 'auth.owner_login',
			session,
			target: 'dashboard',
			message: 'Owner login confirmed by WhatsApp.'
		});

		loggers.info(color('Dashboard login verified for', 'white'), color(phoneNumber, 'lilac'));

		return { ok: true };
	}

	function issueViewerSession({ name, res }) {
		const safeName = (name || 'Viewer').trim() || 'Viewer';
		const session = { role: 'viewer', phoneNumber: null, name: safeName };

		createCookie(res, session);

		audit?.push({
			action: 'auth.viewer_login',
			session,
			target: 'dashboard',
			message: 'Viewer session started.'
		});

		return { ok: true, role: 'viewer' };
	}

	async function logout({ req, res }) {
		const session = getSessionFromRequest(req);
		const token = session?.token || getCookie(req, AUTH_COOKIE_NAME);

		if (token) {
			sessionStore.delete(token);
			void persistSessionStore();
		}

		if (session) {
			audit?.push({
				action: 'auth.logout',
				session,
				target: 'dashboard',
				message: 'Session logged out.'
			});
		}

		res.clearCookie(AUTH_COOKIE_NAME, { path: '/' });

		return { ok: true };
	}

	async function processConfirmationAction({ actionId, senderJid }) {
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
	}

	return {
		load: async () => {
			await loadSessionStore();
			await loadOtpStore();
		},
		cleanExpiredOtps,
		cleanExpiredSessions,
		getActiveSessionCount() {
			cleanExpiredSessions();

			return sessionStore.size;
		},
		listSessions() {
			cleanExpiredSessions();

			return Array.from(sessionStore.entries()).map(([token, session]) => ({
				id: token.slice(0, 8),
				role: session.role,
				phoneNumber: session.phoneNumber || null,
				name: session.name || null,
				lastSeenAt: session.lastSeenAt || null
			}));
		},
		revokeSession(shortId) {
			for (const [token] of sessionStore.entries()) {
				if (token.startsWith(shortId)) {
					sessionStore.delete(token);

					return { ok: true };
				}
			}

			return { ok: false, message: 'Session not found.' };
		},
		hasActiveOwnerSession,
		getSessionFromRequest,
		isAuthenticated,
		issueOtp,
		getConfirmationStatus,
		finalizeConfirmation,
		issueViewerSession,
		createCookieExternal: createCookie,
		finalizeGroupAdminConfirmation: async ({ requestId, requestKey, res }) => {
			const phoneNumber = [...otpStore.entries()].find(([, v]) => v.requestId === requestId)?.[0];

			if (!phoneNumber) {
				return { ok: false, status: 404, message: 'Request not found.' };
			}

			const otpData = otpStore.get(phoneNumber);

			if (!otpData || otpData.requestId !== requestId) {
				return { ok: false, status: 404, message: 'Request not found.' };
			}

			if (otpData.status !== 'approved') {
				return { ok: false, status: 400, message: 'Request is not approved yet.' };
			}

			otpStore.delete(phoneNumber);

			const session = { role: 'groupAdmin', phoneNumber, name: `Group Admin (${phoneNumber})` };

			createCookie(res, session);

			return { ok: true };
		},
		logout,
		processConfirmationAction,
		hashValue,
		normalizePhoneNumber,
		getOwnerNumbers,
		AUTH_COOKIE_NAME
	};
}
