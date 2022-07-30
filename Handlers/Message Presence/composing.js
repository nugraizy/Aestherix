import { checkAfk, getAfk, deleteAfk } from "../../Helper/index.js";
import { getTimeSince } from "../../Helper/Modules/index.js";

export default {
	async handler(client, from, participant) {
		if (checkAfk(participant, from)) {
			const container = getAfk(participant, from);
			const { reasons, since } = container;
			if (since == new Date().getTime()) return;
			const time = getTimeSince(since);
			await client[botNum].sendMessage(from, { text: `@${participant.split("@")[0]} detected writing. AFK since ${time} ago. Now they are out from AFK. Reason : ${reasons}`, mentions: [participant] });
			deleteAfk(participant, from);
		}
	},
};
