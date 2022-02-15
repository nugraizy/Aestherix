import { delay } from "@adiwajshing/baileys";
import { ytv } from "../../Utils/YouTube/y2mate.js";
import moment from "moment-timezone";

export default {
	name: "ytvideo",
	description: "Downloads a YouTube video",
	usage: "!ytvideo <url>",
	aliases: ["ytv"],
	category: "Downloader",
	async run(message, client) {
		const time = moment().format("HH:mm:ss DD/MM");
		if (!message.query) return client[botNum].reply(message.from, "Please provide a URL");
		try {
			let urls = message.query.split(",");
			const { isOne, isURL, INFOLOG, ERRLOG, color, numberWithCommas, removeDuplicatesArray } = await import("../../Helper/Modules/functions.js");
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
				const video = await ytv(url);
				INFOLOG(`[${color(time, "cyan")}]`, `${color(`Downloading YouTube Video`, "#01cdfe")} for ${color(message.prettyNumber, "#ff71ce")}`);
				if ("error" in video) {
					client[botNum].reply(message.from, `Error while downloading YouTube Video\n\b${video.error}\n${url}`);
					ERRLOG(`[${color(time, "cyan")}]`, `${color("Failed to Download YouTube Video", "red")} for ${color(message.prettyNumber, "#ff71ce")}`);
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
					await client[botNum].sendMessage(message.from, { video: { url: dl_link.replace("https", "http") }, caption: capt.trim() });
					await delay(300);
				}
			}
			INFOLOG(`[${color(time, "cyan")}]`, `${color(`Downloaded YouTube Video`, "#01cdfe")} for ${color(message.prettyNumber, "#ff71ce")}`);
		} catch (e) {
			let str = "Something went wrong. Please send this error stack to the owner. :\n\n";
			str += `Type : ${err.name}\n`;
			str += `Message : ${err.message}`;
			await client[botNum].reply(message.from, str);
			console.log(err);
		}
	},
};

function regex(input) {
	return /(?:http(?:s|):\/\/|)(?:(?:www\.|)youtube(?:\-nocookie|)\.com\/(?:shorts\/)?(?:watch\?.*(?:|\&)v=|embed\/|v\/)|youtu\.be\/)?\/.+/.test(input);
}
