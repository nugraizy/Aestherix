import { delay } from "@adiwajshing/baileys";
import path from "path";
import moment from "moment-timezone";
import parser from "yargs-parser";
import { __dirname } from "../../connect.js";
import { tiktokDownloader } from "../../Utils/TikTok/index.js";
import { mime } from "../../Utils/Misc/index.js";
import { toOpus } from "../../Utils/Converter/index.js";
import { isOne, isURL, INFOLOG, ERRLOG, color, removeDuplicatesArray } from "../../Helper/Modules/index.js";

export default {
	name: "tiktokaudio",
	description: "Downloads TikTok audio.",
	usage: "!tiktokaudio <url> (you can send multiple link using space in between)",
	aliases: ["tiktokaudio", "ttaudio", "ttaud"],
	category: "Downloader",
	cooldown: 6,
	limit: 6,
	status: "enable",
	async run({ from, query, prettyNumber, filename, message }, client) {
		const time = moment().format("HH:mm:ss DD/MM");
		if (!query) return client[botNum].reply({ from, quoted: message }, "Please provide a URL");
		try {
			let { _: urls } = parser(query);
			if (isOne(urls.length) && !isURL(urls[0])) return client[botNum].reply({ from, quoted: message }, "Please specify a valid url");
			if (isOne(urls.length) && !regex(urls[0])) return client[botNum].reply({ from, quoted: message }, "Please specify a valid TikTok url");
			for (const url of removeDuplicatesArray(urls.map((v) => v.trim()))) {
				if (!isURL(url)) {
					await client[botNum].reply({ from, quoted: message }, "Please specify a valid url");
					continue;
				} else if (!regex(url)) {
					await client[botNum].reply({ from, quoted: message }, "Please specify a valid TikTok url");
					continue;
				}
				const audio = await tiktokDownloader(url);
				INFOLOG(`[${color(time, "cyan")}]`, `${color(`Downloading TikTok Audio`, "#01cdfe")} for ${color(prettyNumber, "#ff71ce")}`);
				if ("error" in audio) {
					client[botNum].reply({ from, quoted: message }, audio.error);
					ERRLOG(`[${color(time, "cyan")}]`, `${color("Failed to Download TikTok Audio", "red")} for ${color(prettyNumber, "#ff71ce")}`);
					continue;
				}
				await client[botNum].sendMessage(
					from,
					{ document: await toOpus("opus", { input: path.join(__dirname, `Temporary Files/${filename}`), output: path.join(__dirname, `Temporary Files/${filename}-done`), media: audio.music }), fileName: `${audio.description}.mp3`, mimetype: mime("mp3") },
					{ quotes: message },
				);
				await delay(300);
			}
			INFOLOG(`[${color(time, "cyan")}]`, `${color(`Downloaded TikTok Audio`, "#01cdfe")} for ${color(prettyNumber, "#ff71ce")}`);
		} catch (err) {
			let str = "Something went wrong. Please send this error stack to the owner. :\n\n";
			str += `Type : ${err.name}\n`;
			str += `Message : ${err.message}`;
			await client[botNum].reply({ from, quoted: message }, str);
			log(err);
		}
	},
};

function regex(input) {
	return /(?:https:?\/{2})?(?:w{3}|vm|vt|t)?\.?tiktok.com\/([^\s&]+)/gi.test(input);
}
