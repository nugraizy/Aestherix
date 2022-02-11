import { getStory } from "../../Utils/Instagram/instaStory.js";
import { delay } from "@adiwajshing/baileys";
import moment from "moment-timezone";

export default {
	name: "igstory",
	description: "Downloads the story of the user",
	usage: "!igstory <username>",
	aliases: ["igstory", "igs"],
	category: "Social",
	async run(message, client, args) {
		const time = moment().format("HH:mm:ss DD/MM");
		if (!message.query) return client[botNum].reply(message.from, "Please specify a url");
		const usernames = message.query.split(",");
		const { isOne, isURL, isEmpty, isSame, numberWithCommas, INFOLOG, ERRLOG, color } = await import("../../Helper/Modules/functions.js");
		if (isOne(usernames) && isURL(usernames)) return client[botNum].reply(message.from, "Please specify a valid url");
		for (const username of usernames) {
			if (isURL(username)) await client[botNum].reply(message.from, "Please specify a username");
			else {
				const story = await getStory(username);
				INFOLOG(`[${color(time, "cyan")}]`, `${color(`Downloading Instagram Story`, "cyan")} for ${color(message.prettyNumber, "#ff71ce")}`);
				if ("error" in story) {
					client[botNum].reply(message.from, story.error);
					ERRLOG(`[${color(time, "cyan")}]`, `${color("Failed to Download Instagram Story", "cyan")} for ${color(message.prettyNumber, "#ff71ce")}`);
				} else {
					let capt = "``` • Instagram Story```\n\n";
					capt += `Username  : ${story.user.username}\n`;
					capt += `Fullname  : ${story.user.fullName}\n`;
					capt += `Follower  : ${numberWithCommas(story.user.followers)}\n`;
					capt += `Following : ${numberWithCommas(story.user.following)}\n`;
					capt += isEmpty(story.user.biography) ? "" : `Biography : ${story.user.biography}\n`;
					if (isOne(story.medias.length))
						await client[botNum].sendMessage(
							message.from,
							isSame(story.medias[0].type, "video")
								? {
										video: { url: story.medias[0].url },
										caption: capt.trim(),
								  }
								: {
										image: { url: story.medias[0].url },
										caption: capt.trim(),
								  },
							{ quoted: message.message },
						);
					else {
						capt += `Tot. Media : ${story.medias.length}`;
						await client[botNum].sendMessage(message.from, { text: capt.trim() }, { quoted: message.message });
						for (let j = 0; j < story.medias.length; j++) {
							await client[botNum].sendMessage(message.from, isSame(story.medias[j].type, "video") ? { video: { url: story.medias[j].url } } : { image: { url: story.medias[j].url } });
							await delay(300);
						}
					}
					INFOLOG(`[${color(time, "cyan")}]`, `${color("Downloaded Instagram Story", "cyan")} for ${color(message.prettyNumber, "#ff71ce")}`);
				}
			}
		}
	},
};
