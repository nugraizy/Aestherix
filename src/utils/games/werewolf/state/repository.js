/**
 * Werewolf session repository — in-memory cache backed by Prisma.
 *
 * Responsibilities:
 *   - serialize / deserialize `Session` objects to/from the DB (`state` JSON).
 *   - coalesce rapid writes per-roomId with a 300 ms debounce (same pattern
 *     used by `dashboard-settings.js`).
 *   - populate `configuration.games.werewolf` cache so callers can read
 *     synchronously.
 *   - expose `loadAllUnfinished()` for the bot boot-up rehydrate step.
 *
 * The module exports a ready-to-use singleton (`repository`) plus a factory
 * `makeRepository({ prisma, cache, now })` that is dependency-injectable so
 * pure logic tests can exercise every branch without hitting Prisma.
 *
 * @typedef {import('../types.js').Session} Session
 */

import configuration from '../../../../helper/config/connect.js';
import defaultPrisma from '../../../../helper/database/prisma.js';

const DEFAULT_DEBOUNCE_MS = 300;
const FINAL_PHASE = 'ended';

const nowMs = () => Date.now();

/**
 * Serialize a session into the shape stored in Prisma.
 * @param {Session} session
 */
export const serializeSession = (session) => ({
	roomId: session.roomId,
	phase: session.phase,
	state: JSON.stringify(session)
});

/**
 * Inverse of `serializeSession` — takes a row, returns the Session object.
 * Returns `null` when the row or `state` is malformed.
 * @param {{ roomId: string, phase: string, state: string } | null | undefined} row
 * @returns {Session | null}
 */
export const rehydrateSession = (row) => {
	if (!row || typeof row.state !== 'string') {
		return null;
	}

	try {
		const parsed = JSON.parse(row.state);

		parsed.roomId = row.roomId;
		parsed.phase = row.phase;

		if (!Array.isArray(parsed.playersData)) {
			parsed.playersData = [];
		}

		if (!Array.isArray(parsed.playersDead)) {
			parsed.playersDead = [];
		}

		if (!Array.isArray(parsed.playersKilled)) {
			parsed.playersKilled = [];
		}

		if (!Array.isArray(parsed.playerVoted)) {
			parsed.playerVoted = [];
		}

		if (!Array.isArray(parsed.actionQueue)) {
			parsed.actionQueue = [];
		}

		if (!Array.isArray(parsed.pendingShots)) {
			parsed.pendingShots = [];
		}

		if (!Array.isArray(parsed.loverIds)) {
			parsed.loverIds = [];
		}

		if (!parsed.witchState || typeof parsed.witchState !== 'object') {
			parsed.witchState = { healUsed: false, poisonUsed: false };
		}

		return parsed;
	} catch {
		return null;
	}
};

/**
 * Build a repository bound to a specific Prisma client + cache.
 *
 * @param {{
 *   prisma?: { werewolfSession: {
 *     findUnique: Function,
 *     findMany: Function,
 *     upsert: Function,
 *     deleteMany: Function
 *   } },
 *   cache?: { get: Function, set: Function, delete: Function, has: Function, keys: Function },
 *   now?: () => number,
 *   debounceMs?: number
 * }} [options]
 */
