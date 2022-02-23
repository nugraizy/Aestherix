import path from "path";
import moment from "moment-timezone";
import { __dirname } from "../../connect.js";
import { tesseract } from "../../Utils/Misc/index.js";
import { INFOLOG, color } from "../../Helper/Modules/index.js";

export default {
	name: "textrecognition",
	description: "Recognize text from image",
	usage: "textrecognition <Image(reply/send)>",
	category: "Converter",
	aliases: ["ocr"],
	async run({ isMediaImage, from, prettyNumber, message, filename, query, extractMediaData }, client) {
		if (!isMediaImage) return client[botNum].reply(from, "Please send/reply an image to recognize text");
		try {
			const time = moment().format("HH:mm:ss DD/MM");
			const file = await client[botNum].downloadAndSaveMediaMessage(extractMediaData, path.join(__dirname, `Temporary Files/${filename}.${extractMediaData.mimetype.split("/")[1]}`));
			const { result } = await tesseract(file, prettyNumber, query);
			await client[botNum].sendMessage(from, { text: result.text.trim() }, { quoted: message });
			INFOLOG(`[${color(time, "cyan")}]`, `${color(`Text is sent`, "#01cdfe")} to ${color(prettyNumber, "#ff71ce")}`);
		} catch (err) {
			let str = "Something went wrong. Please send this error stack to the owner. :\n\n";
			str += `Type : ${err.name ?? "Recognizing"}\n`;
			str += `Message : ${err.message ?? err.error}`;
			await client[botNum].reply(from, str + (err.languages ? err.languages.map((v) => `\n${v.code} - ${v.name}`).join("\n") : ""));
			console.log(err);
		}
	},
};
