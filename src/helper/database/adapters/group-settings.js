/**
 * Group-settings adapter — drop-in replacement for the JSON operations in
 * src/helper/groups/settings/group-default-settings.js.
 *
 * The `bannedMembers` column stores a JSON-encoded string array because
 * not all Prisma providers support native JSON columns in a cross-compatible
 * way.  The helpers below handle serialisation / deserialisation transparently.
 *
 * @module database/adapters/group-settings
 */

/** @typedef {import('@prisma/client').PrismaClient} PrismaClient */

/**
 * @typedef {Object} GroupSettingsData
 * @property {string}   groupId
 * @property {string}   [groupName]
 * @property {string}   [groupDescription]
 * @property {string}   welcome1
 * @property {string}   welcome1msg
 * @property {string}   welcome2
 * @property {string}   welcome2msg
 * @property {string}   left1
 * @property {string}   left1msg
 * @property {string}   left2
 * @property {string}   left2msg
 * @property {string}   antiDelete
 * @property {string}   antiGroupURL
 * @property {string}   antiURL
 * @property {string}   antiSpam
 * @property {string}   antiVirus
 * @property {string}   autoReader
 * @property {string}   antiNSFW
 * @property {string}   games
 * @property {string}   notification
 * @property {string[]} banned
 */

const DEFAULT_SETTINGS = {
	welcome1: 'disable',
	welcome1msg: 'Welcome to {groupName}',
	welcome2: 'disable',
	welcome2msg: 'Welcome to {groupName}',
	left1: 'disable',
	left1msg: 'Bye bye {groupName}',
	left2: 'disable',
	left2msg: 'Bye bye {groupName}',
	antiDelete: 'disable',
	antiGroupURL: 'disable',
	antiURL: 'disable',
	antiSpam: 'disable',
	antiVirus: 'disable',
	autoReader: 'disable',
	antiNSFW: 'disable',
	games: 'disable',
	notification: 'disable'
};

/** @param {import('@prisma/client').GroupSettings} row */
const rowToData = (row) => ({
	groupId: row.groupId,
	groupName: row.groupName ?? '',
	groupDescription: row.groupDescription ?? '',
	...DEFAULT_SETTINGS,
	welcome1: row.welcome1,
	welcome1msg: row.welcome1msg,
	welcome2: row.welcome2,
	welcome2msg: row.welcome2msg,
	left1: row.left1,
	left1msg: row.left1msg,
	left2: row.left2,
	left2msg: row.left2msg,
	antiDelete: row.antiDelete,
	antiGroupURL: row.antiGroupURL,
	antiURL: row.antiURL,
	antiSpam: row.antiSpam,
	antiVirus: row.antiVirus,
	autoReader: row.autoReader,
	antiNSFW: row.antiNSFW,
	games: row.games,
	notification: row.notification,
	banned: JSON.parse(row.bannedMembers || '[]')
});

/**
 * Return the settings for `groupId`, or `null` if the group has no record.
 *
 * @param {PrismaClient} db
 * @param {string}       groupId
 * @returns {Promise<GroupSettingsData | null>}
 */
export const getGroupSettings = async (db, groupId) => {
	const row = await db.groupSettings.findUnique({ where: { groupId } });

	return row ? rowToData(row) : null;
};

/**
 * Create default settings for a group if they do not already exist.
 * Returns the (new or existing) settings object.
 *
 * @param {PrismaClient} db
 * @param {string}       groupId
 * @param {string}       [groupName]
 * @param {string}       [groupDescription]
 * @returns {Promise<GroupSettingsData>}
 */
export const pushDefaultSettings = async (db, groupId, groupName, groupDescription) => {
	const row = await db.groupSettings.upsert({
		where: { groupId },
		update: {},
		create: {
			groupId,
			groupName: groupName ?? '',
			groupDescription: groupDescription ?? '',
			...DEFAULT_SETTINGS,
			bannedMembers: '[]'
		}
	});

	return rowToData(row);
};

/**
 * Update a single setting field for a group.
 *
 * @param {PrismaClient} db
 * @param {string}       groupId
 * @param {string}       setting   Field name as defined in the schema.
 * @param {string}       value
 * @returns {Promise<GroupSettingsData | null>}
 */
export const updateGroupSetting = async (db, groupId, setting, value) => {
	const existing = await db.groupSettings.findUnique({ where: { groupId } });

	if (!existing) {
		return null;
	}

	const row = await db.groupSettings.update({
		where: { groupId },
		data: { [setting]: value }
	});

	return rowToData(row);
};

/**
 * Add a member to the group-level ban list.
 *
 * @param {PrismaClient} db
 * @param {string}       groupId
 * @param {string}       memberJid
 * @returns {Promise<void>}
 */
export const banGroupMember = async (db, groupId, memberJid) => {
	const row = await db.groupSettings.findUnique({ where: { groupId } });

	if (!row) {
		return;
	}

	const banned = JSON.parse(row.bannedMembers || '[]');

	if (!banned.includes(memberJid)) {
		banned.push(memberJid);
		await db.groupSettings.update({
			where: { groupId },
			data: { bannedMembers: JSON.stringify(banned) }
		});
	}
};

/**
 * Remove a member from the group-level ban list.
 *
 * @param {PrismaClient} db
 * @param {string}       groupId
 * @param {string}       memberJid
 * @returns {Promise<void>}
 */
export const unbanGroupMember = async (db, groupId, memberJid) => {
	const row = await db.groupSettings.findUnique({ where: { groupId } });

	if (!row) {
		return;
	}

	const banned = JSON.parse(row.bannedMembers || '[]').filter((jid) => jid !== memberJid);

	await db.groupSettings.update({
		where: { groupId },
		data: { bannedMembers: JSON.stringify(banned) }
	});
};

/**
 * Load all group settings into memory (used during startup cache warming).
 *
 * @param {PrismaClient} db
 * @returns {Promise<GroupSettingsData[]>}
 */
export const getAllGroupSettings = async (db) => {
	const rows = await db.groupSettings.findMany();

	return rows.map(rowToData);
};
