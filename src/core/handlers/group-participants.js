import configuration from '../../helper/config/connect.js';
import { Attachment } from '../../helper/index.js';
import { fetchBUFFER } from '../../utils/modules/index.js';

const getIndex = (arr, id, isObject) => arr.findIndex((item) => (isObject ? item.id === id : item === id));

const updateParticipantAdminStatus = (participant, groupMetadataCache, isPromote) => {
	const adminStatus = isPromote ? 'admin' : null;
	const isAdmin = isPromote;

	const updateAdminInList = (list) => {
		const index = getIndex(list, participant, true);

		if (index !== -1) {
			list[index].admin = adminStatus;
			list[index].isAdmin = isAdmin;
		}
	};

	updateAdminInList(groupMetadataCache.rawParticipants);
	updateAdminInList(groupMetadataCache.participants);

	if (isPromote) {
		groupMetadataCache.adminGroups.push(participant);
	} else {
		const index = groupMetadataCache.adminGroups.indexOf(participant);

		if (index !== -1) {
			groupMetadataCache.adminGroups.splice(index, 1);
		}
	}
};

const removeParticipant = (participant, groupMetadataCache) => {
	groupMetadataCache.participantsGroup.splice(getIndex(groupMetadataCache.participantsGroup, participant, false), 1);
	groupMetadataCache.rawParticipants.splice(getIndex(groupMetadataCache.rawParticipants, participant, true), 1);
	groupMetadataCache.participants.splice(getIndex(groupMetadataCache.participants, participant, true), 1);
};

const EVENT_MAP = {
	add: 'Joined',
	invite: 'Invited',
	remove: 'Removed',
	left: 'Left',
	promote: 'Promoted',
	demote: 'Demoted'
};

const EVENT_UPDATE = {
	left: 'Member Left',
	invite: 'Invited Member',
	remove: 'Removed Member',
	add: 'Added Member',
	promote: 'Promoted Member',
	demote: 'Demoted Admin'
};

const writeCache = (groupId, author, participant, action, cache) => {
	const groupMetadataCache = cache.get(groupId) || {
		participantsGroup: [],
		rawParticipants: [],
		participants: [],
		adminGroups: []
	};

	if (action === 'add') {
		if (author !== '') {
			action = 'invite';
		}

		const newParticipant = { id: participant, admin: null, isAdmin: false };

		groupMetadataCache.participantsGroup.push(participant);
		groupMetadataCache.rawParticipants.push(newParticipant);
		groupMetadataCache.participants.push(newParticipant);
	} else {
		if (author === participant && action !== 'add') {
			action = 'left';
		}

		switch (action) {
			case 'promote':
				updateParticipantAdminStatus(participant, groupMetadataCache, true);
				break;
			case 'demote':
				updateParticipantAdminStatus(participant, groupMetadataCache, false);
				break;
			case 'remove':
			case 'left':
				removeParticipant(participant, groupMetadataCache);
				updateParticipantAdminStatus(participant, groupMetadataCache, false);
				break;
		}
	}

	cache.set(groupId, groupMetadataCache);

	return {
		eventNames: EVENT_UPDATE[action],
		actionNames: action
	};
};

const parseId = (id) => `@${id.split('@')[0]}`;

const addContextCaption = (participant, action, data) => {
	participant = parseId(participant);

	return action === 'left' || action === 'add'
		? `${participant} ${EVENT_MAP[action]}`
		: `${parseId(data.author)} ${EVENT_MAP[action]} ${participant}`;
};

/**
 *
 * @param {import('./types/Socket/').AdvancedClient} client
 * @param {string} text
 * @param {string} id
 * @param {string} author
 * @param {string} participant
 * @param {string} groupName
 */
const sendNotification = async (client, text, id, author, participant, groupName, action) => {
	if (!['left', 'remove', 'invite', 'add'].includes(action)) {
		return client.send(id, {
			text,
			mentions: [author || '', participant || '0@s.whatsapp.net']
		});
	}

	const attach = new Attachment(1024, 500);
	const { profile, radi } = await client
		.profilePictureUrl(participant, 'image')
		.then(async (image) => ({ profile: await fetchBUFFER(image), radi: 180 }))
		.catch(() => ({ profile: './src/media/blank.png', radi: 80 }));

	await attach.init(profile);

	attach.fillBackground();

	await attach.putAssets();
	await attach.appendImage({ roundedRadius: radi });
	await attach
		.appendText(
			action === 'left' ? 'Leaving the group' : action === 'remove' ? 'Kicked from the group' : 'Welcome to',
			participant.split('@')[0],
			groupName,
			attach.canvas.width / 2,
			attach.canvas.height / 2,
			{
				fontSize: 62,
				color: attach.PALETTES.GREEN,
				shadow: true,
				participantColor: attach.PALETTES.GREEN,
				groupNameColor: attach.PALETTES.PURPLE,
				textColor: attach.PALETTES.RED
			}
		)
		.placeCopyright();

	const image = attach.toBuffer();

	return await client.send(id, {
		image,
		caption: text,
		mentions: [author || '', participant || '0@s.whatsapp.net']
	});
};

/**
 *
 * @param {import('./types/Socket').AdvancedClient} client
 * @param {*} update
 */
const groupParticipantsNotificationHandler = async (client, update) => {
	const cache = configuration.groups.metadata;
	const settings = configuration.groups.settings;
	const { action, author, id, participants } = update;
	let eventName = null;
	let actionName = null;
	const mentions = [];

	participants.forEach((participant) => {
		const { actionNames, eventNames } = writeCache(id, author, participant, action, cache);

		mentions.push(participant);
		eventName = eventNames;
		actionName = actionNames;
	});

	if (!settings.has(id)) {
		return;
	}

	const groupSettings = settings.get(id);
	const isJoin = actionName === 'add' || actionName === 'invite';
	const isLeave = actionName === 'left' || actionName === 'remove';

	if (isJoin && groupSettings?.welcome !== 'enable') {
		return;
	}

	if (isLeave && groupSettings?.leave !== 'enable') {
		return;
	}

	const useImage = groupSettings?.welcomeImage !== 'disable';

	const text =
		isJoin && groupSettings?.welcomeMessage
			? groupSettings.welcomeMessage
					.replace(/\{groupName\}/g, cache.get(id)?.subject || '')
					.replace(/\{participant\}/g, participants.map(parseId).join(', '))
			: isLeave && groupSettings?.leaveMessage
				? groupSettings.leaveMessage
						.replace(/\{groupName\}/g, cache.get(id)?.subject || '')
						.replace(/\{participant\}/g, participants.map(parseId).join(', '))
				: `${'Group Participants Notification'.formatHeaders()}
Event Update : ${eventName}
${participants.map((v) => addContextCaption(v, action, update)).join('\n')}`;

	if (participants.length > 1 || !useImage) {
		await client.send(id, {
			text,
			mentions
		});
		return;
	}

	const subject = cache.get(id)?.subject || groupSettings?.groupName || (await client.groupMetadata(id)).subject || '';

	await sendNotification(client, text, id, author, participants[0], subject, actionName);
};

export default groupParticipantsNotificationHandler;
