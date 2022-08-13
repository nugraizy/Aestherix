import moment from "moment-timezone";
import path from "path";

import { __dirname } from "../../connect.js";
import { color, INFOLOG, isURL } from "../../Helper/Modules/index.js";
export default {
	name: "sticker",
	description: "Convert media to sticker",
	usage: "!sticker <reply media/send media>",
	aliases: ["stickers", "st", "stk", "s", "sgif", "sgifs", "stickergif", "stickergifs", "tosticker", "tostickers", "tosticker", "tostickers", "tosticker"],
	category: "Converter",
	cooldown: 5,
	limit: 1,
	status: "enable",
	async run({ isMediaImage, isMediaVid, from, prettyNumber, message, mediaData, stickerAble, typeQuoted, typeSticker, filename, query }, client) {
		const time = moment().format("HH:mm:ss DD/MM");
		if (!isMediaImage && !isMediaVid && !query) return client[botNum].reply({ from, quoted: message }, "Please send/reply a media or send a url to convert to sticker");
		if (query && !isURL(query) && !isMediaImage && !isMediaVid)
			return client[botNum].reply({ from, quoted: message }, "If you trying to convert sticker from url, please provide a valid url");
		if (!stickerAble && !query)
			return client[botNum].reply(
				{ from, quoted: message },
				`Please send/reply a regular media to convert to sticker. Can't convert ${typeQuoted} to sticker, only : ${typeSticker.join(", ").capitalize()}`,
			);
		try {
			if (query && isURL(query)) {
				const sticker = await client[botNum].prepareSticker(query, path.join(__dirname, `Temporary Files/${filename}`), undefined, { author, packname });
				await client[botNum].sendMessage(from, { sticker }, { quoted: message });
			}
			if (isMediaImage) {
				const sticker = await client[botNum].prepareSticker(await client[botNum].downloadMediaMessage(mediaData), path.join(__dirname, `Temporary Files/${filename}`), typeQuoted, {
					author,
					packname,
				});
				await client[botNum].sendMessage(from, { sticker }, { quoted: message });
			}
			if (isMediaVid) {
				const sticker = await client[botNum].prepareSticker(await client[botNum].downloadMediaMessage(mediaData), path.join(__dirname, `Temporary Files/${filename}`), typeQuoted, {
					author,
					packname,
				});
				await client[botNum].sendMessage(from, { sticker }, { quoted: message });
			}
			INFOLOG(`[${color(time, "cyan")}]`, `${color(`Sticker is sent`, "#01cdfe")} to ${color(prettyNumber, "#ff71ce")}`);
		} catch (err) {
			let str = "Something went wrong. Please send this error stack to the owner. :\n\n";
			str += `Type : ${err.name}\n`;
			str += `Message : ${err.message}`;
			await client[botNum].reply({ from, quoted: message }, str);
			log(err);
		}
	},
};
