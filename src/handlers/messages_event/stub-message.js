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

const handler = async (client, message, store) => {
	switch (true) {
		case EVENTS.GROUPS_PARTICIPANT.some((v) => v === message.messageStubType): {
			if (WebMessageInfoStubType.GROUP_PARTICIPANT_ADD === message.messageStubType) {
				message = await reassign(JSON.parse(JSON.stringify(message)), client, store, false);
				await checkBan(client, message);
			}

			client[botNum].ev.emit('group.participants.update', message, client);
			break;
		}
		case EVENTS.GROUPS_SETTINGS.some((v) => v === message.messageStubType): {
			client[botNum].ev.emit('group.settings.update', message, client);
			break;
		}
		case EVENTS.MISC.some((v) => v === message.messageStubType): {
			client[botNum].ev.emit('message.oversized', message, client);
			break;
		}
	}
};

const stubMessageHandler = handler;

export default stubMessageHandler;
