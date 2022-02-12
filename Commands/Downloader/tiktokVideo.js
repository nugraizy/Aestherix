import { delay } from "@adiwajshing/baileys";
import path from "path";
import { __dirname } from "../../index.js";
import { tiktokDownloader } from "../../Utils/TikTok/tiktokDownloader.js";
import moment from "moment-timezone";

export default {
	name: "tiktokvideo",
	description: "Downloads TikTok video.",
	usage: "!tiktokvideo <url> [options]\nOptions:\n-wm, --watermark: Download with watermark\n-nowm, --nowatermark: Download without watermark",
	aliases: ["tiktokvideo", "ttvideo"],
	category: "Downloader",
	async run(message, client, args) {
		const time = moment().format("HH:mm:ss DD/MM");
		if (!message.query) return client[botNum].reply(message.from, "Please provide a URL");
		let urls = message.query.split(",");
		let options = "";
		const { isOne, isURL, INFOLOG, ERRLOG, color, removeDuplicatesArray } = await import("../../Helper/Modules/functions.js");
		if (urls.some((v) => /-?-(wm|watermark|nowm|nowatermark)/.test(v))) {
			options = urls.find((v) => /-?-(wm|watermark|nowm|nowatermark)/.test(v)).match(/-?-(wm|watermark|nowm|nowatermark)/gi)[0];
			urls = urls.map((v) => v.replace(/(-?-(wm|watermark|nowm|nowatermark))/g, ""));
		}
		if (isOne(urls.length) && !isURL(message.query)) return client[botNum].reply(message.from, "Please specify a valid url");
		if (isOne(urls.length) && !regex(message.query)) return client[botNum].reply(message.from, "Please specify a valid TikTok url");
		urls = removeDuplicatesArray(urls.map((v) => v.trim()));
		for (const url of urls) {
			if (!isURL(url)) {
				await client[botNum].reply(message.from, "Please specify a valid url");
				continue;
			} else if (!regex(url)) {
				await client[botNum].reply(message.from, "Please specify a valid TikTok url");
				continue;
			}
			const videos = await tiktokDownloader(url);
			INFOLOG(`[${color(time, "cyan")}]`, `${color(`Downloading TikTok Video`, "#01cdfe")} for ${color(message.prettyNumber, "#ff71ce")}`);
			if ("error" in videos) {
				ERRLOG(`[${color(time, "cyan")}]`, `${color(`Error while downloading TikTok Video`, "#ff0000")} for ${color(message.prettyNumber, "#ff71ce")}`);
				client[botNum].reply(message.from, `Error while downloading TikTok Video\n\n${url}`);
				continue;
			}
			let capt = "``` • TikTok Video```\n\n";
			if (/(nowm|nowatermark)/.test(options)) {
				capt += `Author : ${videos.unique_id}\n`;
				capt += `Username : ${videos.nickname}\n`;
				capt += `Description : ${videos.description}\n`;
				await client[botNum].sendMessage(message.from, { video: { url: videos.no_watermark_raw }, caption: capt.trim() }, { quoted: message.message });
			} else if (/(wm|watermark)/.test(options)) {
				capt += `Author : ${videos.unique_id}\n`;
				capt += `Username : ${videos.nickname}\n`;
				capt += `Description : ${videos.description}\n`;
				await client[botNum].sendMessage(message.from, { video: { url: videos.with_watermark }, caption: capt.trim() }, { quoted: message.message });
			} else {
				capt += `Author : ${videos.unique_id}\n`;
				capt += `Username : ${videos.nickname}\n`;
				capt += `Description : ${videos.description}\n`;
				await client[botNum].sendMessage(message.from, { video: { url: videos.with_watermark }, caption: capt.trim() }, { quoted: message.message });
			}
			await delay(300);
		}
	},
};

function regex(input) {
	return /(?:https:?\/{2})?(?:w{3}|vm|vt|t)?\.?tiktok.com\/([^\s&]+)/gi.test(input);
}
