import { delay } from "@adiwajshing/baileys";
import moment from "moment-timezone";
import { getStory } from "../../Utils/Instagram/index.js";
import { isOne, isURL, isEmpty, isSame, numberWithCommas, INFOLOG, ERRLOG, color } from "../../Helper/Modules/index.js";

export default {
	name: "igstory",
	description: "Downloads the story of the user",
	usage: "!igstory <username>",
	aliases: ["igstory", "igs"],
	category: "Downloader",
	cooldown: 6,
	limit: 3,
	async run({ from, query, prettyNumber, message }, client) {
		const time = moment().format("HH:mm:ss DD/MM");
		if (!query) return client[botNum].reply(from, "Please specify a username");
		try {
			const usernames = query.split(",");
			if (isOne(usernames) && isURL(usernames)) return client[botNum].reply(from, "Please specify a valid username");
			for (const username of usernames) {
				if (isURL(username)) await client[botNum].reply(from, "Please specify a username");
				else {
					const story = await getStory(username);
					INFOLOG(`[${color(time, "cyan")}]`, `${color(`Downloading Instagram Story`, "cyan")} for ${color(prettyNumber, "#ff71ce")}`);
					if ("error" in story) {
						client[botNum].reply(from, `Error while downloading Instagram story\n\n${story.error}\n${username}`);
						ERRLOG(`[${color(time, "cyan")}]`, `${color("Failed to Download Instagram Story", "cyan")} for ${color(prettyNumber, "#ff71ce")}`);
						continue;
					} else {
						let capt = "``` • Instagram Story```\n\n";
						capt += `Username  : ${story.user.username}\n`;
						capt += `Fullname  : ${story.user.fullName}\n`;
						capt += `Follower  : ${numberWithCommas(story.user.followers)}\n`;
						capt += `Following : ${numberWithCommas(story.user.following)}\n`;
						capt += isEmpty(story.user.biography) ? "" : `Biography : ${story.user.biography}\n`;
						if (isOne(story.medias.length)) await client[botNum].sendMessage(from, isSame(story.medias[0].type, "video") ? { video: { url: story.medias[0].url }, caption: capt.trim() } : { image: { url: story.medias[0].url }, caption: capt.trim() }, { quoted: message });
						else {
							capt += `Tot. Media : ${story.medias.length}`;
							await client[botNum].sendMessage(from, { text: capt.trim() }, { quoted: message });
							for (let j = 0; j < story.medias.length; j++) {
								await client[botNum].sendMessage(from, isSame(story.medias[j].type, "video") ? { video: { url: story.medias[j].url } } : { image: { url: story.medias[j].url } });
								await delay(300);
							}
						}
						INFOLOG(`[${color(time, "cyan")}]`, `${color("Downloaded Instagram Story", "cyan")} for ${color(prettyNumber, "#ff71ce")}`);
					}
				}
			}
		} catch (err) {
			let str = "Something went wrong. Please send this error stack to the owner. :\n\n";
			str += `Type : ${err.name}\n`;
			str += `Message : ${err.message}`;
			await client[botNum].reply(from, str);
			console.log(err);
		}
	},
};
