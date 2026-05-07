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

			await sleep(baseDelayMs * attempt + jitter);
		}
	}
};

const writeQueues = new Map();
const pendingWrites = new Map();
const lastPersisted = new Map();

const enqueueWrite = (key, task) => {
	const previous = writeQueues.get(key) || Promise.resolve();
	const next = previous
		.catch(() => undefined)
		.then(task)
		.finally(() => {
			if (writeQueues.get(key) === next) {
				writeQueues.delete(key);
			}
		});

	writeQueues.set(key, next);
	return next;
};

const flushKVWrite = async (key) => {
	const entry = pendingWrites.get(key);

	if (!entry || entry.inFlight || !entry.serialized) {
		return;
	}

	const { db } = entry;
	const serialized = entry.serialized;

	entry.serialized = null;
	entry.inFlight = true;
	entry.timer = null;

	try {
		await enqueueWrite(key, () =>
			withRetry(() =>
				db.dashboardKV.upsert({
					where: { key },
					update: { value: serialized },
					create: { key, value: serialized }
				})
			)
		);

		lastPersisted.set(key, serialized);
	} catch {
		console.warn('[dashboardKV] flush failed, will retry', { key });
		entry.serialized = serialized;
		entry.timer = setTimeout(() => {
			void flushKVWrite(key);
		}, KV_FLUSH_MS * 2);
	} finally {
		entry.inFlight = false;

		if (entry.serialized) {
			entry.timer = setTimeout(() => {
				void flushKVWrite(key);
			}, KV_FLUSH_MS);
			return;
		}

		pendingWrites.delete(key);
	}
};

const scheduleKVWrite = (db, key, serialized) => {
	let entry = pendingWrites.get(key);

	if (!entry && lastPersisted.get(key) === serialized) {
		return;
	}

	if (!entry) {
		entry = { db, serialized: null, timer: null, inFlight: false };
		pendingWrites.set(key, entry);
	}

	entry.db = db;

	if (entry.serialized === serialized) {
		return;
	}

	entry.serialized = serialized;

	if (!entry.timer && !entry.inFlight) {
		entry.timer = setTimeout(() => {
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
