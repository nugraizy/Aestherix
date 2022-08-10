import { delay, downloadMediaMessage } from "@adiwajshing/baileys";
import path from "path";
import sharp from "sharp";
import { __dirname } from "../../connect.js";
import { readJSON, writeJSON } from "../../Helper/index.js";
import { isNsfw } from "../../Utils/Deepai/index.js";

export default {
	async handler({ from, isAdmin, isGroup, isBotAdmin, message, mediaData, isMediaImage, sender, filename, extractMediaData }, client, settings) {
		if (isBotAdmin && isMediaImage && isGroup && settings?.[from]?.["antiNSFW"] == "enable" && !OPTIONS.onlyLogs) {
			const media = await downloadMediaMessage(mediaData, "buffer");
			const buffer = await sharp(media).jpeg({ quality: 50 }).toBuffer();
			const check = await isNsfw(buffer, path.join(__dirname, `Temporary Files/${filename}.${extractMediaData.mimetype.split("/")[1]}`));
			const data = readJSON("./Databases/Groups/settingsManager.json");
			const index = data.findIndex((v) => Object.keys(v)[0] == from);
			const isBanned = data[index][from].banned.includes(sender);
			if (isAdmin) return await client[botNum].reply({ from, quoted: message }, JSON.stringify(check, undefined, 2));
			if (check.status) {
				if (!isBotAdmin) return await client[botNum].reply({ from, quoted: message }, "Anti-NSFW is enabled, but i'm not admin, so i can't kick you.");
				if (!isBanned) {
					await client[botNum].reply({ from, quoted: message }, "Any kind of NSFW Images is Prohibited. This is a warning, you will be kicked if you continue to do this one more time.");
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
					await client[botNum].reply({ from, quoted: message }, "You have been banned from this group for NSFW Images. And you'll be kicked in any second.");
					await delay(350);
					await client[botNum].groupParticipantsUpdate(from, [sender], "remove");
				}
			}
		}
	},
};
