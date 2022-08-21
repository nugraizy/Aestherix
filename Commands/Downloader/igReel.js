import { delay } from "../../Helper/index.js";
import moment from "moment-timezone";
import parser from "yargs-parser";
import { color, ERRLOG, INFOLOG, isOne, isURL, parseCode } from "../../Helper/Modules/index.js";
import { getPost } from "../../Utils/Instagram/index.js";

export default {
	name: "igreel",
	description: "Downloads the reel of the user",
	usage: "!igreel <url>",
	aliases: ["igreel", "igr"],
	category: "Downloader",
	cooldown: 10,
	limit: 9,
	status: "enable",
	async run({ from, query, prettyNumber, message }, client) {
		const time = moment().format("HH:mm:ss DD/MM");
		if (!query) return client[botNum].reply({ from, quoted: message }, "Please specify a url");
		try {
			const { _: urls } = parser(query);
			if (isOne(urls.length) && !isURL(urls[0])) return client[botNum].reply({ from, quoted: message }, "Please specify a valid url");
			if (isOne(urls.length) && !regex(urls[0])) return client[botNum].reply({ from, quoted: message }, "Please specify a valid Instagram url");
			for (const url of urls) {
				if (!isURL(url.trim())) {
					await client[botNum].reply({ from, quoted: message }, "Please specify a valid url");
					continue;
				} else if (!regex(url.trim())) {
					await client[botNum].reply({ from, quoted: message }, "Please specify a valid Instagram url");
					continue;
				}
				const parse = parseCode(url.trim());
				INFOLOG(`[${color(time, "cyan")}]`, `${color(`Downloading Instagram reel`, "#01cdfe")} for ${color(prettyNumber, "#ff71ce")}`);
				if (parse) {
					const reel = await getPost(url);
					if ("error" in reel) {
						client[botNum].reply({ from, quoted: message }, `Error while downloading Instagram reel\n\n${reel.error}\n${url}`);
						ERRLOG(`[${color(time, "cyan")}]`, `${color("Failed to Download Instagram reel", "red")} for ${color(prettyNumber, "#ff71ce")}`);
						continue;
					}
					let capt = "``` • Instagram reel```\n\n";
					capt += `Username : ${reel.user.username}\n`;
					capt += `Fullname : ${reel.user.fullName}\n`;
					if (isOne(reel.medias.length)) {
						await client[botNum].sendMessage(
							from,
							reel.medias[0].type == "video"
								? { video: { url: reel.medias[0].url }, caption: capt.trim() }
								: {
										image: { url: reel.medias[0].url },
										caption: capt.trim(),
								  },
							{ quoted: message },
						);
					}
					INFOLOG(`[${color(time, "cyan")}]`, `${color("Downloaded Instagram reel", "#01cdfe")} for ${color(prettyNumber, "#ff71ce")}`);
					await delay(100);
				}
			}
		} catch (error) {
			let str = "Something went wrong. Please send this error stack to the owner. :\n\n";
			str += `Type : ${error.name}\n`;
			str += `Message : ${error.message}`;
			await client[botNum].reply({ from, quoted: message }, str);
			log(error);
		}
	},
};

function regex(input) {
	return /(https?:\/\/(?:www\.)?instagram\.com\/(p|reel|tv|s)\/([^\/?#&]+)).*/.test(input);
}
