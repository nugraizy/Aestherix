import moment from "moment-timezone";
import parser from "yargs-parser";
import { tiktokProfileTIKTOK } from "../../Utils/TikTok/index.js";
import { isOne, isURL, ERRLOG, color, numberWithCommas } from "../../Helper/Modules/index.js";

export default {
	name: "tikstalk",
	description: "Lookup TikTok user",
	usage: "!tikstalk <username>",
	aliases: ["ttstalk", "ttuser"],
	category: "Look-up",
	cooldown: 6,
	limit: 6,
	status: "enable",
	async run({ from, query, prettyNumber, message }, client) {
		const time = moment().format("HH:mm:ss DD/MM");
		if (!query) return client[botNum].reply({ from, quoted: message }, "Please specify a url");
		try {
			let { _: usernames } = parser(query);
			if (isOne(usernames.length) && isURL(usernames[0])) return client[botNum].reply({ from, quoted: message }, "Please specify a valid TikTok usernames");
			for (const user of usernames) {
				if (isURL(user.trim())) {
					await client[botNum].reply({ from, quoted: message }, "Please specify a valid TikTok username");
					continue;
				}
				const users = await tiktokProfileTIKTOK(user);
				if ("error" in users) {
					client[botNum].reply({ from, quoted: message }, `Error while searching TikTok user\n\n${users.error}`);
					ERRLOG(`[${color(time, "cyan")}]`, `${color("Failed to Searching TikTok User", "red")} for ${color(prettyNumber, "#ff71ce")}`);
					continue;
				} else {
					const { keyword, username, fullName, biography, isVerified, profileHD, profileSD, profileLOW, followers, following, heart, totalVideo } = users;
					let capt = `Username : ${username}\n`;
					capt += `Fullname : ${fullName}\n`;
					capt += `Followers : ${numberWithCommas(followers)}\n`;
					capt += `Following : ${numberWithCommas(following)}\n`;
					capt += `Tot. Like : ${numberWithCommas(heart)}\n`;
					capt += `Tot. Post : ${numberWithCommas(totalVideo)}\n`;
					capt += `Verified? : ${isVerified ? "Yes" : "No"}\n`;
					capt += `ID Profile : ${keyword}\n`;
					capt += `Biography : ${biography}\n`;
					await client[botNum].sendMessage(
						from,
						{
							image: { url: profileHD },
							caption: `\`\`\` • TikTok User Lookup \`\`\``,
							templateButtons: [{ urlButton: { displayText: "Profile Picture HD Source", url: profileHD } }, { urlButton: { displayText: "Profile Picture SD Source", url: profileSD } }, { urlButton: { displayText: "Profile Picture Low Source", url: profileLOW } }],
							footer: capt.trim(),
						},
						{ quoted: message },
					);
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
