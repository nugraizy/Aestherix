import configuration from '../../helper/config/connect.js';
import { getLocale, t, useLocale } from '../../helper/i18n/index.js';

const DURATION_MAP = {
	[String(86400)]: '24h',
	[String(604800)]: '7d',
	[String(7776000)]: '90d'
};

const sendGroupSettingsNotification = async (client, id, author, status, type, duration, locale) => {
	if (!author || !status || !type) {
		return;
	}

	const L = useLocale(locale, 'common');

	const typeMap = {
		GROUP_CHANGE_SUBJECT: L.core.settings.subjectChanged,
		GROUP_CHANGE_DESCRIPTION: L.core.settings.descriptionChanged,
		GROUP_CHANGE_RESTRICT: L.core.settings.restrictionsChanged,
		GROUP_CHANGE_ANNOUNCE: L.core.settings.announcementChanged,
		GROUP_CHANGE_ICON: L.core.settings.iconChanged,
		GROUP_INVITE_CHANGED: L.core.settings.inviteChanged,
		GROUP_MEMBERSHIP_JOIN_APPROVAL_MODE: L.core.settings.joinApprovalChanged,
		GROUP_MEMBER_ADD_MODE: L.core.settings.memberAddModeChanged,
		CHANGE_EPHEMERAL_SETTING: t(locale, 'common.core.settings.ephemeralChanged', [duration])
	};

	await client.send(id, {
		text: `${'Group Settings Notification'.formatHeaders()}\nEvent Update : ${typeMap[type] || type}\n\n@${author.split('@')[0]} ${status}`,
		mentions: [author]
	});
};

const updateMetadataCache = (id, update, settingsGroup, metadataGroup) => {
	const cacheUpdates = {
		subject: () => {
			settingsGroup.groupName = update.subject;
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

const getStatusAndType = (update, id, settingsGroup, L) => {
	let status = '',
		type = '';

	const eventTypes = {
		desc: () => {
			status = update.desc
				? settingsGroup.groupDescription !== undefined
					? `${L.core.settings.changingDescription} from \`${settingsGroup.groupDescription}\` to \`${update.desc}\``
					: `${L.core.settings.changingDescription} to \`${update.desc}\``
				: `${L.core.settings.deletesDescription} from \`${settingsGroup.groupDescription}\``;
			type = 'GROUP_CHANGE_DESCRIPTION';
		},
		subject: () => {
			status = `${L.core.settings.changingSubject} from \`${settingsGroup.groupName}\` to \`${update.subject}\``;
			type = 'GROUP_CHANGE_SUBJECT';
		},
		announce: () => {
			status = `${L.core.settings.changingAnnouncement} to \`${update.announce ? 'enable' : 'disable'}\``;
			type = 'GROUP_CHANGE_ANNOUNCE';
		},
		restrict: () => {
			status = `${L.core.settings.changingRestrictions} to \`${update.restrict ? 'enable' : 'disable'}\``;
			type = 'GROUP_CHANGE_RESTRICT';
		},
		inviteCode: () => {
			status = `${L.core.settings.revokesInvite} to \`${update.inviteCode ? 'enable' : 'disable'}\``;
			type = 'GROUP_INVITE_CHANGED';
		},
		joinApprovalMode: () => {
			status = `${L.core.settings.changingJoinApproval} to \`${update.joinApprovalMode ? 'enable' : 'disable'}\``;
			type = 'JOIN_APPROVAL';
		},
		memberAddMode: () => {
			status = `${L.core.settings.changingMemberAddMode} to \`${update.memberAddMode ? 'enable' : 'disable'}\``;
			type = 'GROUP_MEMBERSHIP_JOIN_APPROVAL_MODE';
		},
		content: () => {
			status = update.content ? L.core.settings.changingIcons : L.core.settings.deletesIcons;
			type = 'GROUP_CHANGE_ICON';
		},
		ephemeral: () => {
			status = update.ephemeral ? L.core.settings.ephemeralOn : L.core.settings.ephemeralOff;
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

const groupSettingsNotificationHandler = async (client, updates) => {
	for (const update of updates) {
		const { id, author } = update;
		const settingsCache = configuration.groups.settings;
		const metadataCache = configuration.groups.metadata;

		const settingsGroup = settingsCache.get(id);
		const metadataGroup = metadataCache.get(id);

		if (!settingsGroup || !metadataGroup) {
			return;
		}

		const locale = await getLocale(id);
		const L = useLocale(locale, 'common');

		if (settingsGroup?.notification === 'enable') {
			const { status, type } = getStatusAndType(update, id, settingsGroup, L);

			updateMetadataCache(id, update, settingsGroup, metadataGroup);
			settingsCache.set(id, settingsGroup);
			metadataCache.set(id, metadataGroup);

			await sendGroupSettingsNotification(
				client,
				id,
				author,
				status,
				type,
				(update.ephemeral && DURATION_MAP[String(update.ephemeral)]) || 'Off',
				locale
			);
		} else {
			updateMetadataCache(id, update, settingsGroup, metadataGroup);
			settingsCache.set(id, settingsGroup);
			metadataCache.set(id, metadataGroup);
		}
	}
};

export default groupSettingsNotificationHandler;
