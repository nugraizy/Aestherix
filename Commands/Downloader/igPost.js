import { getPost } from "../../Utils/Instagram/instaPost.js";
import { delay } from "@adiwajshing/baileys";
import moment from "moment-timezone";

export default {
	name: "igpost",
	description: "Downloads the post of the user",
	usage: "!igpost <url>",
	aliases: ["igpost", "igp"],
	category: "Social",
	async run(message, client, args) {
		if (!message.query) return client[botNum].reply(message.from, "Please specify a url");
		const urls = message.query.split(",");
		const { isOne, isURL, parseCode, isEmpty, isSame, numberWithCommas } = await import("../../Helper/Modules/functions.js");
		if (isOne(urls) && !isURL(username)) return client[botNum].reply(message.from, "Please specify a valid url");
		for (const url of urls) {
			if (!isURL(url)) await client[botNum].reply(message.from, "Please specify a valid url");
			const post = await getPost(parseCode(url));
			if ("error" in post) client[botNum].reply(message.from, post.error);
			else {
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
					client[botNum].sendMessage(
						message.from,
						post.post[0].isVideo
							? { video: { url: post.post[0].url }, caption: capt.trim() }
							: {
									image: { url: post.post[0].url },
									caption: capt.trim(),
							  },
						{ quoted: message.message },
					);
				} else {
					capt += `Tot. Media : ${post.post.length}\n`;
					capt += `Caption : ${post.captions.trim()}\n`;
					await client[botNum].sendMessage(message.from, { text: capt.trim() }, { quoted: message.message });
					for (let j = 0; j < post.post.length; j++) {
						client[botNum].sendMessage(message.from, post.post[j].isVideo ? { video: { url: post.post[j].url } } : { image: { url: post.post[j].url } });
						await delay(300);
					}
				}
			}
		}
	},
};
