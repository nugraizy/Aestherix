import path from "path";
import moment from "moment-timezone";
import fs from "fs";
import { __dirname } from "../../connect.js";
import { soundRemover } from "../../Utils/Converter/index.js";
import { extension } from "../../Utils/Misc/index.js";
import { INFOLOG, color } from "../../Helper/Modules/index.js";

export default {
	name: "soundremover",
	description: "Remove specific sound from audio/video",
	category: "Converter",
	usage: "soundremover <Audio/Video(reply/send)>",
	aliases: ["soundremove", "soundrem", "soundremoveaudio", "soundremovevideo", "soundremoveaudiovideo", "vrm", "srm"],
	cooldown: 5,
	limit: 1,
	async run({ isQuotedAudio, isQuotedDocument, isMediaVid, from, prettyNumber, message, filename, query, extractMediaData }, client) {
		if (!isQuotedAudio && !isQuotedDocument && !isMediaVid) return client[botNum].reply({ from, quoted: message }, "Please send/reply an audio/video to remove voice");
		try {
			const time = moment().format("HH:mm:ss DD/MM");
			INFOLOG(`[${color(time, "cyan")}]`, `${color(`Removing Sound`, "#01cdfe")} for ${color(prettyNumber, "#ff71ce")}`);
			const file = await client[botNum].downloadAndSaveMediaMessage(extractMediaData, path.join(__dirname, `Temporary Files/${filename}.${extractMediaData.mimetype.split("/")[1]}`));
			if (isQuotedDocument && !JSON.parse(fs.readFileSync(path.join(__dirname, "Databases/Mimetypes/Audio.json")).includes(extractMediaData.mimetype)) && !JSON.parse(fs.readFileSync(path.join(__dirname, "Databases/Mimetypes/Video.json")).includes(extractMediaData.mimetype)))
				return client[botNum].reply({ from, quoted: message }, "This file is not an audio/video");
			const { result } = await soundRemover(file, prettyNumber);
			if (/--?(voice|suara)/.test(query) && /--?(instrument(s)?)/.test(query)) return client[botNum].reply({ from, quoted: message }, `${time}\n${result.vocal}\n${result.instrumental}`);
			else if (/--?(voice|suara)/.test(query)) await client[botNum].sendMessage(from, { document: { url: result.instrumental }, fileName: extractMediaData?.fileName?.replace(extension(extractMediaData.mimetype), "mp3") ?? "Made by Nanda.mp3", mimetype: "audio/mp3" }, { quoted: message });
			else if (/--?(instrumen(ts)?)/.test(query)) await client[botNum].sendMessage(from, { document: { url: result.vocal }, fileName: extractMediaData?.fileName?.replace(extension(extractMediaData.mimetype), "mp3") ?? "Made by Nanda.mp3", mimetype: "audio/mp3" }, { quoted: message });
			else await client[botNum].sendMessage(from, { document: { url: result.instrumental }, fileName: extractMediaData.fileName ?? "Made by Nanda.mp3", mimetype: "audio/mp3" }, { quoted: message });
			INFOLOG(`[${color(time, "cyan")}]`, `${color(`Sound is sent`, "#01cdfe")} to ${color(prettyNumber, "#ff71ce")}`);
		} catch (err) {
			let str = "Something went wrong. Please send this error stack to the owner. :\n\n";
			str += `Type : ${err.name ?? "Removing voice"}\n`;
			str += `Message : ${err.message ?? err.error}`;
			await client[botNum].reply({ from, quoted: message }, str + (err.languages ? err.languages.map((v) => `\n${v.code} - ${v.name}`).join("\n") : ""));
			log(err);
		}
	},
};
