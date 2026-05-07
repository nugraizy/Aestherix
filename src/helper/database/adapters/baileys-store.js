/**
 * Baileys in-memory store persistence adapter.
 *
 * @module database/adapters/baileys-store
 */

/** @typedef {import('@prisma/client').PrismaClient} PrismaClient */

/**
 * Load the persisted store snapshot for a session.
 *
 * @param {PrismaClient} db
 * @param {string} sessionName
 * @returns {Promise<object|null>}
 */
export const getBaileysStore = async (db, sessionName) => {
	if (!sessionName) {
		return null;
	}

	const row = await db.baileysStore.findUnique({ where: { sessionName } });

	if (!row?.state) {
		return null;
	}

	try {
		return JSON.parse(row.state);
	} catch {
		return null;
	}
};

/**
 * Persist the store snapshot for a session.
 *
 * @param {PrismaClient} db
 * @param {string} sessionName
 * @param {object} state
 * @returns {Promise<void>}
 */
export const upsertBaileysStore = async (db, sessionName, state) => {
	if (!sessionName) {
		return;
	}

	const payload = JSON.stringify(state ?? {});

	await db.baileysStore.upsert({
		where: { sessionName },
		update: { state: payload },
		create: { sessionName, state: payload }
	});
};

/**
 * Delete the store snapshot for a session.
 *
 * @param {PrismaClient} db
 * @param {string} sessionName
 * @returns {Promise<void>}
 */
export const deleteBaileysStore = async (db, sessionName) => {
	if (!sessionName) {
		return;
	}

	await db.baileysStore.deleteMany({ where: { sessionName } });
};
