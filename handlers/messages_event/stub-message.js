/* global botNum */
import { reassign } from '../../helper/index.js';
import { WebMessageInfoStubType } from '../../helper/misc/wa_data/index.js';
import { checkBan } from '../misc/check-banned.js';

export default {
	async handler(client, message, store) {
		switch (message.messageStubType) {
			case WebMessageInfoStubType.GROUP_PARTICIPANT_LEAVE:
			case WebMessageInfoStubType.GROUP_PARTICIPANT_INVITE:
			case WebMessageInfoStubType.GROUP_PARTICIPANT_REMOVE:
			case WebMessageInfoStubType.GROUP_PARTICIPANT_ADD:
			case WebMessageInfoStubType.GROUP_PARTICIPANT_PROMOTE:
			case WebMessageInfoStubType.GROUP_PARTICIPANT_DEMOTE: {
				if (WebMessageInfoStubType.GROUP_PARTICIPANT_ADD === message.messageStubType) {
					message = await reassign(JSON.parse(JSON.stringify(message)), client, store, false);
					await checkBan(client, message, message);
				}

				client[botNum].ev.emit('group.participants.update', message, client);
				break;
			}
			case WebMessageInfoStubType.GROUP_CHANGE_SUBJECT:
			case WebMessageInfoStubType.GROUP_CHANGE_RESTRICT:
			case WebMessageInfoStubType.GROUP_CHANGE_ANNOUNCE: {
				client[botNum].ev.emit('group.settings.update', message, client);
				break;
			}
			case WebMessageInfoStubType.OVERSIZED: {
				client[botNum].ev.emit('message.oversized', message, client);
				break;
			}
		}
	},
};
