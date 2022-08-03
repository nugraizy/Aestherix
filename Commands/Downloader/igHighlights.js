import moment from "moment-timezone";
import { delay } from "@adiwajshing/baileys";
import parser from "yargs-parser";
import { getHighlights2 } from "../../Utils/Instagram/index.js";
import { isOne, isURL, isEmpty, isSame, numberWithCommas, INFOLOG, ERRLOG, color } from "../../Helper/Modules/index.js";

export default {
	name: "ighighlights",
	description: "Downloads the highlights of the user",
	usage: "!ighighlights <username>",
	aliases: ["igh", "ighl"],
	category: "Downloader",
	cooldown: 6,
	limit: 9,
	status: "enable",
	async run({ from, query, prettyNumber, message }, client) {
		const time = moment().format("HH:mm:ss DD/MM");
		if (!query) return client[botNum].reply({ from, quoted: message }, "Please specify a username");
		try {
			const { _: usernames } = parser(query);
			if (isOne(usernames.length) && isURL(usernames[0])) return client[botNum].reply({ from, quoted: message }, "Please specify a valid username");
			for (const username of usernames) {
				if (isURL(username)) await client[botNum].reply({ from, quoted: message }, "Please specify a username");
				else {
					const highlights = await getHighlights2(username);
					INFOLOG(`[${color(time, "cyan")}]`, `${color(`Downloading Instagram highlights`, "cyan")} for ${color(prettyNumber, "#ff71ce")}`);
					if ("error" in highlights) {
						client[botNum].reply({ from, quoted: message }, `Error while downloading Instagram highlights\n\n${highlights.error}\n${username}`);
						ERRLOG(`[${color(time, "cyan")}]`, `${color("Failed to Download Instagram highlights", "cyan")} for ${color(prettyNumber, "#ff71ce")}`);
						continue;
					} else {
						let capt = "``` • Instagram highlights```\n\n";
						capt += `Username  : ${highlights.user.username}\n`;
						capt += `Fullname  : ${highlights.user.fullName}\n`;
						capt += `Follower  : ${numberWithCommas(highlights.user.followers)}\n`;
						capt += `Following : ${numberWithCommas(highlights.user.following)}\n`;
						capt += isEmpty(highlights.user.biography) ? "" : `Biography : ${highlights.user.biography}\n`;
						if (isOne(highlights.medias.length)) await client[botNum].sendMessage(from, isSame(highlights.medias[0].type, "video") ? { video: { url: highlights.medias[0].url }, caption: capt.trim() } : { image: { url: highlights.medias[0].url }, caption: capt.trim() }, { quoted: message });
						else {
							capt += `Tot. Media : ${highlights.medias.length}`;
							await client[botNum].sendMessage(from, { text: capt.trim() }, { quoted: message });
							for (let j = 0; j < highlights.medias.length; j++) {
								await client[botNum].sendMessage(from, isSame(highlights.medias[j].type, "video") ? { video: { url: highlights.medias[j].url } } : { image: { url: highlights.medias[j].url } });
								await delay(300);
							}
						}
						INFOLOG(`[${color(time, "cyan")}]`, `${color("Downloaded Instagram highlights", "cyan")} for ${color(prettyNumber, "#ff71ce")}`);
					}
				}
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
