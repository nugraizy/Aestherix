import path from "path";
import moment from "moment-timezone";
import { __dirname } from "../../connect.js";
import { yta } from "../../Utils/YouTube/index.js";
import { toOpus } from "../../Utils/Converter/index.js";
import { INFOLOG, ERRLOG, color, numberWithCommas, removeDuplicatesArray, isURL } from "../../Helper/Modules/index.js";

export default {
	name: "ytaudio",
	description: "Downloads a YouTube audio",
	usage: "!ytaudio <url>",
	aliases: ["yta"],
	category: "Downloader",
	cooldown: 6,
	limit: 8,
	async run({ from, query, prettyNumber, filename, message }, client) {
		const time = moment().format("HH:mm:ss DD/MM");
		if (!query) return client[botNum].reply({ from, quoted: message }, "Please provide a URL");
		try {
			let queries = query.split(",");
			queries = removeDuplicatesArray(queries);
			if (queries.length == 1 && isURL(queries) && !regex(queries)) return client[botNum].reply({ from, quoted: message }, "This isn't a valid YouTube URL.");
			for (const Query of queries) {
				if (isURL(Query) && !regex(Query)) return client[botNum].reply({ from, quoted: message }, `[ ${Query} ] This isn't a valid YouTube URL.`);
				const audio = await yta(Query);
				INFOLOG(`[${color(time, "cyan")}]`, `${color(`Downloading YouTube Audio`, "#01cdfe")} for ${color(prettyNumber, "#ff71ce")}`);
				if ("error" in audio) {
					client[botNum].reply({ from, quoted: message }, audio.error);
					ERRLOG(`[${color(time, "cyan")}]`, `${color("Failed to Download YouTube Audio", "red")} for ${color(prettyNumber, "#ff71ce")}`);
				} else {
					const { title, description, timestamp, uploaded, views, author, urlChannel, dl_link, filesize, filesizeF } = audio;
					let capt = "``` • YouTube Audio```\n\n";
					capt += `Title : ${title}\n`;
					capt += `Uploaded : ${uploaded}\n`;
					capt += `Views : ${numberWithCommas(views)}\n`;
					capt += `Author : ${author}\n`;
					capt += `Channel : ${urlChannel}\n`;
					capt += `File Size : ${filesize} (${filesizeF})\n`;
					capt += `Duration : ${timestamp}\n`;
					capt += `Description : ${description}\n`;
					await client[botNum].reply({ from, quoted: message }, capt.trim());
					await client[botNum].sendMessage(from, { audio: await toOpus("opus", { input: path.join(__dirname, `Temporary Files/${filename}`), output: path.join(__dirname, `Temporary Files/${filename}-done`), media: dl_link.replace("https", "http") }), caption: capt.trim() });
				}
			}
			INFOLOG(`[${color(time, "cyan")}]`, `${color(`Downloaded YouTube Audio`, "#01cdfe")} for ${color(prettyNumber, "#ff71ce")}`);
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
