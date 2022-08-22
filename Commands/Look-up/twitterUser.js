import moment from "moment-timezone";
import parser from "yargs-parser";
import { color, ERRLOG, isOne, isURL } from "../../Helper/Modules/index.js";
import { twitterUser } from "../../Utils/Twitter/index.js";

export default {
	name: "twitstalk",
	description: "Lookup Twitter user",
	usage: "!twitstalk <username>",
	aliases: ["twtlu", "twtlookup", "twtuser"],
	category: "Look-up",
	cooldown: 6,
	limit: 6,
	status: "enable",
	async run({ from, query, prettyNumber, message }, client) {
		const time = moment().format("HH:mm:ss DD/MM");
		if (!query) {
			return await client[botNum].reply({ from, quoted: message }, "Please specify a url");
		}
		try {
			let { _: usernames } = parser(query);
			if (isOne(usernames.length) && isURL(usernames[0])) {
				return await client[botNum].reply({ from, quoted: message }, "Please specify a valid Twitter usernames");
			}
			for (const username of usernames) {
				if (isURL(username.trim())) {
					await client[botNum].reply({ from, quoted: message }, "Please specify a valid Twitter username");
					continue;
				}
				const user = await twitterUser(username);
				if ("error" in user) {
					client[botNum].reply({ from, quoted: message }, `Error while searching Twitter user\n\n${user.error}\n${username}`);
					ERRLOG(`[${color(time, "cyan")}]`, `${color("Failed to Searching Twitter User", "red")} for ${color(prettyNumber, "#ff71ce")}`);
					continue;
				} else {
					const { biograph, username, name, joined, verified, imageProfile, personalUrl } = user;
					let capt = "``` • Twitter User Lookup```\n\n";
					capt += `Username : ${username}\n`;
					capt += `Fullname : ${name}\n`;
					capt += `Verified? : ${verified ? "Yes" : "No"}\n`;
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
