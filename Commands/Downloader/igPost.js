import { delay } from "@adiwajshing/baileys";
import moment from "moment-timezone";
import parser from "yargs-parser";
import { getPost } from "../../Utils/Instagram/index.js";
import { isOne, isURL, parseCode, numberWithCommas, INFOLOG, ERRLOG, color } from "../../Helper/Modules/index.js";

export default {
	name: "igpost",
	description: "Downloads the post of the user",
	usage: "!igpost <url>",
	aliases: ["igpost", "igp"],
	category: "Downloader",
	cooldown: 6,
	limit: 9,
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
				INFOLOG(`[${color(time, "cyan")}]`, `${color(`Downloading Instagram Post`, "#01cdfe")} for ${color(prettyNumber, "#ff71ce")}`);
				if (parse) {
					const post = await getPost(parse);
					if ("error" in post) {
						client[botNum].reply({ from, quoted: message }, `Error while downloading Instagram post\n\n${post.error}\n${url}`);
						ERRLOG(`[${color(time, "cyan")}]`, `${color("Failed to Download Instagram Post", "red")} for ${color(prettyNumber, "#ff71ce")}`);
						continue;
					} else {
						let capt = "``` • Instagram Post```\n\n";
						capt += `Username : ${post.username}\n`;
						capt += `Fullname : ${post.full_name}\n`;
						capt += `Privacy : ${post.is_private ? "Private" : "Public"}\n`;
						capt += `Verified : ${post.is_verified ? "Verified" : "Not Verified"}\n`;
						capt += `Published : ${moment(post.taken_at * 1000).format("HH:mm:ss DD/MM/YYYY")}\n`;
						capt += `Tot. Comment : ${numberWithCommas(post.comment_count)}\n`;
						capt += `Tot. Like : ${numberWithCommas(post.like_count)}\n`;
						if (isOne(post.post.length)) {
							capt += `Caption : ${post.captions.trim()}\n`;
							await client[botNum].sendMessage(
								from,
								post.post[0].isVideo
									? { video: { url: post.post[0].url }, caption: capt.trim() }
									: {
											image: { url: post.post[0].url },
											caption: capt.trim(),
									  },
								{ quoted: message },
							);
						} else {
							capt += `Tot. Media : ${post.post.length}\n`;
							capt += `Caption : ${post.captions.trim()}\n`;
							await client[botNum].sendMessage(from, { text: capt.trim() }, { quoted: message });
							for (let j = 0; j < post.post.length; j++) {
								await client[botNum].sendMessage(from, post.post[j].isVideo ? { video: { url: post.post[j].url } } : { image: { url: post.post[j].url } });
								await delay(300);
							}
						}
						INFOLOG(`[${color(time, "cyan")}]`, `${color("Downloaded Instagram Post", "#01cdfe")} for ${color(prettyNumber, "#ff71ce")}`);
					}
				} else {
					ERRLOG(`[${color(time, "cyan")}]`, `${color("Failed to Parse Instagram Post URL", "red")} for ${color(prettyNumber, "#ff71ce")}`);
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

function regex(input) {
	return /(https?:\/\/(?:www\.)?instagram\.com\/(p|reel|tv|s)\/([^\/?#&]+)).*/.test(input);
}
