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

// ─────────────────────────────────────────────────────────────────────────────
// Low-level helpers
// ─────────────────────────────────────────────────────────────────────────────

const getKV = async (db, key) => {
	const row = await db.dashboardKV.findUnique({ where: { key } });
	if (!row) return null;
	try {
		return JSON.parse(row.value);
	} catch {
		return null;
	}
};

const setKV = async (db, key, value) => {
	const serialized = JSON.stringify(value);
	await db.dashboardKV.upsert({
		where: { key },
		update: { value: serialized },
		create: { key, value: serialized }
	});
};

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard state  (disabledCommands + flagStates)
// ─────────────────────────────────────────────────────────────────────────────

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
	const flagStates = Object.fromEntries(
		Object.entries(rawFlags).filter(([, v]) => typeof v === 'boolean')
	);

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

// ─────────────────────────────────────────────────────────────────────────────
// Commands catalog cache  (dashboard-commands-cache.json)
// ─────────────────────────────────────────────────────────────────────────────

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
