import { delay } from "@adiwajshing/baileys";
import moment from "moment-timezone";
import { fbDl } from "../../Utils/Facebook/index.js";
import { isOne, isURL, INFOLOG, ERRLOG, color } from "../../Helper/Modules/index.js";

export default {
	name: "fbpost",
	description: "Downloads a Facebook post",
	usage: "!fbpost <url>",
	aliases: ["fbpost", "fbp", "fb"],
	category: "Downloader",
	cooldown: 6,
	limit: 3,
	async run({ from, query, prettyNumber }, client) {
		const time = moment().format("HH:mm:ss DD/MM");
		if (!query) return client[botNum].reply(from, "Please provide a URL");
		try {
			const urls = query.split(",");
			if (isOne(urls.length) && !isURL(query)) return client[botNum].reply(from, "Please specify a valid url");
			if (isOne(urls.length) && !regex(query)) return client[botNum].reply(from, "Please specify a valid Facebook url");
			for (const url of urls) {
				if (!isURL(url.trim())) {
					await client[botNum].reply(from, "Please specify a valid url");
					continue;
				} else if (!regex(url.trim())) {
					await client[botNum].reply(from, "Please specify a valid Facebook url");
					continue;
				}
				const post = await fbDl(url.trim());
				INFOLOG(`[${color(time, "cyan")}]`, `${color(`Downloading Facebook Post`, "#01cdfe")} for ${color(prettyNumber, "#ff71ce")}`);
				if ("error" in post) {
					client[botNum].reply(from, `Failed while downloading Facebook post\n\n${post.error}\n${url}`);
					ERRLOG(`[${color(time, "cyan")}]`, `${color("Failed to Download Facebook Post", "red")} for ${color(prettyNumber, "#ff71ce")}`);
					continue;
				} else {
					await client[botNum].sendMessage(from, { video: { url: post.url }, caption: `Post Uploaded : ${post.datePosted}\nDuration : ${post.duration}` });
					await delay(300);
				}
			}
			INFOLOG(`[${color(time, "cyan")}]`, `${color(`Downloaded Facebook Post`, "#01cdfe")} for ${color(prettyNumber, "#ff71ce")}`);
		} catch (err) {
			let str = "Something went wrong. Please send this error stack to the owner. :\n\n";
			str += `Type : ${err.name ?? "Converting"}\n`;
			str += `Message : ${err.message ?? err.error}`;
			await client[botNum].reply(from, str);
			console.log(err);
		}
	},
};

function regex(input) {
	return /^(https?:\/\/)?((w{3}\.)?)facebook.com\/.*/.test(input);
}
