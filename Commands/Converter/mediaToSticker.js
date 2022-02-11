import path from "path";
import moment from "moment-timezone";
import { convertMediaToSticker } from "../../Utils/Converter/fileProcessing.js";
import { __dirname } from "../../index.js";
import { createExif } from "../../Utils/Misc/createExif.js";

export default {
	name: "sticker",
	description: "Convert media to sticker",
	usage: "sticker <reply media/send media>",
	aliases: ["stickers", "st", "stk", "s", "sgif", "sgifs", "stickergif", "stickergifs", "tosticker", "tostickers", "tosticker", "tostickers", "tosticker"],
	category: "Converter",
	async run(message, client, args) {
		const time = moment().format("HH:mm:ss DD/MM");
		if (!message.isMediaImage && !message.isMediaVid) return client[botNum].reply(message.from, "Please send/reply a media to convert to sticker");
		const file = await client[botNum].downloadAndSaveMediaMessage(message.extractMediaData, path.join(__dirname, `Temporary Files/${message.filename}.${message.extractMediaData.mimetype.split("/")[1]}`));
		createExif("Made by Nanda", "Void bot");
		const sticker = await convertMediaToSticker(file, message.prettyNumber);
		await client[botNum].sendMessage(message.from, { sticker }, { quoted: message.message });
		const { INFOLOG, color } = await import("../../Helper/Modules/functions.js");
		INFOLOG(`[${color(time, "cyan")}]`, `${color(`Sticker is sent`, "#01cdfe")} to ${color(message.prettyNumber, "#ff71ce")}`);
	},
};
