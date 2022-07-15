import { delay } from "@adiwajshing/baileys";
import moment from "moment-timezone";
import parser from "yargs-parser";
import { ytv } from "../../Utils/YouTube/index.js";
import { INFOLOG, ERRLOG, color, numberWithCommas, removeDuplicatesArray } from "../../Helper/Modules/index.js";

export default {
	name: "ytvideo",
	description: "Downloads a YouTube video",
	usage: "!ytvideo <url>",
	aliases: ["ytv"],
	category: "Downloader",
	cooldown: 6,
	limit: 8,
	async run({ from, query, prettyNumber, message }, client) {
		const time = moment().format("HH:mm:ss DD/MM");
		if (!query) return client[botNum].reply({ from, quoted: message }, "Please provide a URL");
		try {
			let { _: queries } = parser(query);
			for (const Query of removeDuplicatesArray(queries.map((q) => q.trim()))) {
				const video = await ytv(Query);
				INFOLOG(`[${color(time, "cyan")}]`, `${color(`Downloading YouTube Video`, "#01cdfe")} for ${color(prettyNumber, "#ff71ce")}`);
				if ("error" in video) {
					client[botNum].reply({ from, quoted: message }, `Error while downloading YouTube Video\n\b${video.error}\n${Query}`);
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
	return /(?:http(?:s|):\/\/|)(?:(?:www\.|)youtube(?:\-nocookie|)\.com\/(?:shorts\/)?(?:watch\?.*(?:|\&)v=|embed\/|v\/)|youtu\.be\/)?\/.+/.test(input);
}
