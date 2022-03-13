import { delay } from "@adiwajshing/baileys";
import moment from "moment-timezone";
import { getReels } from "../../Utils/Instagram/index.js";
import { isOne, isURL, numberWithCommas, INFOLOG, ERRLOG, color } from "../../Helper/Modules/index.js";

export default {
	name: "igreel",
	description: "Downloads the reel of the user",
	usage: "!igreel <url>",
	aliases: ["igreel", "igr"],
	category: "Downloader",
	cooldown: 6,
	limit: 9,
	async run({ from, query, prettyNumber, message }, client) {
		const time = moment().format("HH:mm:ss DD/MM");
		if (!query) return client[botNum].reply(from, "Please specify a url");
		try {
			const urls = query.split(",");
			if (isOne(urls.length) && !isURL(query)) return client[botNum].reply(from, "Please specify a valid url");
			if (isOne(urls.length) && !regex(query)) return client[botNum].reply(from, "Please specify a valid Instagram url");
			for (const url of urls) {
				if (!isURL(url.trim())) {
					await client[botNum].reply(from, "Please specify a valid url");
					continue;
				} else if (!regex(url.trim())) {
					await client[botNum].reply(from, "Please specify a valid Instagram url");
					continue;
				}
				INFOLOG(`[${color(time, "cyan")}]`, `${color(`Downloading Instagram reel`, "#01cdfe")} for ${color(prettyNumber, "#ff71ce")}`);
				const reel = await getReels(url);
				if ("error" in reel) {
					client[botNum].reply(from, `Error while downloading Instagram reel\n\n${reel.error}\n${url}`);
					ERRLOG(`[${color(time, "cyan")}]`, `${color("Failed to Download Instagram reel", "red")} for ${color(prettyNumber, "#ff71ce")}`);
					continue;
				} else {
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
				}
			}
		} catch (error) {
			let str = "Something went wrong. Please send this error stack to the owner. :\n\n";
			str += `Type : ${error.name}\n`;
			str += `Message : ${error.message}`;
			await client[botNum].reply(from, str);
			log(error);
		}
	},
};

function regex(input) {
	return /(https?:\/\/(?:www\.)?instagram\.com\/(p|reel|tv|s)\/([^\/?#&]+)).*/.test(input);
}
