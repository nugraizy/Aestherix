import { delay } from "@adiwajshing/baileys";
import { ytv } from "../../Utils/YouTube/index.js";
import moment from "moment-timezone";
import { isOne, isURL, INFOLOG, ERRLOG, color, numberWithCommas, removeDuplicatesArray } from "../../Helper/Modules/index.js";

export default {
	name: "ytvideo",
	description: "Downloads a YouTube video",
	usage: "!ytvideo <url>",
	aliases: ["ytv"],
	category: "Downloader",
	cooldown: 6,
	limit: 8,
	async run({ from, query, prettyNumber }, client) {
		const time = moment().format("HH:mm:ss DD/MM");
		if (!query) return client[botNum].reply(from, "Please provide a URL");
		try {
			let urls = query.split(",");
			if (isOne(urls.length) && !isURL(query)) return client[botNum].reply(from, "Please specify a valid url");
			if (isOne(urls.length) && !regex(query)) return client[botNum].reply(from, "Please specify a valid YouTube url");
			urls = removeDuplicatesArray(urls.map((url) => url.trim()));
			for (const url of urls) {
				if (!isURL(url)) {
					await client[botNum].reply(from, "Please specify a valid url");
					continue;
				} else if (!regex(url)) {
					await client[botNum].reply(from, "Please specify a valid YouTube url");
					continue;
				}
				const video = await ytv(url);
				INFOLOG(`[${color(time, "cyan")}]`, `${color(`Downloading YouTube Video`, "#01cdfe")} for ${color(prettyNumber, "#ff71ce")}`);
				if ("error" in video) {
					client[botNum].reply(from, `Error while downloading YouTube Video\n\b${video.error}\n${url}`);
					ERRLOG(`[${color(time, "cyan")}]`, `${color("Failed to Download YouTube Video", "red")} for ${color(prettyNumber, "#ff71ce")}`);
					continue;
				} else {
					const { title, description, timestamp, uploaded, views, author, urlChannel, dl_link, filesize, filesizeF } = video;
					let capt = "``` • YouTube Video```\n\n";
					capt += `Title : ${title}\n`;
					capt += `Uploaded : ${uploaded}\n`;
					capt += `Views : ${numberWithCommas(views)}\n`;
					capt += `Author : ${author}\n`;
					capt += `Channel : ${urlChannel}\n`;
					capt += `File Size : ${filesize} (${filesizeF})\n`;
					capt += `Duration : ${timestamp}\n`;
					capt += `Description : ${description}\n`;
					await client[botNum].sendMessage(from, { video: { url: dl_link.replace("https", "http") }, caption: capt.trim() });
					await delay(300);
				}
			}
			INFOLOG(`[${color(time, "cyan")}]`, `${color(`Downloaded YouTube Video`, "#01cdfe")} for ${color(prettyNumber, "#ff71ce")}`);
		} catch (e) {
			let str = "Something went wrong. Please send this error stack to the owner. :\n\n";
			str += `Type : ${err.name}\n`;
			str += `Message : ${err.message}`;
			await client[botNum].reply(from, str);
			console.log(err);
		}
	},
};

function regex(input) {
	return /(?:http(?:s|):\/\/|)(?:(?:www\.|)youtube(?:\-nocookie|)\.com\/(?:shorts\/)?(?:watch\?.*(?:|\&)v=|embed\/|v\/)|youtu\.be\/)?\/.+/.test(input);
}
