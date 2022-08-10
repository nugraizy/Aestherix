import { readJSON, writeJSON } from "../../Helper/Modules/index.js";

export default {
	async handler({ from, isAdmin, isGroup, isBotAdmin, message, mediaData, sender, isFromMe, body }, client, settings) {
		if (isGroup && settings?.[from]?.antiURL == "enable" && !isAdmin && isBotAdmin && !OPTIONS.onlyLogs) {
			const data = readJSON("./Databases/Groups/settingsManager.json");
			const index = data.findIndex((v) => Object.keys(v)[0] == from);
			const isBanned = data[index][from].banned.includes(sender);
			if (!regex(body)) return;
			if (!checkURL(body)) return;
			if (isAdmin || isFromMe || isOwner) return;
			if (!isBotAdmin) return await client[botNum].reply({ from, quoted: message }, "Anti-URL is enabled, but i'm not admin, so i can't kick you.");
			if (!isBanned) {
				await client[botNum].reply({ from, quoted: message }, "Anti-URL is enabled in this group. You will be kicked if you continue to do this one more time.");
				await client[botNum].sendMessage(from, {
					delete: {
						remoteJid: from,
						participant: sender,
						id: mediaData.stanzaId,
					},
				});
				data[index][from].banned.push(sender);
				writeJSON("./Databases/Groups/settingsManager.json", data);
			} else {
				await client[botNum].reply({ from, quoted: message }, "You have been banned from this group for URL. And you'll be kicked in any second.");
				await client[botNum].groupParticipantsUpdate(from, [sender], "remove");
			}
		}
	},
};

const checkURL = (input) => /(http|ftp|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:\/~+#-]*[\w@?^=%&\/~+#-])/g.test(input);
