/**
 * User adapter — drop-in replacement for the JSON file operations in
 * src/index.js, src/helper/groups/settings/limit.js, and
 * src/helper/connection/utils/cache.js.
 *
 * All functions are async and mirror the existing behaviour.
 *
 * @module database/adapters/user
 */

/** @typedef {import('@prisma/client').PrismaClient} PrismaClient */
/** @typedef {{ id: string, limit: number, role: string }} UserLimitData */

/**
 * Read the limit/role record for a JID, creating a FREE default if missing.
 *
 * @param {PrismaClient} db
 * @param {string}       jid
 * @param {number}       [defaultLimit=30]
 * @returns {Promise<UserLimitData>}
 */
export const getUserLimit = async (db, jid, defaultLimit = 30, sessionName = 'main') => {
	const row = await db.userLimit.findUnique({ where: { jid_sessionName: { jid, sessionName } } });

	if (row) {
		return { id: row.jid, limit: row.limit, role: row.role };
	}

	const created = await db.userLimit.create({
		data: { jid, sessionName, limit: defaultLimit, role: 'FREE' }
	});

	return { id: created.jid, limit: created.limit, role: created.role };
};

/**
 * Create-or-update a user limit record.
 *
 * @param {PrismaClient} db
 * @param {string}       jid
 * @param {number}       limit
 * @param {string}       role
 * @returns {Promise<void>}
 */
export const upsertUserLimit = async (db, jid, limit, role, sessionName = 'main') => {
	await db.userLimit.upsert({
		where: { jid_sessionName: { jid, sessionName } },
		update: { limit, role },
		create: { jid, sessionName, limit, role }
	});
};

/**
 * Reduce the limit for a user by `amount`.  Returns an error descriptor when
 * the limit has already been exhausted.
 *
 * @param {PrismaClient} db
 * @param {string}       jid
 * @param {number}       amount
 * @param {number}       [defaultLimit=30]
 * @returns {Promise<{ error: boolean, message?: string }>}
 */
export const reduceUserLimit = async (db, jid, amount, defaultLimit = 30) => {
	const user = await getUserLimit(db, jid, defaultLimit);

	if (user.role === 'OWNER' || user.role === 'PREMIUM') {
		return { error: false };
	}

	if (user.limit === 0) {
		return { error: true, message: 'You have reached the limit of this command.' };
	}

	const newLimit = Math.max(0, user.limit - amount);

	await upsertUserLimit(db, jid, newLimit, user.role);

	return { error: false };
};

/**
 * Increase the limit for a user by `amount`.  No-op for OWNER / PREMIUM.
 *
 * @param {PrismaClient} db
 * @param {string}       jid
 * @param {number}       amount
 * @param {number}       [defaultLimit=30]
 * @returns {Promise<void>}
 */
export const addUserLimit = async (db, jid, amount, defaultLimit = 30) => {
	const user = await getUserLimit(db, jid, defaultLimit);

	if (user.role === 'OWNER' || user.role === 'PREMIUM') {
		return;
	}

	await upsertUserLimit(db, jid, user.limit + amount, user.role);
};

/**
 * Update only the role of an existing user record.
 *
 * @param {PrismaClient} db
 * @param {string}       jid
 * @param {string}       role
 * @returns {Promise<void>}
 */
export const updateUserRole = async (db, jid, role, sessionName = 'main') => {
	await db.userLimit.upsert({
		where: { jid_sessionName: { jid, sessionName } },
		update: { role },
		create: { jid, sessionName, limit: 30, role }
	});
};

/**
 * Fetch all user limit records (used during startup to warm in-memory caches).
 *
 * @param {PrismaClient} db
 * @returns {Promise<UserLimitData[]>}
 */
export const getAllUserLimits = async (db) => {
	const rows = await db.userLimit.findMany();

	return rows.map((r) => ({ id: r.jid, limit: r.limit, role: r.role }));
};

/**
 * Return all banned JIDs as a plain array of strings.
 *
 * @param {PrismaClient} db
 * @returns {Promise<string[]>}
 */
export const getBannedUsers = async (db) => {
	const rows = await db.bannedUser.findMany({ select: { jid: true } });

	return rows.map((r) => r.jid);
};

/**
 * Ban a JID.  Safe to call multiple times (idempotent).
 *
 * @param {PrismaClient} db
 * @param {string}       jid
 * @returns {Promise<void>}
 */
export const banUser = async (db, jid) => {
	await db.bannedUser.upsert({
		where: { jid },
		update: {},
		create: { jid }
	});
};

/**
 * Unban a JID.  Safe to call even if the JID is not banned.
 *
 * @param {PrismaClient} db
 * @param {string}       jid
 * @returns {Promise<void>}
 */
export const unbanUser = async (db, jid) => {
	await db.bannedUser.deleteMany({ where: { jid } });
};

/**
 * Returns true if the JID is currently banned.
 *
 * @param {PrismaClient} db
 * @param {string}       jid
 * @returns {Promise<boolean>}
 */
export const isUserBanned = async (db, jid) => {
	const row = await db.bannedUser.findUnique({ where: { jid } });

	return row !== null;
};

/**
 * Return all stored contacts.
 *
 * @param {PrismaClient} db
 * @returns {Promise<{id: string, name: string|null}[]>}
 */
export const getAllContacts = async (db) => {
	const rows = await db.contact.findMany({ select: { jid: true, name: true } });

	return rows.map((r) => ({ id: r.jid, name: r.name ?? 'Unknown' }));
};

/**
 * Upsert a single contact (used on every `contacts.upsert` event from Baileys).
 *
 * @param {PrismaClient} db
 * @param {string}       jid
 * @param {string|null}  name
 * @returns {Promise<void>}
 */
export const upsertContact = async (db, jid, name, sessionName = 'main') => {
	await db.contact.upsert({
		where: { jid_sessionName: { jid, sessionName } },
		update: { name: name ?? undefined },
		create: { jid, sessionName, name }
	});
};

/**
 * Bulk-upsert a list of contacts.  Runs all upserts concurrently.
 *
 * @param {PrismaClient}                                  db
 * @param {{ id: string, name?: string|null }[]} contacts
 * @returns {Promise<void>}
 */
export const upsertContacts = async (db, contacts, sessionName = 'main') => {
	await Promise.all(
		contacts
			.map((c) => ({ jid: c.jid ?? c.id, name: c.name }))
			.filter(({ jid }) => typeof jid === 'string' && jid.length > 0)
			.map(({ jid, name }) =>
				db.contact.upsert({
					where: { jid_sessionName: { jid, sessionName } },
					update: { name: name ?? undefined },
					create: { jid, sessionName, name: name ?? null }
				})
			)
	);
};
