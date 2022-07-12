import { delay } from "@adiwajshing/baileys";
import { tiktokDownloader, tiktokAPI } from "../../Utils/TikTok/index.js";
import moment from "moment-timezone";
import { isOne, isURL, INFOLOG, ERRLOG, color, removeDuplicatesArray } from "../../Helper/Modules/index.js";

export default {
	name: "tiktokvideo",
	description: "Downloads TikTok video.",
	usage: "!tiktokvideo <url> [version] [options]\nVersion:\n-v2\nOptions:\n-wm, --watermark: Download with watermark\n-nowm, --nowatermark: Download without watermark",
	aliases: ["tiktokvideo", "ttvideo"],
	category: "Downloader",
	cooldown: 6,
	limit: 6,
	async run({ from, query, args, prettyNumber, message }, client) {
		const time = moment().format("HH:mm:ss DD/MM");
		if (!query) return client[botNum].reply({ from, quoted: message }, "Please provide a URL");
		try {
			let urls = query.split(",")
			let options = "";
			if (urls.some((v) => /-?-(wm|watermark|nowm|nowatermark)/.test(v))) {
				options = urls.find((v) => /-?-(wm|watermark|nowm|nowatermark)/.test(v)).match(/-?-(wm|watermark|nowm|nowatermark)/gi)[0];
				urls = urls.map((v) => v.replace(/(-?-(wm|watermark|nowm|nowatermark))/g, ""));
			}
			if (isOne(urls.length) && !isURL(query)) return client[botNum].reply({ from, quoted: message }, "Please specify a valid url");
			if (isOne(urls.length) && !regex(query)) return client[botNum].reply({ from, quoted: message }, "Please specify a valid TikTok url");
			urls = removeDuplicatesArray(urls.map((v) => v.trim()));
			for (const url of urls) {
				if (!isURL(url)) {
					await client[botNum].reply({ from, quoted: message }, "Please specify a valid url");
					continue;
				} else if (!regex(url)) {
					await client[botNum].reply({ from, quoted: message }, "Please specify a valid TikTok url");
					continue;
				}
				if (/(v2)/.test(args[2])) {
					const videos = await tiktokAPI(url.split(" ")[0]);
					console.log(videos)
					INFOLOG(`[${color(time, "cyan")}]`, `${color(`Downloading TikTok Video`, "#01cdfe")} for ${color(prettyNumber, "#ff71ce")}`);
					if ("error" in videos) {
						ERRLOG(`[${color(time, "cyan")}]`, `${color(`Error while downloading TikTok Video`, "#ff0000")} for ${color(prettyNumber, "#ff71ce")}`);
						client[botNum].reply({ from, quoted: message }, `Error while downloading TikTok Video\n\n${url.split(" ")[0]}`);
						continue;
					}
					let capt = "``` • TikTok Video```\n\n";
					var date = new Date(videos.published * 1000)
					date = `${date.getHours()}:${date.getMinutes()} ${date.getDate()}/${date.getMonth()+1}/${date.getFullYear}`
					if (/(nowm|nowatermark)/.test(options)) {
						capt += `Author : ${videos.author}\n`;
						capt += `Username : ${videos.nickname}\n`;
						capt += `Verified : ${videos.verified}\n`;
						capt += `Liked : ${videos.likes}\n`;
						capt += `Shared : ${videos.shared}\n`;
						capt += `Comment : ${videos.comment}\n`;
						capt += `View : ${videos.view}\n`;
						capt += `Duration : ${videos.videoDuration}\n`;
						capt += `Description : ${videos.videoDescription}\n`;
						await client[botNum].sendMessage(from, { video: { url: videos.with_no_watermark }, caption: capt.trim() }, { quoted: message });
					} else if (/(wm|watermark)/.test(options)) {
						capt += `Author : ${videos.author}\n`;
						capt += `Username : ${videos.nickname}\n`;
						capt += `Verified : ${videos.verified}\n`;
						capt += `Liked : ${videos.likes}\n`;
						capt += `Shared : ${videos.shared}\n`;
						capt += `Comment : ${videos.comment}\n`;
						capt += `View : ${videos.view}\n`;
						capt += `Duration : ${videos.videoDuration}\n`;
						capt += `Description : ${videos.videoDescription}\n`;
						await client[botNum].sendMessage(from, { video: { url: videos.with_watermark }, caption: capt.trim() }, { quoted: message });
					} else {
						capt += `Author : ${videos.author}\n`;
						capt += `Username : ${videos.nickname}\n`;
						capt += `Verified : ${videos.verified}\n`;
						capt += `Liked : ${videos.likes}\n`;
						capt += `Shared : ${videos.shared}\n`;
						capt += `Comment : ${videos.comment}\n`;
						capt += `View : ${videos.view}\n`;
						capt += `Duration : ${videos.videoDuration}\n`;
						capt += `Description : ${videos.videoDescription}\n`;
						await client[botNum].sendMessage(from, { video: { url: videos.with_watermark }, caption: capt.trim() }, { quoted: message });
					}
					await delay(300);
				} else {
					const videos = await tiktokDownloader(url);
					INFOLOG(`[${color(time, "cyan")}]`, `${color(`Downloading TikTok Video`, "#01cdfe")} for ${color(prettyNumber, "#ff71ce")}`);
					if ("error" in videos) {
						ERRLOG(`[${color(time, "cyan")}]`, `${color(`Error while downloading TikTok Video`, "#ff0000")} for ${color(prettyNumber, "#ff71ce")}`);
						client[botNum].reply({ from, quoted: message }, `Error while downloading TikTok Video\n\n${url}`);
						continue;
					}
					let capt = "``` • TikTok Video```\n\n";
					if (/(nowm|nowatermark)/.test(options)) {
						capt += `Author : ${videos.unique_id}\n`;
						capt += `Username : ${videos.nickname}\n`;
						capt += `Description : ${videos.description}\n`;
						await client[botNum].sendMessage(from, { video: { url: videos.no_watermark_raw }, caption: capt.trim() }, { quoted: message });
					} else if (/(wm|watermark)/.test(options)) {
						capt += `Author : ${videos.unique_id}\n`;
						capt += `Username : ${videos.nickname}\n`;
						capt += `Description : ${videos.description}\n`;
						await client[botNum].sendMessage(from, { video: { url: videos.with_watermark }, caption: capt.trim() }, { quoted: message });
					} else {
						capt += `Author : ${videos.unique_id}\n`;
						capt += `Username : ${videos.nickname}\n`;
						capt += `Description : ${videos.description}\n`;
						await client[botNum].sendMessage(from, { video: { url: videos.with_watermark }, caption: capt.trim() }, { quoted: message });
					}
					await delay(300);
				}
				INFOLOG(`[${color(time, "cyan")}]`, `${color(`Downloaded TikTok Video`, "#01cdfe")} for ${color(prettyNumber, "#ff71ce")}`);
			}
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
	input = input.replace(" v2", "")
	return /(?:https:?\/{2})?(?:w{3}|vm|vt|t)?\.?tiktok.com\/([^\s&]+)/gi.test(input);
}
