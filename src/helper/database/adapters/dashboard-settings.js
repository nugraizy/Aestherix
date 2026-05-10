/**
 * Dashboard-settings adapter — replaces dashboard-settings.json and
 * dashboard-commands-cache.json with DB-backed storage via the DashboardKV
 * model (generic key-value table).
 *
 * @module database/adapters/dashboard-settings
 */

/** @typedef {import('@prisma/client').PrismaClient} PrismaClient */

const KV_STATE_KEY = 'dashboard_state';
const KV_COMMANDS_CACHE_KEY = 'dashboard_commands_cache';
const KV_FLUSH_MS = 1000;

let disposed = false;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryablePrismaError = (error) => {
	return Boolean(
		error &&
			(error.code === 'P2034' ||
				error.code === 'P2028' ||
				/Transaction.*aborted/i.test(error.message || '') ||
				/write conflict|deadlock/i.test(error.message || ''))
	);
};

const withRetry = async (operation, { retries = 3, baseDelayMs = 60 } = {}) => {
	let attempt = 0;

	while (true) {
		try {
			return await operation();
		} catch (error) {
			attempt += 1;

			if (isRetryablePrismaError(error)) {
				console.warn('[dashboardKV] retryable write error', {
					attempt,
					code: error?.code,
					message: error?.message
				});
			}

			if (attempt > retries || !isRetryablePrismaError(error)) {
				throw error;
			}

			const jitter = Math.floor(Math.random() * baseDelayMs);

			await sleep(baseDelayMs * 2 ** (attempt - 1) + jitter);
		}
	}
};

const pendingWrites = new Map();
const lastPersisted = new Map();

/**
 * Flush a single KV key to the database.
 * Uses the same flushInProgress/pendingFlush guard pattern as makePersistentStore
 * to prevent concurrent writes on the same key.
 */
const flushKVWrite = async (key) => {
	const entry = pendingWrites.get(key);

	if (!entry) {
		return;
	}

	if (entry.flushInProgress) {
		entry.pendingFlush = true;
		return;
	}

	if (!entry.pendingFlush) {
		return;
	}

	entry.flushInProgress = true;
	entry.pendingFlush = false;

	const serialized = entry.serialized;

	try {
		await withRetry(() =>
			entry.db.dashboardKV.upsert({
				where: { key },
				update: { value: serialized },
				create: { key, value: serialized }
			})
		);

		lastPersisted.set(key, serialized);

		if (!entry.pendingFlush) {
			pendingWrites.delete(key);
		}
	} catch {
		console.warn('[dashboardKV] flush failed, will retry', { key });
		entry.pendingFlush = true;
	} finally {
		entry.flushInProgress = false;

		if (entry.pendingFlush && !entry.flushTimer) {
			entry.flushTimer = setTimeout(() => {
				entry.flushTimer = null;
				void flushKVWrite(key);
			}, KV_FLUSH_MS);
		}
	}
};

const scheduleKVWrite = (db, key, serialized) => {
	if (disposed) {
		return;
	}

	if (!pendingWrites.has(key) && lastPersisted.get(key) === serialized) {
		return;
	}

	let entry = pendingWrites.get(key);

	if (!entry) {
		entry = { db, serialized, pendingFlush: false, flushInProgress: false, flushTimer: null };
		pendingWrites.set(key, entry);
	}

	entry.db = db;

	if (entry.serialized === serialized && !entry.pendingFlush && !entry.flushInProgress) {
		return;
	}

	entry.serialized = serialized;
	entry.pendingFlush = true;

	if (!entry.flushTimer && !entry.flushInProgress) {
		entry.flushTimer = setTimeout(() => {
			entry.flushTimer = null;
			void flushKVWrite(key);
		}, KV_FLUSH_MS);
	}
};

const getKV = async (db, key) => {
	const row = await db.dashboardKV.findUnique({ where: { key } });

	if (!row) {
		return null;
	}

	try {
		return JSON.parse(row.value);
	} catch {
		return null;
	}
};

const setKV = async (db, key, value) => {
	const serialized = JSON.stringify(value);

	scheduleKVWrite(db, key, serialized);
};

/**
 * Load the persisted dashboard state.
 *
 * @param {PrismaClient} db
 * @returns {Promise<{ disabledCommands: string[], flagStates: Record<string, boolean> }>}
 */
export const loadDashboardState = async (db) => {
	const raw = await getKV(db, KV_STATE_KEY);

	const disabledCommands = Array.isArray(raw?.disabledCommands) ? raw.disabledCommands : [];
	const rawFlags = raw?.flagStates && typeof raw.flagStates === 'object' ? raw.flagStates : {};
	const flagStates = Object.fromEntries(Object.entries(rawFlags).filter(([, v]) => typeof v === 'boolean'));

	return { disabledCommands, flagStates };
};

/**
 * Persist the dashboard state.
 *
 * @param {PrismaClient} db
 * @param {{ disabledCommands: string[], flagStates: Record<string, boolean> }} state
 * @returns {Promise<void>}
 */
export const saveDashboardState = async (db, { disabledCommands = [], flagStates = {} } = {}) => {
	await setKV(db, KV_STATE_KEY, { disabledCommands, flagStates });
};

/**
 * Load the cached command catalog.
 *
 * @param {PrismaClient} db
 * @returns {Promise<Array>}
 */
export const loadCommandsCatalog = async (db) => {
	const raw = await getKV(db, KV_COMMANDS_CACHE_KEY);

	return Array.isArray(raw?.commands) ? raw.commands : [];
};

/**
 * Persist the command catalog.
 *
 * @param {PrismaClient} db
 * @param {{ updatedAt: number, commands: Array }} payload
 * @returns {Promise<void>}
 */
export const saveCommandsCatalog = async (db, payload) => {
	await setKV(db, KV_COMMANDS_CACHE_KEY, payload);
};

/**
 * Stop all pending flush timers and reject future writes.
 * Call this during graceful shutdown so the process can exit.
 */
export const shutdownDashboardKV = () => {
	disposed = true;

	for (const [key, entry] of pendingWrites) {
		if (entry.flushTimer) {
			clearTimeout(entry.flushTimer);
			entry.flushTimer = null;
		}

		pendingWrites.delete(key);
	}
};
