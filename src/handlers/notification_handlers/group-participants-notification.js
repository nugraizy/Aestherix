import configuration from '../../helper/config/connect.js';
import { reassign, Attachment } from '../../helper/index.js';
import { fetchBUFFER } from '../../utils/modules/index.js';

const EVENT_UPDATE = {
	GROUP_PARTICIPANT_LEAVE: 'Member Leave',
	GROUP_PARTICIPANT_INVITE: 'Invited Member',
	GROUP_PARTICIPANT_REMOVE: 'Removed Member',
	GROUP_PARTICIPANT_ADD: 'Added Member',
	GROUP_PARTICIPANT_PROMOTE: 'Promoted Member',
	GROUP_PARTICIPANT_DEMOTE: 'Demoted Admin',
	INVITE: 'Adding',
	ADD: 'Joined',
	REMOVE: 'Removing',
	PROMOTE: 'Promoting',
	DEMOTE: 'Demoting',
	LEAVE: 'Left'
};

const getIndex = (arr, id, obj) => arr.findIndex((v) => (obj ? v.id === id : v === id));

const processMessageStubType = (cache, message) => {
	const type = message.messageStubType;

	if (['GROUP_PARTICIPANT_ADD', 'GROUP_PARTICIPANT_INVITE'].includes(type)) {
		for (const id of message.messageStubParameters) {
			cache.participants?.push({ id, admin: null });
			cache.rawParticipants?.push({ id, admin: null });
			cache.participantsGroup?.push(id);
		}
	} else if (['GROUP_PARTICIPANT_LEAVE', 'GROUP_PARTICIPANT_REMOVE'].includes(type)) {
		for (const id of message.messageStubParameters) {
			if (cache.adminGroups?.includes(id)) {
				cache.adminGroups.splice(getIndex(cache.adminGroups, id, false), 1);
			}

			cache.participants?.splice(getIndex(cache.participants, id, true), 1);
			cache.rawParticipants?.splice(getIndex(cache.rawParticipants, id, true), 1);
			cache.participantsGroup?.splice(getIndex(cache.participantsGroup, id, false), 1);
		}
	} else if (['GROUP_PARTICIPANT_DEMOTE'].includes(type)) {
		for (const id of message.messageStubParameters) {
			let indexs = getIndex(cache.participants, id, true);

			if (cache.participants && cache.participants[indexs]?.admin) {
				cache.participants[indexs].admin = null;
			}

			indexs = getIndex(cache.rawParticipants, id, true);

			if (cache.rawParticipants && cache.rawParticipants[indexs]?.admin) {
				cache.rawParticipants[indexs].admin = null;
			}

			cache.adminGroups.slice(getIndex(cache.adminGroups, id, false), 1);
		}
	} else if (['GROUP_PARTICIPANT_PROMOTE'].includes(type)) {
		for (const id of message.messageStubParameters) {
			let indexs = getIndex(cache.participants, id, true);

			if (cache.participants && cache.participants[indexs]?.admin) {
				cache.participants[indexs].admin = 'admin';
			}

			indexs = getIndex(cache.rawParticipants, id, true);

			if (cache.rawParticipants && cache.rawParticipants[indexs]?.admin) {
				cache.rawParticipants[indexs].admin = 'admin';
			}

			cache.adminGroups.push(id);
		}
	}
};

const sendGroupParticipantsNotification = async (client, message, text) => {
	if (
		['GROUP_PARTICIPANT_LEAVE', 'GROUP_PARTICIPANT_REMOVE', 'GROUP_PARTICIPANT_INVITE', 'GROUP_PARTICIPANT_ADD'].includes(
			message.messageStubType
		) &&
		message.messageStubParameters.length === 1
	) {
		const attach = new Attachment(1024, 500);
		const { profile, radi } = await client.instance
			.profilePictureUrl(message.messageStubParameters[0], 'image')
			.then(async (image) => ({ profile: new Buffer.from(await fetchBUFFER(image)), radi: 180 }))
			.catch(() => ({ profile: './src/media/blank.png', radi: 80 }));

		await attach.init(profile);

		attach.fillBackground();

		await attach.putAssets();
		await attach.appendImage({ roundedRadius: radi });
		await attach
			.appendText(
				['GROUP_PARTICIPANT_LEAVE'].includes(message.messageStubType)
					? 'Leaving the group'
					: ['GROUP_PARTICIPANT_REMOVE'].includes(message.messageStubType)
					? 'Kicked from the group'
					: 'Welcome to',
				message.messageStubParameters[0].split('@')[0],
				message.groupName,
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

		await client.instance.send(
			message.from,
			{
				image,
				caption: text,
				mentions: [...message.messageStubParameters, message.participant || '0@s.whatsapp.net']
			},
			{ groupMetadata: message.groupMetadata }
		);

		return;
	}

	await client.instance.send(
		message.from,
		{
			text,
			mentions: [message.participant, ...message.messageStubParameters]
		},
		{ groupMetadata: message.groupMetadata }
	);
};

const groupParticipantsNotificationHandler = async (client, message, store) => {
	message = await reassign(JSON.parse(JSON.stringify(message)), client, store, false);

	if (Object.keys(EVENT_UPDATE).includes(message.messageStubType) && configuration.cache.metadata.has(message.from)) {
		const cache = configuration.cache.metadata?.get(message.from);

		processMessageStubType(cache, message);
	}

	if (message?.[message.from]?.notification === 'enable') {
		const text = `${'Group Participants Notification'.formatHeaders()}\n
Event Update : ${EVENT_UPDATE[message.messageStubType]}

${
	message?.participant?.split('@')?.[0]
		? `@${message?.participant?.split('@')?.[0]}`
		: message?.messageStubParameters.map((v) => `@${v.split('@')[0]}`).join(', ')
} ${EVENT_UPDATE[message.messageStubType.split('_').reverse()[0]]} ${
			message.messageStubType.split('_').reverse()[0] !== 'LEAVE' && message.messageStubType.split('_').reverse()[0] !== 'ADD'
				? message.messageStubParameters.map((v) => `@${v.split('@')[0]}`).join(', ')
				: ''
		}`;

		await sendGroupParticipantsNotification(client, message, text);
	}
};

export default groupParticipantsNotificationHandler;
