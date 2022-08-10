import moment from "moment-timezone";
import path from "path";
import { __dirname } from "../../connect.js";
import { color, INFOLOG } from "../../Helper/Modules/index.js";
import { convertMediaToSticker } from "../../Utils/Converter/index.js";

export default {
	name: "sticker",
	description: "Convert media to sticker",
	usage: "!sticker <reply media/send media>",
	aliases: ["stickers", "st", "stk", "s", "sgif", "sgifs", "stickergif", "stickergifs", "tosticker", "tostickers", "tosticker", "tostickers", "tosticker"],
	category: "Converter",
	cooldown: 5,
	limit: 1,
	status: "enable",
	async run({ isMediaImage, isMediaVid, from, prettyNumber, message, filename, extractMediaData, stickerAble, typeQuoted, typeSticker }, client) {
		const time = moment().format("HH:mm:ss DD/MM");
		if (!isMediaImage && !isMediaVid) return client[botNum].reply({ from, quoted: message }, "Please send/reply a media to convert to sticker");
		if (!stickerAble)
			return client[botNum].reply(
				{ from, quoted: message },
				`Please send/reply a regular media to convert to sticker. Can't convert ${typeQuoted} to sticker, only : ${typeSticker.join(", ").capitalize()}`,
			);
		try {
			client[botNum]
				.downloadAndSaveMediaMessage(extractMediaData, path.join(__dirname, `Temporary Files/${filename}.${extractMediaData.mimetype.split("/")[1]}`))
				.then(async (result) => {
					try {
						const sticker = await convertMediaToSticker(result, prettyNumber, undefined, extractMediaData.mimetype);
						await client[botNum].sendMessage(from, { sticker }, { quoted: message });
						INFOLOG(`[${color(time, "cyan")}]`, `${color(`Sticker is sent`, "#01cdfe")} to ${color(prettyNumber, "#ff71ce")}`);
					} catch (err) {
						let str = "Something went wrong :\n\n";
						str += `Type : ${err.name}\n`;
						str += `Message : ${err.message}`;
						await client[botNum].reply({ from, quoted: message }, str);
						ERRLOG(`[${color(time, "cyan")}]`, `${color(`Failed to Convert Media to Sticker. Reason : ${err.name}`, "red")} for ${color(sender, "#ff71ce")}`);
						log(err);
					}
				});
		} catch (err) {
			let str = "Something went wrong. Please send this error stack to the owner. :\n\n";
			str += `Type : ${err.name}\n`;
			str += `Message : ${err.message}`;
			await client[botNum].reply({ from, quoted: message }, str);
			log(err);
		}
	},
};
