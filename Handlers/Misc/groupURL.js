import { writeJSON, readJSON } from "../../Helper/Modules/index.js";

export default {
	async handler(message, client) {
		if (message.isGroup && message[message.from].antiURL == "enable" && !message.isAdmin && message.isBotAdmin && !OPTIONS.onlyLogs) {
			const { from, body, sender, isAdmin, isFromMe, isBotAdmin, isOwner } = message;
			const data = readJSON("./Databases/Groups/settingsManager.json");
			const index = data.findIndex((v) => Object.keys(v)[0] == from);
			if (!regex(body)) return;
			if (isAdmin || isFromMe || isOwner) return;
			if (!checkURL(body)) return;
			if (isBotAdmin) await client[botNum].groupParticipantsUpdate(from, [sender], "remove");
			if (!data[index][from].banned.includes(sender)) {
				data[index][from].banned.push(sender);
				writeJSON("./Databases/Groups/settingsManager.json", data);
			}
		}
	},
};

const checkURL = (input) => /(http|ftp|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:\/~+#-]*[\w@?^=%&\/~+#-])/g.test(input);