export const makeRepository = ({
	prisma = defaultPrisma,
	cache = configuration.games.werewolf,
	now = nowMs,
	debounceMs = DEFAULT_DEBOUNCE_MS
} = {}) => {
	const pending = new Map();

	async function flush(roomId) {
		const entry = pending.get(roomId);

		if (!entry || !entry.dirty || entry.inProgress) {
			return;
		}

		const payload = entry.payload;

		entry.inProgress = true;
		entry.dirty = false;

		try {
			await prisma.werewolfSession.upsert({
				where: { roomId },
				update: { phase: payload.phase, state: payload.state },
				create: { roomId, phase: payload.phase, state: payload.state }
			});

			if (!entry.dirty) {
				pending.delete(roomId);
			}
		} catch {
			entry.dirty = true;
		} finally {
			entry.inProgress = false;

			if (entry.dirty) {
				// eslint-disable-next-line no-use-before-define
				scheduleFlush(roomId);
			}
		}
	}

	function scheduleFlush(roomId) {
		const entry = pending.get(roomId);

		if (!entry || entry.timer || entry.inProgress) {
			return;
		}

		entry.timer = setTimeout(() => {
			entry.timer = null;
			void flush(roomId);
		}, debounceMs);

		if (typeof entry.timer.unref === 'function') {
			entry.timer.unref();
		}
	}

	const cancelPending = (roomId) => {
		const entry = pending.get(roomId);

		if (!entry) {
			return;
		}

		if (entry.timer) {
			clearTimeout(entry.timer);
			entry.timer = null;
		}

		pending.delete(roomId);
	};

	return {
		/**
		 * Find the active session a player belongs to by scanning the cache.
		 * Returns null if the player is not in any active game.
		 *
		 * @param {string} playerId
		 * @returns {Session | null}
		 */
		findByPlayer(playerId) {
			if (!playerId) {
				return null;
			}

			return cache.filter(
				(_key, session) => session.phase !== 'ended' && session.playersData?.some((p) => p.id === playerId),
				'find'
			);
		},

		/**
		 * @param {string} roomId
		 * @returns {Promise<Session | null>}
		 */
		async load(roomId) {
			if (!roomId) {
				return null;
			}

			const cached = cache.get(roomId);

			if (cached) {
				return cached;
			}

			const row = await prisma.werewolfSession.findUnique({ where: { roomId } });
			const session = rehydrateSession(row);

			if (session) {
				cache.set(roomId, session);
			}

			return session;
		},

		/**
		 * Eagerly refresh the in-memory cache from the DB, returning all
		 * sessions whose phase !== 'ended'.
		 */
		async loadAllUnfinished() {
			const rows = await prisma.werewolfSession.findMany({
				where: { phase: { not: FINAL_PHASE } }
			});

			const sessions = [];

			for (const row of rows) {
				const session = rehydrateSession(row);

				if (session) {
					cache.set(session.roomId, session);
					sessions.push(session);
				}
			}

			return sessions;
		},

		/**
		 * @param {Session} session
		 */
		save(session) {
			if (!session || !session.roomId) {
				return;
			}

			session.updatedAt = now();
			cache.set(session.roomId, session);

			if (session.phase === FINAL_PHASE) {
				return this.delete(session.roomId);
			}

			const payload = serializeSession(session);

			let entry = pending.get(session.roomId);

			if (!entry) {
				entry = { payload, dirty: true, timer: null, inProgress: false };
				pending.set(session.roomId, entry);
			} else {
				entry.payload = payload;
				entry.dirty = true;
			}

			scheduleFlush(session.roomId);
		},

		/**
		 * Force-flush a pending write synchronously (returns the awaitable).
		 * Useful on shutdown.
		 * @param {string} roomId
		 */
		async flush(roomId) {
			const entry = pending.get(roomId);

			if (!entry) {
				return;
			}

			if (entry.timer) {
				clearTimeout(entry.timer);
				entry.timer = null;
			}

			await flush(roomId);
		},

		async flushAll() {
			const roomIds = Array.from(pending.keys());

			await Promise.all(roomIds.map((roomId) => this.flush(roomId)));
		},

		/**
		 * @param {string} roomId
		 */
		async delete(roomId) {
			if (!roomId) {
				return;
			}

			cancelPending(roomId);
			cache.delete(roomId);

			try {
				await prisma.werewolfSession.deleteMany({ where: { roomId } });
			} catch {
				/* swallow — the row is already gone or the DB is offline */
			}
		},

		_pending: pending
	};
};

let defaultInstance = null;
let override = null;

const defaultRepo = () => {
	if (!defaultInstance) {
		defaultInstance = makeRepository();
	}

	return defaultInstance;
};

/**
 * Swap the module-scoped repository for tests. Pass `null` to restore the
 * default Prisma-backed singleton.
 */
export const setRepositoryForTest = (repo) => {
	override = repo;
};

export const repository = new Proxy(
	{},
	{
		get(_target, key) {
			const impl = override ?? defaultRepo();
			const value = impl[key];

			return typeof value === 'function' ? value.bind(impl) : value;
		}
	}
);
