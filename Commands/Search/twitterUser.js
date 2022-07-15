import moment from "moment-timezone";
import parser from "yargs-parser";
import { twitterUser } from "../../Utils/Twitter/index.js";
import { isOne, isURL, ERRLOG, color } from "../../Helper/Modules/index.js";

export default {
	name: "twitteruser",
	description: "Lookup Twitter user",
	usage: "!twitteruser <username>",
	aliases: ["twtlu", "twtlookup", "twtuser"],
	category: "Downloader",
	cooldown: 6,
	limit: 9,
	async run({ from, query, prettyNumber, message }, client) {
		const time = moment().format("HH:mm:ss DD/MM");
		if (!query) return client[botNum].reply({ from, quoted: message }, "Please specify a url");
		try {
			let { _: usernames } = parser(query);
			if (isOne(usernames.length) && isURL(usernames[0])) return client[botNum].reply({ from, quoted: message }, "Please specify a valid Twitter usernames");
			for (const username of usernames) {
				if (isURL(username.trim())) {
					await client[botNum].reply({ from, quoted: message }, "Please specify a valid Twitter username");
					continue;
				}
				const user = await twitterUser(username);
				if ("error" in user) {
					client[botNum].reply({ from, quoted: message }, `Error while searching Twitter user\n\n${post.error}\n${url}`);
					ERRLOG(`[${color(time, "cyan")}]`, `${color("Failed to Searching Twitter User", "red")} for ${color(prettyNumber, "#ff71ce")}`);
					continue;
				} else {
					const { biograph, username, name, joined, verified, imageProfile, personalUrl } = user;
					let capt = "``` • Twitter User Lookup```\n\n";
					capt += `Username : ${username}\n`;
					capt += `Fullname : ${name}\n`;
					capt += `Verified : ${verified ? "Verified" : "Not Verified"}\n`;
					capt += `Joined : ${joined}\n`;
					capt += `Personal URL : ${personalUrl}\n`;
					capt += `Biograph : ${biograph}`;
					await client[botNum].sendMessage(from, { image: { url: imageProfile }, caption: capt.trim() }, { quoted: message });
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
