import fs from "fs";
import moment from "moment-timezone";
import path from "path";
import { __dirname } from "../../connect.js";
import { color, INFOLOG } from "../../Helper/Modules/index.js";
import { soundRemover } from "../../Utils/Converter/index.js";
import { extension } from "../../Utils/Misc/index.js";

export default {
	name: "soundremover",
	description: "Remove specific sound from audio/video",
	category: "Converter",
	usage: "!soundremover <Audio/Video(reply/send)>",
	aliases: ["soundremove", "soundrem", "soundremoveaudio", "soundremovevideo", "soundremoveaudiovideo", "vrm", "srm"],
	cooldown: 5,
	limit: 1,
	status: "enable",
	async run({ isQuotedAudio, isQuotedDocument, isMediaVid, from, prettyNumber, message, filename, query, extractMediaData, typeQuoted }, client) {
		if (!isQuotedAudio && !isQuotedDocument && !isMediaVid) {
			return await client[botNum].reply({ from, quoted: message }, "Please send/reply an audio/video to remove voice");
		}
		const time = moment().format("HH:mm:ss DD/MM");
		INFOLOG(`[${color(time, "cyan")}]`, `${color(`Removing Sound`, "#01cdfe")} for ${color(prettyNumber, "#ff71ce")}`);
		const file = await client[botNum].downloadAndSaveMediaMessage(
			extractMediaData,
			path.join(__dirname, `Temporary Files/${filename}.${extractMediaData.mimetype.split("/")[1]}`),
			typeQuoted,
		);
		if (
			isQuotedDocument &&
			!JSON.parse(fs.readFileSync(path.join(__dirname, "Databases/Mimetypes/Audio.json")).includes(extractMediaData.mimetype)) &&
			!JSON.parse(fs.readFileSync(path.join(__dirname, "Databases/Mimetypes/Video.json")).includes(extractMediaData.mimetype))
		) {
			return await client[botNum].reply({ from, quoted: message }, "This file is not an audio/video");
		}
		const { result } = await soundRemover(file, prettyNumber);
		if (/--?(voice|suara)/.test(query) && /--?(instrument(s)?)/.test(query)) {
			return await client[botNum].reply({ from, quoted: message }, `${time}\n${result.vocal}\n${result.instrumental}`);
		} else if (/--?(voice|suara)/.test(query)) {
			await client[botNum].sendMessage(
				from,
				{
					document: { url: result.instrumental },
					fileName: extractMediaData?.fileName?.replace(extension(extractMediaData.mimetype), "mp3") ?? "Made by Nanda.mp3",
					mimetype: "audio/mp3",
				},
				{ quoted: message },
			);
		} else if (/--?(instrumen(ts)?)/.test(query)) {
			await client[botNum].sendMessage(
				from,
				{ document: { url: result.vocal }, fileName: extractMediaData?.fileName?.replace(extension(extractMediaData.mimetype), "mp3") ?? "Made by Nanda.mp3", mimetype: "audio/mp3" },
				{ quoted: message },
			);
		} else {
			await client[botNum].sendMessage(
				from,
				{ document: { url: result.instrumental }, fileName: extractMediaData.fileName ?? "Made by Nanda.mp3", mimetype: "audio/mp3" },
				{ quoted: message },
			);
		}
		INFOLOG(`[${color(time, "cyan")}]`, `${color(`Sound is sent`, "#01cdfe")} to ${color(prettyNumber, "#ff71ce")}`);
	},
};
