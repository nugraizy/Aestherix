import crypto from 'crypto';

export const UNDO_WINDOW_MS = 12000;
export const UNDO_WINDOW_SHORT_MS = 8000;
export const UNDO_WINDOW_MEDIUM_MS = 10000;
export const UNDO_WINDOW_LONG_MS = 15000;

const RISK_LEVELS = new Set(['low', 'medium', 'high']);

function normalizeRisk(value) {
	return RISK_LEVELS.has(value) ? value : 'low';
}

export function createUndoService({ monitor, users, settings } = {}) {
	const store = new Map();

	function cleanExpired() {
		const now = Date.now();

		for (const [token, entry] of store.entries()) {
			if (Number(entry?.expiresAt || 0) <= now) {
				store.delete(token);
			}
		}
	}

	function register({ kind, target, before = null, actionLabel = 'Undo', ttlMs = UNDO_WINDOW_MS, risk = 'low' } = {}) {
		if (!kind || !target || before === null || typeof before === 'undefined') {
			return null;
		}

		cleanExpired();

		const safeTtlMs = Math.max(2000, Number(ttlMs || UNDO_WINDOW_MS));
		const token = crypto.randomBytes(18).toString('hex');
		const expiresAt = Date.now() + safeTtlMs;
		const safeRisk = normalizeRisk(risk);

		store.set(token, { token, kind, target, before, expiresAt, actionLabel, risk: safeRisk });

		return { token, expiresAt, ttlMs: safeTtlMs, actionLabel, risk: safeRisk };
	}

	function take(token) {
		const entry = store.get(token);

		if (!entry) {
			return null;
		}

		store.delete(token);

		if (Number(entry.expiresAt || 0) <= Date.now()) {
			return null;
		}

		return entry;
	}

	async function apply(token) {
		cleanExpired();

		const entry = take(token);

		if (!entry) {
			return { ok: false, status: 404, message: 'Undo token expired or unknown.' };
		}

		if (entry.kind === 'command.toggle') {
			if (!monitor) {
				return { ok: false, status: 503, message: 'Monitor service unavailable.' };
			}

			const result = await monitor.setCommandState(entry.target, Boolean(entry.before?.enabled));

			if (!result.ok) {
				return { ok: false, status: 404, message: result.message || 'Command no longer exists.' };
			}

			return { ok: true, kind: entry.kind, target: entry.target, state: { enabled: Boolean(entry.before?.enabled) } };
		}

		if (entry.kind === 'flag.toggle') {
			if (!monitor) {
				return { ok: false, status: 503, message: 'Monitor service unavailable.' };
			}

			const result = await monitor.setFlagState(entry.target, Boolean(entry.before?.enabled));

			if (!result.ok) {
				return { ok: false, status: 404, message: result.message || 'Flag no longer exists.' };
			}

			return { ok: true, kind: entry.kind, target: entry.target, state: { enabled: Boolean(entry.before?.enabled) } };
		}

		if (entry.kind === 'user.limit') {
			if (!users) {
				return { ok: false, status: 503, message: 'Users service unavailable.' };
			}

			const result = await users.setLimit(entry.target, Number(entry.before?.limit || 0));

			if (!result.ok) {
				return { ok: false, status: 400, message: result.message || 'Unable to restore user limit.' };
			}

			return { ok: true, kind: entry.kind, target: result.user.id, state: { limit: result.user.limit } };
		}

		if (entry.kind === 'user.premium') {
			if (!users) {
				return { ok: false, status: 503, message: 'Users service unavailable.' };
			}

			const result = await users.setPremium(entry.target, Boolean(entry.before?.premium));

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
			if (!users) {
				return { ok: false, status: 503, message: 'Users service unavailable.' };
			}

			const result = await users.setBanned(entry.target, Boolean(entry.before?.banned));

			if (!result.ok) {
				return { ok: false, status: 400, message: result.message || 'Unable to restore banned state.' };
			}

			return { ok: true, kind: entry.kind, target: result.userId, state: { banned: result.banned } };
		}

		if (entry.kind === 'user.blocked') {
			if (!users) {
				return { ok: false, status: 503, message: 'Users service unavailable.' };
			}

			const result = await users.setBlocked(entry.target, Boolean(entry.before?.blocked));

			if (!result.ok) {
				return {
					ok: false,
					status: result.status || 400,
					message: result.message || 'Unable to restore block state.'
				};
			}

			return { ok: true, kind: entry.kind, target: result.userId, state: { blocked: result.blocked } };
		}

		if (entry.kind === 'settings.update') {
			if (!settings) {
				return { ok: false, status: 503, message: 'Settings service unavailable.' };
			}

			const result = await settings.restore(entry.before);

			if (!result.ok) {
				return { ok: false, status: result.status || 400, message: result.message || 'Unable to restore settings.' };
			}

			return { ok: true, kind: entry.kind, target: 'settings', state: result.settings };
		}

		return { ok: false, status: 400, message: 'Unsupported undo action.' };
	}

	return { register, apply, cleanExpired };
}
