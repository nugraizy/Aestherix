import moment from "moment-timezone";
import path from "path";
import { __dirname } from "../../connect.js";
import { color, ERRLOG, INFOLOG, isURL, removeDuplicatesArray } from "../../Helper/Modules/index.js";
import { toOpus } from "../../Utils/Converter/index.js";
import { yta, ytsr } from "../../Utils/YouTube/index.js";

export default {
	name: "spotifydl",
	description: "Downloads a Spotify audio",
	usage: "!spotifydl <url>",
	aliases: ["sfydl"],
	category: "Downloader",
	cooldown: 9,
	limit: 8,
	status: "enable",
	async run({ from, query, prettyNumber, filename, message }, client) {
		const time = moment().format("HH:mm:ss DD/MM");
		if (!query) return client[botNum].reply({ from, quoted: message }, "Please provide a URL");
		try {
			let queries = query.split(",");
			queries = removeDuplicatesArray(queries);
			if (queries.length == 1 && isURL(queries) && !regex(queries)) return client[botNum].reply({ from, quoted: message }, "This isn't a valid Spotify URL.");
			for (const Query of queries) {
				if (isURL(Query) && !regex(Query)) return client[botNum].reply({ from, quoted: message }, `[ ${Query} ] This isn't a valid Spotify URL.`);
				const searchTerm = await ytsr(Query);
				const audio = await yta(searchTerm[0].url);
				INFOLOG(`[${color(time, "cyan")}]`, `${color(`Downloading Spotify Audio`, "#01cdfe")} for ${color(prettyNumber, "#ff71ce")}`);
				if ("error" in audio) {
					client[botNum].reply({ from, quoted: message }, audio.error);
					ERRLOG(`[${color(time, "cyan")}]`, `${color("Failed to Download Spotify Audio", "red")} for ${color(prettyNumber, "#ff71ce")}`);
				} else {
					const { title, timestamp, dl_link } = audio;
					let capt = "``` • Spotify Audio```\n\n";
					capt += `Title : ${title}\n`;
					capt += `Duration : ${timestamp ?? "No Data"}\n`;
					await client[botNum].reply({ from, quoted: message }, capt.trim());
					await client[botNum].sendMessage(from, {
						audio: await toOpus("opus", {
							input: path.join(__dirname, `Temporary Files/${filename}`),
							output: path.join(__dirname, `Temporary Files/${filename}-done`),
							media: dl_link.replace("https", "http"),
						}),
						caption: capt.trim(),
					});
				}
			}
			INFOLOG(`[${color(time, "cyan")}]`, `${color(`Downloaded Spotify Audio`, "#01cdfe")} for ${color(prettyNumber, "#ff71ce")}`);
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
	return /(https?:\/\/open.spotify.com\/(track|user|artist|album)\/[a-zA-Z0-9]+(\/playlist\/[a-zA-Z0-9]+|)|spotify:(track|user|artist|album):[a-zA-Z0-9]+(:playlist:[a-zA-Z0-9]+|))/.test(
		input,
	);
}
