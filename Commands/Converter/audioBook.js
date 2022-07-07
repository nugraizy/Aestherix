import LANGUAGE from "cld";
import moment from "moment-timezone";
import path from "path";
import { tesseract } from "../../Utils/Misc/index.js";
import { textToSpeech } from "../../Utils/Converter/index.js";
import { __dirname } from "../../connect.js";
import { INFOLOG, color } from "../../Helper/Modules/index.js";

export default {
	name: "audiobook",
	description: "Take a picture and turn it into an audio book.",
	usage: "!audiobook <reply media/send media>",
	aliases: ["audbook"],
	category: "Converter",
	cooldown: 5,
	limit: 1,
	async run({ isMediaImage, from, prettyNumber, message, filename, extractMediaData }, client) {
		if (!isMediaImage) return client[botNum].reply({ from, quoted: message }, "Please send/reply an image to recognize text");
		try {
			const time = moment().format("HH:mm:ss DD/MM");
			const file = await client[botNum].downloadAndSaveMediaMessage(extractMediaData, path.join(__dirname, `Temporary Files/${filename}.${extractMediaData.mimetype.split("/")[1]}`));
			const { result } = await tesseract(file, prettyNumber);
			const lang = (await LANGUAGE.detect(result.text)).languages[0].code || "id";
			const { buffer } = await textToSpeech(result.text.trim(), lang, path.join(__dirname, `Temporary Files/${filename}`));
			await client[botNum].sendMessage(from, { text: result.text.trim() }, { quoted: message });
			await client[botNum].sendMessage(from, { audio: buffer }, { quoted: message });
			INFOLOG(`[${color(time, "cyan")}]`, `${color(`Text is sent`, "#01cdfe")} to ${color(prettyNumber, "#ff71ce")}`);
		} catch (err) {
			let str = "Something went wrong. Please send this error stack to the owner. :\n\n";
			str += `Type : ${err.name ?? "Recognizing"}\n`;
			str += `Message : ${err.message ?? err.error}`;
			await client[botNum].reply({ from, quoted: message }, str + (err.languages ? err.languages.map((v) => `\n${v.code} - ${v.name}`).join("\n") : ""));
			log(err);
		}
	},
};
