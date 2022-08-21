import { delay } from "@adiwajshing/baileys";
import moment from "moment-timezone";
import path from "path";
import parser from "yargs-parser";
import { __dirname } from "../../connect.js";
import { color, ERRLOG, INFOLOG, isOne, isURL, removeDuplicatesArray } from "../../Helper/Modules/index.js";
import { toOpus } from "../../Utils/Converter/index.js";
import { mime } from "../../Utils/Misc/index.js";
import { tiktokAPI } from "../../Utils/TikTok/index.js";

export default {
	name: "tiktokmusic",
	description: "Downloads TikTok music that used in the video.",
	usage:
		"!tiktokmusic <url> (you can send multiple link using space in between) [options]\nOptions:\n-wm, --watermark: Download with watermark\n-nowm, --nowatermark: Download without watermark",
	aliases: ["tiktokmusics", "tiktokmusik", "ttmusic", "ttmusik", "ttm"],
	category: "Downloader",
	cooldown: 7,
	limit: 6,
	status: "enable",
	async run({ from, query, prettyNumber, message, filename }, client) {
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
				const music = await tiktokAPI(url);
				INFOLOG(`[${color(time, "cyan")}]`, `${color(`Downloading TikTok Music`, "#01cdfe")} for ${color(prettyNumber, "#ff71ce")}`);
				if ("error" in music) {
					ERRLOG(`[${color(time, "cyan")}]`, `${color(`Error while downloading TikTok Music`, "#ff0000")} for ${color(prettyNumber, "#ff71ce")}`);
					client[botNum].reply({ from, quoted: message }, `Error while downloading TikTok Music\n\n${url.split(" ")[0]}`);
					continue;
				}
				if (music.type == "images") {
					await client[botNum].sendMessage(
						from,
						{
							document: await toOpus("opus", {
								input: path.join(__dirname, `Temporary Files/${filename}`),
								output: path.join(__dirname, `Temporary Files/${filename}-done`),
								media: music.music.music.replace("https", "http"),
							}),
							fileName: `${music.music.authorMusic} - ${music.music.musicTitle}.mp3`,
							mimetype: mime("mp3"),
						},
						{ quoted: message },
					);
				} else
					await client[botNum].sendMessage(
						from,
						{
							document: await toOpus("opus", {
								input: path.join(__dirname, `Temporary Files/${filename}`),
								output: path.join(__dirname, `Temporary Files/${filename}-done`),
								media: music.url.music.replace("https", "http"),
							}),
							fileName: `${music.authorMusic} - ${music.musicTitle}.mp3`,
							mimetype: mime("mp3"),
						},
						{ quoted: message },
					);
				await delay(300);
				INFOLOG(`[${color(time, "cyan")}]`, `${color(`Downloaded TikTok Music`, "#01cdfe")} for ${color(prettyNumber, "#ff71ce")}`);
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
