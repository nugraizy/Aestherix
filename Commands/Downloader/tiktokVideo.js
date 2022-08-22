import { delay } from "../../Helper/index.js";
import moment from "moment-timezone";
import parser from "yargs-parser";
import { color, ERRLOG, INFOLOG, isOne, isURL, numberWithCommas, removeDuplicatesArray } from "../../Helper/Modules/index.js";
import { tiktokAPI } from "../../Utils/TikTok/index.js";

export default {
	name: "tiktokvideo",
	description: "Downloads TikTok video.",
	usage:
		"!tiktokvideo <url> (you can send multiple link using space in between) [options]\nOptions:\n-wm, --watermark: Download with watermark\n-nowm, --nowatermark: Download without watermark",
	aliases: ["tiktokvideos", "ttvideo", "ttvid", "ttv"],
	category: "Downloader",
	cooldown: 10,
	limit: 6,
	status: "enable",
	async run({ from, query, prettyNumber, message }, client) {
		const time = moment().format("HH:mm:ss DD/MM");
		if (!query) {
			return await client[botNum].reply({ from, quoted: message }, "Please provide a URL");
		}
		try {
			let { _: urls } = parser(query);
			let { no_wm: NO_WM, wm: WITH_WM } = parser(query.toLowerCase(), {
				configuration: {
					"short-option-groups": false,
				},
				alias: {
					no_wm: ["nowm", "no-wm", "no-watermark", "no_watermark", "nowatermark"],
					wm: ["with-watermark", "with_watermark", "watermark"],
				},
			});
			if (Array.isArray(NO_WM)) {
				NO_WM = removeDuplicatesArray(NO_WM)[0];
			}
			if (Array.isArray(WITH_WM)) {
				WITH_WM = removeDuplicatesArray(WITH_WM)[0];
			}
			if (isOne(urls.length) && !isURL(urls[0])) {
				return await client[botNum].reply({ from, quoted: message }, "Please specify a valid url");
			}
			if (isOne(urls.length) && !regex(urls[0])) {
				return await client[botNum].reply({ from, quoted: message }, "Please specify a valid TikTok url");
			}
			for (const url of removeDuplicatesArray(urls.map((v) => v.trim()))) {
				if (!isURL(url)) {
					await client[botNum].reply({ from, quoted: message }, "Please specify a valid url");
					continue;
				} else if (!regex(url)) {
					await client[botNum].reply({ from, quoted: message }, "Please specify a valid TikTok url");
					continue;
				}
				const videos = await tiktokAPI(url);
				INFOLOG(`[${color(time, "cyan")}]`, `${color(`Downloading TikTok Media`, "#01cdfe")} for ${color(prettyNumber, "#ff71ce")}`);
				if ("error" in videos) {
					ERRLOG(`[${color(time, "cyan")}]`, `${color(`Error while downloading TikTok Video`, "#ff0000")} for ${color(prettyNumber, "#ff71ce")}`);
					client[botNum].reply({ from, quoted: message }, `Error while downloading TikTok Video\n\n${url.split(" ")[0]}`);
					continue;
				}
				if (videos.type == "images") {
					let capt = "``` • TikTok Images```\n\n";
					capt += `Author : ${videos.author}\n`;
					capt += `Username : ${videos.nickname}\n`;
					capt += `Liked : ${numberWithCommas(videos.liked)}\n`;
					capt += `Shared : ${numberWithCommas(videos.shared)}\n`;
					capt += `Comment : ${numberWithCommas(videos.comment)}\n`;
					capt += `View : ${numberWithCommas(videos.view)}\n`;
					capt += `Description : ${videos.videoDescription}\n`;
					capt += `Tot. Image : ${videos.images.length}\n`;
					for (const { url, index } of videos.images) {
						await client[botNum].sendMessage(from, { image: { url }, caption: index == 1 ? capt.trim() : "" }, { quoted: message });
					}
				} else {
					let capt = "``` • TikTok Video```\n\n";
					capt += `Author : ${videos.author}\n`;
					capt += `Username : ${videos.nickname}\n`;
					const date = moment(moment(videos.published).unix()).format("HH:mm:ss DD/MM/YYYY");
					capt += `Verifies : ${videos.verified ? "Verified" : "Not Verified"}\n`;
					capt += `Liked : ${numberWithCommas(videos.liked)}\n`;
					capt += `Shared : ${numberWithCommas(videos.shared)}\n`;
					capt += `Comment : ${numberWithCommas(videos.comment)}\n`;
					capt += `Published : ${date}\n`;
					capt += `View : ${numberWithCommas(videos.view)}\n`;
					capt += `Duration : ${videos.videoDuration}\n`;
					capt += `Description : ${videos.videoDescription}\n`;
					if (NO_WM) {
						await client[botNum].sendMessage(from, { video: { url: videos.url.with_no_watermark }, caption: capt.trim() }, { quoted: message });
					}
					if (WITH_WM) {
						await client[botNum].sendMessage(from, { video: { url: videos.url.with_watermark }, caption: capt.trim() }, { quoted: message });
					}
					if (!NO_WM && !WITH_WM) {
						await client[botNum].sendMessage(from, { video: { url: videos.url.with_watermark }, caption: capt.trim() }, { quoted: message });
					}
				}
				await delay(100);
				INFOLOG(`[${color(time, "cyan")}]`, `${color(`Downloaded TikTok Media`, "#01cdfe")} for ${color(prettyNumber, "#ff71ce")}`);
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
	return /(?:https:?\/{2})?(?:w{3}|vm|vt|t)?\.?tiktok.com\/([^\s&]+)/gi.test(input);
}
