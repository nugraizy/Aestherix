import path from "path";
import moment from "moment-timezone";
import { __dirname } from "../../connect.js";
import { convertStickerToMedia } from "../../Utils/Converter/index.js";
import { INFOLOG, color } from "../../Helper/Modules/index.js";

export default {
	name: "decrypt",
	description: "Decrypt a sticker to media",
	usage: "decrypt <reply sticker/send sticker>",
	aliases: ["d"],
	category: "Converter",
	cooldown: 5,
	limit: 1,
	async run({ isQuotedSticker, from, message, filename, extractMediaData, sender, prettyNumber }, client) {
		const time = moment().format("HH:mm:ss DD/MM");
		if (!isQuotedSticker) return client[botNum].reply({ from, quoted: message }, "Please reply a sticker to decrypt");
		try {
			client[botNum].downloadAndSaveMediaMessage(extractMediaData, path.join(__dirname, `Temporary Files/${filename}.${extractMediaData.mimetype.split("/")[1]}`)).then(async (results) => {
				const { result } = await convertStickerToMedia(results, sender, extractMediaData); //
				await client[botNum].sendMessage(
					from,
					Buffer.isBuffer(result)
						? {
								image: new Buffer.from(result, "base64"),
						  }
						: {
								video: {
									url: result,
								},
						  },
					{ quoted: message },
				);
				INFOLOG(`[${color(time, "cyan")}]`, `${color(`Media is sent`, "#01cdfe")} to ${color(prettyNumber, "#ff71ce")}`);
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
