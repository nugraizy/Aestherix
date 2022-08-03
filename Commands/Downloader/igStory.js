import { delay } from "@adiwajshing/baileys";
import moment from "moment-timezone";
import parser from "yargs-parser";
import { getStory3 } from "../../Utils/Instagram/index.js";
import { isOne, isURL, isSame, INFOLOG, ERRLOG, color } from "../../Helper/Modules/index.js";

export default {
	name: "igstory",
	description: "Downloads the story of the user",
	usage: "!igstory <username>",
	aliases: ["igstory", "igs"],
	category: "Downloader",
	cooldown: 6,
	limit: 9,
	status: "enable",
	async run({ from, query, prettyNumber, message }, client) {
		const time = moment().format("HH:mm:ss DD/MM");
		if (!query) return client[botNum].reply({ from, quoted: message }, "Please specify a username");
		try {
			const { _: usernames } = parser(query);
			if (isOne(usernames.length) && isURL(usernames[0]) && !/\/stories\//.test(usernames[0])) return client[botNum].reply({ from, quoted: message }, "Please specify a valid username or a valid url instagram story");
			for (const username of usernames) {
				if (isURL(username) && !/\/stories\//.test(username)) await client[botNum].reply({ from, quoted: message }, "Please specify a username or a valid url instagram story");
				else {
					const story = await getStory3(username);
					INFOLOG(`[${color(time, "cyan")}]`, `${color(`Downloading Instagram Story`, "cyan")} for ${color(prettyNumber, "#ff71ce")}`);
					if ("error" in story) {
						client[botNum].reply({ from, quoted: message }, `Error while downloading Instagram story\n\n${story.error}\n${username}`);
						ERRLOG(`[${color(time, "cyan")}]`, `${color("Failed to Download Instagram Story", "cyan")} for ${color(prettyNumber, "#ff71ce")}`);
						continue;
					} else {
						let capt = "``` • Instagram Story```\n\n";
						capt += `Username : ${story.username}\n`;
						capt += `Fullname : ${story.fullName}\n`;
						if (isOne(story.stories.length)) await client[botNum].sendMessage(from, story.stories[0].isVideo ? { video: { url: story.stories[0].url }, caption: capt.trim() } : { image: { url: story.stories[0].url }, caption: capt.trim() }, { quoted: message });
						else {
							capt += `Tot. Media : ${story.stories.length}`;
							await client[botNum].sendMessage(from, { text: capt.trim() }, { quoted: message });
							for (const medias of story.stories) {
								await client[botNum].sendMessage(from, medias.isVideo ? { video: { url: medias.url } } : { image: { url: medias.url } });
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
			await client[botNum].reply({ from, quoted: message }, str);
			log(err);
		}
	},
};
