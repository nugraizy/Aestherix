import { downloadMediaMessage } from "@adiwajshing/baileys";
import sharp from "sharp";
import path from "path";
import { __dirname } from "../../connect.js";
import { readJSON, writeJSON } from "../../Helper/index.js";
import { isNsfw } from "../../Utils/Deepai/index.js";

export default {
	async handler({ from, isAdmin, isGroup, isBotAdmin, message, mediaData, isMediaImage, sender, filename, extractMediaData }, client, settings) {
		const play = async () => {
			const media = await downloadMediaMessage(mediaData, "buffer");
			const buffer = await sharp(media).jpeg({ quality: 50 }).toBuffer();
			const check = await isNsfw(buffer, path.join(__dirname, `Temporary Files/${filename}.${extractMediaData.mimetype.split("/")[1]}`));
			if (isAdmin) return await client[botNum].reply({ from, quoted: message }, JSON.stringify(check, undefined, 2));
			if (check.status) {
				const data = readJSON("./Databases/Groups/settingsManager.json");
				const index = data.findIndex((v) => Object.keys(v)[0] == from);
				await client[botNum].reply({ from, quoted: message }, "Any kind of NSFW Images is Prohibited");
				await client[botNum].groupParticipantsUpdate(from, [sender], "remove");
				if (!data[index][from].banned.includes(sender)) {
					data[index][from].banned.push(sender);
					writeJSON("./Databases/Groups/settingsManager.json", data);
				}
			}
		};
		if (isBotAdmin && isMediaImage && isGroup && settings[from]["antiNSFW"] == "enable" && !OPTIONS.onlyLogs) await play();
	},
};
