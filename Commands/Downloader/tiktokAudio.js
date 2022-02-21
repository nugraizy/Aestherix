import { delay } from "@adiwajshing/baileys";
import path from "path";
import moment from "moment-timezone";
import { __dirname } from "../../index.js";
import { tiktokDownloader } from "../../Utils/TikTok/index.js";
import { mime } from "../../Utils/Misc/index.js";

export default {
	name: "tiktokaudio",
	description: "Downloads TikTok audio.",
	usage: "!tiktokaudio <url>",
	aliases: ["tiktokaudio", "ttaudio"],
	category: "Downloader",
	async run({ from, query, prettyNumber, filename, message }, client) {
		const time = moment().format("HH:mm:ss DD/MM");
		if (!query) return client[botNum].reply(from, "Please provide a URL");
		try {
			let urls = query.split(",");
			const { isOne, isURL, INFOLOG, ERRLOG, color, removeDuplicatesArray } = await import("../../Helper/Modules/index.js");
			const { toOpus } = await import("../../Utils/Converter/index.js");
			if (isOne(urls.length) && !isURL(query)) return client[botNum].reply(from, "Please specify a valid url");
			if (isOne(urls.length) && !regex(query)) return client[botNum].reply(from, "Please specify a valid TikTok url");
			urls = removeDuplicatesArray(urls.map((url) => url.trim()));
			for (const url of urls) {
				if (!isURL(url)) {
					await client[botNum].reply(from, "Please specify a valid url");
					continue;
				} else if (!regex(url)) {
					await client[botNum].reply(from, "Please specify a valid TikTok url");
					continue;
				}
				const audio = await tiktokDownloader(url);
				INFOLOG(`[${color(time, "cyan")}]`, `${color(`Downloading TikTok Audio`, "#01cdfe")} for ${color(prettyNumber, "#ff71ce")}`);
				if ("error" in audio) {
					client[botNum].reply(from, audio.error);
					ERRLOG(`[${color(time, "cyan")}]`, `${color("Failed to Download TikTok Audio", "red")} for ${color(prettyNumber, "#ff71ce")}`);
				} else {
					await client[botNum].sendMessage(
						from,
						{ document: await toOpus("opus", { input: path.join(__dirname, `Temporary Files/${filename}`), output: path.join(__dirname, `Temporary Files/${filename}-done`), media: audio.music }), fileName: `${audio.description}.mp3`, mimetype: mime("mp3") },
						{ quotes: message },
					);
					await delay(300);
				}
			}
			INFOLOG(`[${color(time, "cyan")}]`, `${color(`Downloaded TikTok Audio`, "#01cdfe")} for ${color(prettyNumber, "#ff71ce")}`);
		} catch (err) {
			let str = "Something went wrong. Please send this error stack to the owner. :\n\n";
			str += `Type : ${err.name}\n`;
			str += `Message : ${err.message}`;
			await client[botNum].reply(from, str);
			console.log(err);
		}
	},
};

function regex(input) {
	return /(?:https:?\/{2})?(?:w{3}|vm|vt|t)?\.?tiktok.com\/([^\s&]+)/gi.test(input);
}
