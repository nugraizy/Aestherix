import configuration from '../../helper/config/connect.js';

const EVENT_UPDATE = {
	GROUP_CHANGE_SUBJECT: 'Subject Changed',
	GROUP_CHANGE_DESCRIPTION: 'Description Changed',
	GROUP_CHANGE_RESTRICT: 'Restrictions Changed',
	GROUP_CHANGE_ANNOUNCE: 'Announcement Changed',
	GROUP_CHANGE_ICON: 'Icon Changed',
	GROUP_INVITE_CHANGED: 'Invite Changed',
	GROUP_MEMBERSHIP_JOIN_APPROVAL_MODE: 'Membership Join Approval Mode Changed',
	GROUP_MEMBER_ADD_MODE: 'Member Add Mode Changed',
	CHANGE_EPHEMERAL_SETTING: (duration) => 'Ephemeral Mode Changed ' + duration,
	SUBJECT: 'changing subject',
	ICON: 'changing icons',
	DESCRIPTION: 'changing description',
	DEL_DESCRIPTION: 'deletes description',
	DEL_ICON: 'deletes icons',
	RESTRICT: 'changing mode restrictions',
	ANNOUNCE: 'changing mode announcement',
	REVOKE_INVITE: 'revokes invitation URL',
	JOIN_APPROVAL: 'changing mode join approval',
	MEMBER_ADD_MODE: 'changing member add mode',
	EPHEMERAL_OFF: 'turning off the ephemeral mode',
	EPHEMERAL_ON: 'turning on the ephemeral mode'
};

const DURATION_MAP = {
	[String(86400)]: '24h',
	[String(604800)]: '7d',
	[String(7776000)]: '90d'
};

/**
 * Sends a notification with formatted event details.
 *
 * @param {string} id - The group ID.
 * @param {string} author - The author of the update.
 * @param {string} status - The update status message.
 * @param {string} type - The update event type.
 */
const sendGroupSettingsNotification = async (id, author, status, type, duration) => {
	await client.send(id, {
		text: `${'Group Settings Notification'.formatHeaders()}\n
Event Update : ${typeof EVENT_UPDATE[type] === 'function' ? EVENT_UPDATE[type](duration) : EVENT_UPDATE[type]}

@${author.split('@')[0]} ${status}`,
		mentions: [author]
	});
};

/**
 * Updates metadata cache based on the group settings update.
 *
 * @param {string} id - The group ID.
 * @param {object} update - The group update data.
 * @param {object} settingsGroup - The settings group cache object.
 * @param {object} metadataGroup - The metadata group cache object.
 */
const updateMetadataCache = (id, update, settingsGroup, metadataGroup) => {
	const cacheUpdates = {
		subject: () => {
			settingsGroup[id].groupName = update.subject;
			Object.assign(metadataGroup, {
				subject: update.subject,
				subjectTime: Date.now(),
				subjectOwner: update.author
			});
		},
		desc: () => (metadataGroup.desc = update.desc),
		announce: () => (metadataGroup.announce = update.announce),
		restrict: () => (metadataGroup.restrict = update.restrict),
		inviteCode: () => (metadataGroup.code = update.inviteCode),
		joinApprovalMode: () => (metadataGroup.joinApprovalMode = update.joinApprovalMode),
		memberAddMode: () => (metadataGroup.memberAddMode = update.memberAddMode),
		ephemeral: () => (metadataGroup.ephemeralDuration = update.ephemeral)
	};

	for (const key in cacheUpdates) {
		if (update[key] !== undefined) {
			cacheUpdates[key]();
		}
	}
};

/**
 * Constructs a status message and type based on update fields and settings.
 * @param {object} update - The group update data.
 * @param {object} settingsGroup - The settings group cache object.
 * @returns {object} - Contains the status message and event type.
 */
const getStatusAndType = (update, id, settingsGroup) => {
	let status = '',
		type = '';

	const eventTypes = {
		desc: () => {
			status = update.desc
				? settingsGroup[id].groupDescription !== undefined
					? `${EVENT_UPDATE.DESCRIPTION} from ${settingsGroup[id].groupDescription} to ${update.desc}`
					: `${EVENT_UPDATE.DESCRIPTION} to ${update.desc}`
				: `${EVENT_UPDATE.DEL_DESCRIPTION} from ${settingsGroup[id].groupDescription}`;
			type = 'GROUP_CHANGE_DESCRIPTION';
		},
		subject: () => {
			status = `${EVENT_UPDATE.SUBJECT} from ${settingsGroup[id].groupName} to ${update.subject}`;
			type = 'GROUP_CHANGE_SUBJECT';
		},
		announce: () => {
			status = `${EVENT_UPDATE.ANNOUNCE} to ${update.announce ? 'enable' : 'disable'}`;
			type = 'GROUP_CHANGE_ANNOUNCE';
		},
		restrict: () => {
			status = `${EVENT_UPDATE.RESTRICT} to ${update.restrict ? 'enable' : 'disable'}`;
			type = 'GROUP_CHANGE_RESTRICT';
		},
		inviteCode: () => {
			status = `${EVENT_UPDATE.REVOKE_INVITE} to ${update.inviteCode ? 'enable' : 'disable'}`;
			type = 'GROUP_INVITE_CHANGED';
		},
		joinApprovalMode: () => {
			status = `${EVENT_UPDATE.JOIN_APPROVAL} to ${update.joinApprovalMode ? 'enable' : 'disable'}`;
			type = 'JOIN_APPROVAL';
		},
		memberAddMode: () => {
			status = `${EVENT_UPDATE.MEMBER_ADD_MODE} to ${update.memberAddMode ? 'enable' : 'disable'}`;
			type = 'GROUP_MEMBERSHIP_JOIN_APPROVAL_MODE';
		},
		content: () => {
			status = update.content ? EVENT_UPDATE.ICON : EVENT_UPDATE.DEL_ICON;
			type = 'GROUP_CHANGE_ICON';
		},
		ephemeral: () => {
			status = update.ephemeral ? EVENT_UPDATE.EPHEMERAL_ON : EVENT_UPDATE.EPHEMERAL_OFF;
			type = 'CHANGE_EPHEMERAL_SETTING';
		}
	};

	for (const key in eventTypes) {
		if (update[key] !== undefined) {
			eventTypes[key]();
		}
	}

	return { status, type };
};

/**
 * Main handler for group settings notifications.
 *
 * @param {typeof client} client
 * @param {unknown[]} updates - The group update data.
 */
const groupSettingsNotificationHandler = async (client, updates) => {
	for (const update of updates) {
		const { id, author } = update;
		const settingsCache = configuration.cache.settings;
		const metadataCache = configuration.cache.metadata;

		const settingsGroup = settingsCache.get(id);
		const metadataGroup = metadataCache.get(id);

		if (!settingsGroup || !metadataGroup) {
			return;
		}

		if (settingsGroup[id]?.notification === 'enable') {
			const { status, type } = getStatusAndType(update, id, settingsGroup);

			updateMetadataCache(id, update, settingsGroup, metadataGroup);
			settingsCache.set(id, settingsGroup);
			metadataCache.set(id, metadataGroup);

			await sendGroupSettingsNotification(
				id,
				author,
				status,
				type,
				(update.ephemeral && DURATION_MAP[String(update.ephemeral)]) || 'Off'
			);
		} else {
			updateMetadataCache(id, update, settingsGroup, metadataGroup);
			settingsCache.set(id, settingsGroup);
			metadataCache.set(id, metadataGroup);
		}
	}
};

export default groupSettingsNotificationHandler;
