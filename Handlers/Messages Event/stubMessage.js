import { WebMessageInfoStubType } from "../../Helper/Misc/WAData/index.js";

export default {
	async handler(client, message) {
		switch (message.messageStubType) {
			case WebMessageInfoStubType.GROUP_PARTICIPANT_LEAVE:
			case WebMessageInfoStubType.GROUP_PARTICIPANT_INVITE:
			case WebMessageInfoStubType.GROUP_PARTICIPANT_REMOVE:
			case WebMessageInfoStubType.GROUP_PARTICIPANT_ADD:
			case WebMessageInfoStubType.GROUP_PARTICIPANT_PROMOTE:
			case WebMessageInfoStubType.GROUP_PARTICIPANT_DEMOTE: {
				client[botNum].ev.emit("group.participants.update", message, client);
				break;
			}
			case WebMessageInfoStubType.GROUP_CHANGE_SUBJECT:
			case WebMessageInfoStubType.GROUP_CHANGE_ICON:
			case WebMessageInfoStubType.GROUP_CHANGE_DESCRIPTION:
			case WebMessageInfoStubType.GROUP_CHANGE_RESTRICT:
			case WebMessageInfoStubType.GROUP_CHANGE_ANNOUNCE: {
				client[botNum].ev.emit("group.settings.update", message, client);
				break;
			}
			case WebMessageInfoStubType.OVERSIZED: {
				client[botNum].ev.emit("message.oversized", message, client);
				break;
			}
		}
	},
};
