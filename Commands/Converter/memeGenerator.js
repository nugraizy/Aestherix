import path from "path";
import moment from "moment-timezone";
import parser from "yargs-parser";
import { writeFileSync } from "fs";
import { memeGenerator } from "../../Helper/Canvas/index.js";
import { INFOLOG, ERRLOG, color } from "../../Helper/Modules/index.js";
import { __dirname } from "../../connect.js";
import { convertStickerToMedia } from "../../Utils/Converter/index.js";
const WATERMARK = "made by void bot";
const DEFAULT_TYPE = "image";

export default {
	name: "memegen",
	description: "Meme Generator, Y'know the drill",
	usage: "memegen <reply media/send media> <[Top Texts] & [Bottom Texts]> [options]\nOptions:\n-stk / -img",
	aliases: ["mgen", "memgen", "memegen"],
	category: "Converter",
	cooldown: 5,
	limit: 1,
	async run({ query, isMediaImage, isSticker, isQuotedSticker, from, prettyNumber, message, filename, extractMediaData, sender }, client) {
		const time = moment().format("HH:mm:ss DD/MM");
		if (!isMediaImage && !(isQuotedSticker || isSticker)) return client[botNum].reply({ from, quoted: message }, "Please send/reply a media to convert to sticker");
		if (!query) return client[botNum].reply({ from, quoted: message }, "Please provide a query, use & to split top/bottom text");
		try {
			const parsed = parser(query.toLowerCase(), {
				configuration: {
					"short-option-groups": false,
				},
				alias: {
					isStickers: ["stk", "stick", "sticker", "sticks", "stc"],
					isImage: ["img", "image", "foto", "images"],
				},
			});
			const regexs = new RegExp(`--?(${Object.keys(parsed).join("|")})`, "g");
			query = query.replace(regexs, "");
			client[botNum].downloadAndSaveMediaMessage(extractMediaData, path.join(__dirname, `Temporary Files/${filename}.${extractMediaData.mimetype.split("/")[1]}`)).then(async (results) => {
				try {
					let image = results;
					if (isQuotedSticker) {
						const { result } = await convertStickerToMedia(results, sender, extractMediaData);
						writeFileSync(path.join(__dirname, `Temporary Files/${filename}.png`), new Buffer.from(result, "base64"));
						image = path.join(__dirname, `Temporary Files/${filename}.png`);
					}
					const buffer = await memeGenerator(sender, image, query.split("&")[0], query.split("&")[1], parsed.isStickers ? "sticker" : parsed.isImage ? "image" : DEFAULT_TYPE, WATERMARK);
					if (parsed.isStickers) {
						await client[botNum].sendMessage(from, { sticker: buffer }, { quoted: message });
					} else {
						await client[botNum].sendMessage(from, { image: buffer, caption: "Meme Generator Made by Void bot using Canvas" }, { quoted: message });
					}
					INFOLOG(`[${color(time, "cyan")}]`, `${color(`${parsed.isStickers ? "Sticker" : "Image"} is sent`, "#01cdfe")} to ${color(prettyNumber, "#ff71ce")}`);
				} catch (err) {
					let str = "Something went wrong :\n\n";
					str += `Type : ${err.name}\n`;
					str += `Message : ${err.message}`;
					await client[botNum].reply({ from, quoted: message }, str);
					ERRLOG(`[${color(time, "cyan")}]`, `${color(`Failed to Generate a Meme. Reason : ${err.name}`, "red")} for ${color(sender, "#ff71ce")}`);
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
