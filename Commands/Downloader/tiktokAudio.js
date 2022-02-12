import { delay } from "@adiwajshing/baileys";
import path from "path";
import { __dirname } from "../../index.js";
import { tiktokDownloader } from "../../Utils/TikTok/tiktokDownloader.js";
import { mime } from "../../Utils/Misc/mimetype.js";
import moment from "moment-timezone";

export default {
	name: "tiktokaudio",
	description: "Downloads TikTok audio.",
	usage: "!tiktokaudio <url>",
	aliases: ["tiktokaudio", "ttaudio"],
	category: "Downloader",
	async run(message, client, args) {
		const time = moment().format("HH:mm:ss DD/MM");
		if (!message.query) return client[botNum].reply(message.from, "Please provide a URL");
		let urls = message.query.split(",");
		const { isOne, isURL, INFOLOG, ERRLOG, color, removeDuplicatesArray } = await import("../../Helper/Modules/functions.js");
		const { toOpus } = await import("../../Utils/Converter/fileProcessing.js");
		if (isOne(urls.length) && !isURL(message.query)) return client[botNum].reply(message.from, "Please specify a valid url");
		if (isOne(urls.length) && !regex(message.query)) return client[botNum].reply(message.from, "Please specify a valid TikTok url");
		urls = removeDuplicatesArray(urls.map((url) => url.trim()));
		for (const url of urls) {
			if (!isURL(url)) {
				await client[botNum].reply(message.from, "Please specify a valid url");
				continue;
			} else if (!regex(url)) {
				await client[botNum].reply(message.from, "Please specify a valid TikTok url");
				continue;
			}
			const audio = await tiktokDownloader(url);
			INFOLOG(`[${color(time, "cyan")}]`, `${color(`Downloading TikTok Audio`, "#01cdfe")} for ${color(message.prettyNumber, "#ff71ce")}`);
			if ("error" in audio) {
				client[botNum].reply(message.from, audio.error);
				ERRLOG(`[${color(time, "cyan")}]`, `${color("Failed to Download TikTok Audio", "red")} for ${color(message.prettyNumber, "#ff71ce")}`);
			} else {
				await client[botNum].sendMessage(
					message.from,
					{ document: await toOpus("opus", { input: path.join(__dirname, `Temporary Files/${message.filename}`), output: path.join(__dirname, `Temporary Files/${message.filename}-done`), media: audio.music }), fileName: `${audio.description}.mp3`, mimetype: mime("mp3") },
					{ quotes: message.message },
				);
				await delay(300);
			}
		}
	},
};

function regex(input) {
	return /(?:https:?\/{2})?(?:w{3}|vm|vt|t)?\.?tiktok.com\/([^\s&]+)/gi.test(input);
}
