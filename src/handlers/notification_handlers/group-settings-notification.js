import configuration from '../../helper/config/connect.js';
import { reassign } from '../../helper/index.js';

const EVENT_UPDATE = {
	GROUP_CHANGE_SUBJECT: 'Subject Changed',
	GROUP_CHANGE_DESCRIPTION: 'Description Changed',
	GROUP_CHANGE_RESTRICT: 'Restrictions Changed',
	GROUP_CHANGE_ANNOUNCE: 'Announcement Changed',
	GROUP_CHANGE_ICON: 'Icon Changed',
	GROUP_INVITE_CHANGED: 'Invite Changed',
	SUBJECT: 'Changing Subject',
	ICON: 'Changing Icons',
	DESCRIPTION: 'Changing Description',
	DEL_DESCRIPTION: 'Deletes Description',
	DEL_ICON: 'Deletes Icons',
	RESTRICT: 'Changing Mode Restrictions',
	ANNOUNCE: 'Changing Mode Announcement',
	REVOKE_INVITE: 'Revokes Invitation URL'
};

const EVENT_TYPE = {
	DESCRIPTION: 'GROUP_CHANGE_DESCRIPTION'
};

/**
 * @param {import('@adiwajshing/baileys').proto.IWebMessageInfo} message
 */
const handleDescriptionAction = (message) => {
	if ('action' in message && message.action === 'description') {
		message.messageStubType = EVENT_TYPE.DESCRIPTION;
	}
};

/**
 * @param {import('@adiwajshing/baileys').proto.IWebMessageInfo & import('../../helper/index.js').ReassignResult} message
 */
const updateCacheForSubjectAndDescription = (message) => {
	if (configuration.cache.metadata.has(message.from)) {
		const cache = configuration.cache.metadata.get(message.from);

		if (['GROUP_CHANGE_SUBJECT'].includes(message.messageStubType)) {
			cache.subject = message.messageStubParameters[0];
			cache.subjectOwner = message.participant;
			cache.subjectTime = parseInt(message.messageTimestamp);
		} else if (['GROUP_CHANGE_DESCRIPTION'].includes(message.messageStubType)) {
			cache.desc = Buffer.from(message.content).toString();
		}
	}
};

/**
 *
 * @param {typeof client} client
 * @param {import('@adiwajshing/baileys').proto.IWebMessageInfo & import('../../helper/index.js').ReassignResult} message
 * @param {string} status
 */
const sendGroupSettingsNotification = async (client, message, status) => {
	await client.instance.send(
		message.from,
		{
			text: `${'Group Settings Notification'.formatHeaders()}\n
Event Update : ${EVENT_UPDATE[message.messageStubType]}

@${message.participant.split('@')[0]} ${status}`,
			mentions: [message.participant]
		},
		{ groupMetadata: message.groupMetadata }
	);
};

/**
 *
 * @param {typeof client} client
 * @param {import('@adiwajshing/baileys').proto.IWebMessageInfo & import('../../helper/index.js').ReassignResult} message
 * @param {import('../../helper/connection/type.js').Store} store
 */
const groupSettingsNotificationHandler = async (client, message, store) => {
	handleDescriptionAction(message);
	message = await reassign(JSON.parse(JSON.stringify(message)), client, store, false);

	updateCacheForSubjectAndDescription(message);

	if (message?.[message.from]?.notification === 'enable') {
		let status;

		if (message.action === 'set') {
			message.messageStubType = 'GROUP_CHANGE_ICON';
			status = EVENT_UPDATE.ICON;
		} else if (message.action === 'delete') {
			message.messageStubType = 'GROUP_CHANGE_ICON';
			status = EVENT_UPDATE.DEL_ICON;
		} else if (message.action === 'description' && message.content !== '') {
			message.messageStubType = 'GROUP_CHANGE_DESCRIPTION';
			status =
				message[message.from].groupDescription !== undefined
					? `${EVENT_UPDATE.DESCRIPTION} from ${message[message.from].groupDescription} to ${message.content}`
					: `${EVENT_UPDATE.DESCRIPTION} to ${message.content}`;
		} else if (message.action === 'description' && message.content === '') {
			message.messageStubType = 'GROUP_CHANGE_DESCRIPTION';
			status = `${EVENT_UPDATE.DEL_DESCRIPTION} from ${message[message.from].groupDescription}`;
		} else if (message.action === 'invite') {
			message.messageStubType = 'GROUP_INVITE_CHANGED';
			status = EVENT_UPDATE.REVOKE_INVITE;
		} else {
			const mode = message.messageStubType.split('_').reverse()[0];

			status =
				mode === 'ANNOUNCE'
					? `${message.messageStubParameters[0] === 'on' ? 'Enabling Announcement Mode' : 'Disabling Announcement Mode'}`
					: mode === 'RESTRICT'
					? `${message.messageStubParameters[0] === 'on' ? 'Enabling Mode Restrictions' : 'Disabling Mode Restrictions'}`
					: `${EVENT_UPDATE[mode]} from ${message[message.from].groupName} to ${message.messageStubParameters[0]}`;
		}

		await sendGroupSettingsNotification(client, message, status);
	}
};

export default groupSettingsNotificationHandler;
