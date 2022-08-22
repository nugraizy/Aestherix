import moment from "moment-timezone";
import path from "path";
import { __dirname } from "../../connect.js";
import { color, INFOLOG } from "../../Helper/Modules/index.js";
import { tesseract } from "../../Utils/Misc/index.js";

export default {
	name: "textrecognition",
	description: "Recognize text from image",
	usage: "!textrecognition <Image(reply/send)>",
	category: "Converter",
	aliases: ["ocr"],
	cooldown: 5,
	limit: 1,
	status: "enable",
	async run({ isMediaImage, from, prettyNumber, message, filename, query, extractMediaData, typeQuoted }, client) {
		if (!isMediaImage) {
			return await client[botNum].reply({ from, quoted: message }, "Please send/reply an image to recognize text");
		}
		const time = moment().format("HH:mm:ss DD/MM");
		const file = await client[botNum].downloadAndSaveMediaMessage(
			extractMediaData,
			path.join(__dirname, `Temporary Files/${filename}.${extractMediaData.mimetype.split("/")[1]}`),
			typeQuoted,
		);
		const { result } = await tesseract(file, prettyNumber, query);
		await client[botNum].sendMessage(from, { text: result.text.trim() }, { quoted: message });
		INFOLOG(`[${color(time, "cyan")}]`, `${color(`Text is sent`, "#01cdfe")} to ${color(prettyNumber, "#ff71ce")}`);
	},
};
