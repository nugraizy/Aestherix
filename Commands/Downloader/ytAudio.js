import { delay } from "@adiwajshing/baileys";
import path from "path";
import { __dirname } from "../../index.js";
import { yta } from "../../Utils/YouTube/y2mate.js";
import moment from "moment-timezone";

export default {
	name: "ytaudio",
	description: "Downloads a YouTube audio",
	usage: "!ytaudio <url>",
	aliases: ["yta"],
	category: "Downloader",
	async run(message, client, args) {
		const time = moment().format("HH:mm:ss DD/MM");
		if (!message.query) return client[botNum].reply(message.from, "Please provide a URL");
		let urls = message.query.split(",");
		const { isOne, isURL, INFOLOG, ERRLOG, color, numberWithCommas, removeDuplicatesArray } = await import("../../Helper/Modules/functions.js");
		const { toOpus } = await import("../../Utils/Converter/fileProcessing.js");
		if (isOne(urls.length) && !isURL(message.query)) return client[botNum].reply(message.from, "Please specify a valid url");
		if (isOne(urls.length) && !regex(message.query)) return client[botNum].reply(message.from, "Please specify a valid YouTube url");
		urls = removeDuplicatesArray(urls.map((url) => url.trim()));
		for (const url of urls) {
			if (!isURL(url)) {
				await client[botNum].reply(message.from, "Please specify a valid url");
				continue;
			} else if (!regex(url)) {
				await client[botNum].reply(message.from, "Please specify a valid YouTube url");
				continue;
			}
			const audio = await yta(url);
			INFOLOG(`[${color(time, "cyan")}]`, `${color(`Downloading YouTube Audio`, "#01cdfe")} for ${color(message.prettyNumber, "#ff71ce")}`);
			if ("error" in audio) {
				client[botNum].reply(message.from, audio.error);
				ERRLOG(`[${color(time, "cyan")}]`, `${color("Failed to Download YouTube Audio", "red")} for ${color(message.prettyNumber, "#ff71ce")}`);
			} else {
				const { title, description, timestamp, uploaded, views, author, urlChannel, dl_link, filesize, filesizeF } = audio;
				let capt = "``` • YouTube Audio```\n\n";
				capt += `Title : ${title}\n`;
				capt += `Uploaded : ${uploaded}\n`;
				capt += `Views : ${numberWithCommas(views)}\n`;
				capt += `Author : ${author}\n`;
				capt += `Channel : ${urlChannel}\n`;
				capt += `File Size : ${filesize} (${filesizeF})\n`;
				capt += `Duration : ${timestamp}\n`;
				capt += `Description : ${description}\n`;
				await client[botNum].reply(message.from, capt.trim());
				await client[botNum].sendMessage(message.from, { audio: await toOpus("opus", { input: path.join(__dirname, `Temporary Files/${message.filename}`), output: path.join(__dirname, `Temporary Files/${message.filename}-done`), media: dl_link.replace("https", "http") }), caption: capt.trim() });
			}
		}
		INFOLOG(`[${color(time, "cyan")}]`, `${color(`Downloaded YouTube Audio`, "#01cdfe")} for ${color(message.prettyNumber, "#ff71ce")}`);
	},
};

function regex(input) {
	return /(?:http(?:s|):\/\/|)(?:(?:www\.|)youtube(?:\-nocookie|)\.com\/(?:shorts\/)?(?:watch\?.*(?:|\&)v=|embed\/|v\/)|youtu\.be\/)?\/.+/.test(input);
}
