import path from "path";
import moment from "moment-timezone";
import { convertMediaToSticker } from "../../Utils/Converter/index.js";
import { INFOLOG, color } from "../../Helper/Modules/index.js";
import { __dirname } from "../../connect.js";
import { createExif } from "../../Utils/Misc/index.js";

export default {
	name: "sticker",
	description: "Convert media to sticker",
	usage: "sticker <reply media/send media>",
	aliases: ["stickers", "st", "stk", "s", "sgif", "sgifs", "stickergif", "stickergifs", "tosticker", "tostickers", "tosticker", "tostickers", "tosticker"],
	category: "Converter",
	cooldown: 5,
	limit: 1,
	async run({ isMediaImage, isMediaVid, from, prettyNumber, message, filename, extractMediaData }, client) {
		const time = moment().format("HH:mm:ss DD/MM");
		if (!isMediaImage && !isMediaVid) return client[botNum].reply(from, "Please send/reply a media to convert to sticker");
		try {
			const file = await client[botNum].downloadAndSaveMediaMessage(extractMediaData, path.join(__dirname, `Temporary Files/${filename}.${extractMediaData.mimetype.split("/")[1]}`));
			createExif("Made by Nanda", "Void bot");
			const sticker = await convertMediaToSticker(file, prettyNumber);
			await client[botNum].sendMessage(from, { sticker }, { quoted: message });
			INFOLOG(`[${color(time, "cyan")}]`, `${color(`Sticker is sent`, "#01cdfe")} to ${color(prettyNumber, "#ff71ce")}`);
		} catch (err) {
			let str = "Something went wrong. Please send this error stack to the owner. :\n\n";
			str += `Type : ${err.name}\n`;
			str += `Message : ${err.message}`;
			await client[botNum].reply(from, str);
			log(err);
		}
	},
};
