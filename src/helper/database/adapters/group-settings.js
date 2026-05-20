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
 * @property {string}   welcome
 * @property {string}   welcomeMessage
 * @property {string}   leave
 * @property {string}   leaveMessage
 * @property {string}   welcomeImage
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
	welcome: 'disable',
	welcomeMessage: 'Welcome to {groupName}',
	leave: 'disable',
	leaveMessage: 'Bye bye {groupName}',
	welcomeImage: 'enable',
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

/** @param {import('@prisma/client').SettingsManager} row */
const rowToData = (row) => ({
	groupId: row.groupId,
	groupName: row.groupName ?? '',
	groupDescription: row.groupDescription ?? '',
	...DEFAULT_SETTINGS,
	welcome: row.welcome,
	welcomeMessage: row.welcomeMessage,
	leave: row.leave,
	leaveMessage: row.leaveMessage,
	welcomeImage: row.welcomeImage ?? 'enable',
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
export const getGroupSettings = async (db, groupId, sessionName = 'main') => {
	const row = await db.settingsManager.findUnique({ where: { groupId_sessionName: { groupId, sessionName } } });

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
export const pushDefaultSettings = async (db, groupId, groupName, groupDescription, sessionName = 'main') => {
	const row = await db.settingsManager.upsert({
		where: { groupId_sessionName: { groupId, sessionName } },
		update: {},
		create: {
			groupId,
			sessionName,
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
export const updateGroupSetting = async (db, groupId, setting, value, sessionName = 'main') => {
	const existing = await db.settingsManager.findUnique({ where: { groupId_sessionName: { groupId, sessionName } } });

	if (!existing) {
		return null;
	}

	const row = await db.settingsManager.update({
		where: { groupId_sessionName: { groupId, sessionName } },
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
export const banGroupMember = async (db, groupId, memberJid, sessionName = 'main') => {
	const row = await db.settingsManager.findUnique({ where: { groupId_sessionName: { groupId, sessionName } } });

	if (!row) {
		return;
	}

	const banned = JSON.parse(row.bannedMembers || '[]');

	if (!banned.includes(memberJid)) {
		banned.push(memberJid);
		await db.settingsManager.update({
			where: { groupId_sessionName: { groupId, sessionName } },
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
export const unbanGroupMember = async (db, groupId, memberJid, sessionName = 'main') => {
	const row = await db.settingsManager.findUnique({ where: { groupId_sessionName: { groupId, sessionName } } });

	if (!row) {
		return;
	}

	const banned = JSON.parse(row.bannedMembers || '[]').filter((jid) => jid !== memberJid);

	await db.settingsManager.update({
		where: { groupId_sessionName: { groupId, sessionName } },
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
	const rows = await db.settingsManager.findMany();

	return rows.map(rowToData);
};
