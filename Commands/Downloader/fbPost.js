import { delay } from "@adiwajshing/baileys";
import { fbDl } from "../../Utils/Facebook/fbDownloader.js";
import moment from "moment-timezone";

export default {
	name: "fbpost",
	description: "Downloads a Facebook post",
	usage: "!fbpost <url>",
	aliases: ["fbpost", "fbp"],
	category: "Downloader",
	async run(message, client, args) {
		const time = moment().format("HH:mm:ss DD/MM");
		if (!message.query) return client[botNum].reply(message.from, "Please provide a URL");
		const urls = message.query.split(",");
		const { isOne, isURL, INFOLOG, ERRLOG, color } = await import("../../Helper/Modules/functions.js");
		if (isOne(urls.length) && !isURL(message.query)) return client[botNum].reply(message.from, "Please specify a valid url");
		if (isOne(urls.length) && !regex(message.query)) return client[botNum].reply(message.from, "Please specify a valid Facebook url");
		for (const url of urls) {
			if (!isURL(url.trim())) {
				await client[botNum].reply(message.from, "Please specify a valid url");
				continue;
			} else if (!regex(url.trim())) {
				await client[botNum].reply(message.from, "Please specify a valid Facebook url");
				continue;
			}
			const post = await fbDl(url.trim());
			INFOLOG(`[${color(time, "cyan")}]`, `${color(`Downloading Facebook Post`, "#01cdfe")} for ${color(message.prettyNumber, "#ff71ce")}`);
			if ("error" in post) {
				client[botNum].reply(message.from, `Failed while downloading Facebook post\n\n${post.error}\n${url}`);
				ERRLOG(`[${color(time, "cyan")}]`, `${color("Failed to Download Facebook Post", "red")} for ${color(message.prettyNumber, "#ff71ce")}`);
				continue;
			} else {
				await client[botNum].sendMessage(message.from, { video: { url: post.url }, caption: `Post Uploaded : ${post.datePosted}\nDuration : ${post.duration}` });
				await delay(300);
			}
		}
		INFOLOG(`[${color(time, "cyan")}]`, `${color(`Downloaded Facebook Post`, "#01cdfe")} for ${color(message.prettyNumber, "#ff71ce")}`);
	},
};

function regex(input) {
	return /^(https?:\/\/)?((w{3}\.)?)facebook.com\/.*/.test(input);
}
