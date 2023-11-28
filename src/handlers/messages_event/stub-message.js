import { reassign } from '../../helper/index.js';
import { WebMessageInfoStubType } from '../../helper/misc/wa_data/index.js';
import { checkBan } from '../misc/check-banned.js';

const EVENTS = {
	GROUPS_PARTICIPANT: [
		WebMessageInfoStubType.GROUP_PARTICIPANT_LEAVE,
		WebMessageInfoStubType.GROUP_PARTICIPANT_INVITE,
		WebMessageInfoStubType.GROUP_PARTICIPANT_REMOVE,
		WebMessageInfoStubType.GROUP_PARTICIPANT_ADD,
		WebMessageInfoStubType.GROUP_PARTICIPANT_PROMOTE,
		WebMessageInfoStubType.GROUP_PARTICIPANT_DEMOTE
	],
	GROUPS_SETTINGS: [
		WebMessageInfoStubType.GROUP_CHANGE_SUBJECT,
		WebMessageInfoStubType.GROUP_CHANGE_RESTRICT,
		WebMessageInfoStubType.GROUP_CHANGE_ANNOUNCE
	],
	MISC: [WebMessageInfoStubType.OVERSIZED]
};

/**
 * @param {typeof client} client
 * @param {import('@adiwajshing/baileys').proto.IWebMessageInfo} message
 * @param {import('../../helper/connection/type.js').Store} store
 */
const handleGroupParticipantEvent = async (client, message, store) => {
	if (WebMessageInfoStubType.GROUP_PARTICIPANT_ADD === message.messageStubType) {
		message = await reassign(JSON.parse(JSON.stringify(message)), client, store, false);
		await checkBan(client, message);
	}

	client.instance.ev.emit('group.participants.update', message, client);
};

/**
 * @param {typeof client} client
 * @param {import('@adiwajshing/baileys').proto.IWebMessageInfo} message
 */
const handleGroupSettingsEvent = (client, message) => {
	client.instance.ev.emit('group.settings.update', message, client);
};

/**
 * @param {typeof client} client
 * @param {import('@adiwajshing/baileys').proto.IWebMessageInfo} message
 */
const handleMiscEvent = (client, message) => {
	client.instance.ev.emit('message.oversized', message, client);
};

/**
 * @param {typeof client} client
 * @param {import('@adiwajshing/baileys').proto.IWebMessageInfo} message
 * @param {import('../../helper/connection/type.js').Store} store
 */
const stubMessageHandler = async (client, message, store) => {
	switch (true) {
		case EVENTS.GROUPS_PARTICIPANT.includes(message.messageStubType):
			await handleGroupParticipantEvent(client, message, store);
			break;
		case EVENTS.GROUPS_SETTINGS.includes(message.messageStubType):
			handleGroupSettingsEvent(client, message);
			break;
		case EVENTS.MISC.includes(message.messageStubType):
			handleMiscEvent(client, message);
			break;
	}
};

export default stubMessageHandler;
