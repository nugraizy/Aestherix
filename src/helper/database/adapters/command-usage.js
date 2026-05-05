/**
 * Command-usage adapter — drop-in replacement for the JSON operations in
 * src/helper/connection/utils/command-usage.js.
 *
 * @module database/adapters/command-usage
 */

/** @typedef {import('@prisma/client').PrismaClient} PrismaClient */

/**
 * Load all command-usage counters as a plain object.
 *
 * @param {PrismaClient} db
 * @returns {Promise<Record<string, number>>}
 */
export const loadCommandUsage = async (db) => {
	const rows = await db.commandUsage.findMany();

	return Object.fromEntries(rows.map((r) => [r.command, r.count]));
};

/**
 * Increment the usage counter for `commandName` by 1.
 *
 * @param {PrismaClient} db
 * @param {string}       commandName
 * @returns {Promise<void>}
 */
export const incrementCommandUsage = async (db, commandName) => {
	if (!commandName) {
		return;
	}

	await db.commandUsage.upsert({
		where: { command: commandName },
		update: { count: { increment: 1 } },
		create: { command: commandName, count: 1 }
	});
};

/**
 * Set the counter for a command to an explicit value.
 *
 * @param {PrismaClient} db
 * @param {string}       commandName
 * @param {number}       count
 * @returns {Promise<void>}
 */
export const setCommandUsage = async (db, commandName, count) => {
	await db.commandUsage.upsert({
		where: { command: commandName },
		update: { count },
		create: { command: commandName, count }
	});
};

/**
 * Reset all command-usage counters to zero.
 *
 * @param {PrismaClient} db
 * @returns {Promise<void>}
 */
export const resetCommandUsage = async (db) => {
	await db.commandUsage.updateMany({ data: { count: 0 } });
};
