import { reassign } from "../../Helper/index.js";

const EVENT_UPDATE = {
	GROUP_PARTICIPANT_LEAVE: "Member Leave",
	GROUP_PARTICIPANT_INVITE: "Invited Member",
	GROUP_PARTICIPANT_REMOVE: "Removed Member",
	GROUP_PARTICIPANT_ADD: "Added Member",
	GROUP_PARTICIPANT_PROMOTE: "Promoted Member",
	GROUP_PARTICIPANT_DEMOTE: "Demoted Admin",
	ADD: "Adding",
	REMOVE: "Removing",
	PROMOTE: "Promoting",
	DEMOTE: "Demoting",
};

export default {
	async handler(client, message, store) {
		message = await reassign(JSON.parse(JSON.stringify(message)), client, store, false);
		if (message[message.from].notification == "enable") {
			client[botNum].sendMessage(message.from, {
				text: `\`\`\` • Group Participants Notification\`\`\`\n
Event Update : ${EVENT_UPDATE[message.messageStubType]}

@${message.participant.split("@")[0]} ${EVENT_UPDATE[message.messageStubType.split("_").reverse()[0]]} ${message.messageStubParameters.map((v) => `@${v.split("@")[0]}`).join(", ")}`,
				mentions: [message.participant, ...message.messageStubParameters],
			});
		}
	},
};
