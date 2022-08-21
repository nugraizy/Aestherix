import { delay } from "../../Helper/index.js";
import moment from "moment-timezone";
import parser from "yargs-parser";
import { color, ERRLOG, fetchBUFFER, INFOLOG, isOne, isURL } from "../../Helper/Modules/index.js";
import { fbDl } from "../../Utils/Facebook/index.js";

export default {
	name: "fbpost",
	description: "Downloads a Facebook post",
	usage: "!fbpost <url>",
	aliases: ["fbpost", "fbp", "fb", "fbdl"],
	category: "Downloader",
	cooldown: 8,
	limit: 6,
	status: "enable",
	async run({ from, query, prettyNumber, message }, client) {
		const time = moment().format("HH:mm:ss DD/MM");
		if (!query) return client[botNum].reply({ from, quoted: message }, "Please provide a URL");
		try {
			const { _: urls } = parser(query);
			if (isOne(urls.length) && !isURL(urls[0])) return client[botNum].reply({ from, quoted: message }, "Please specify a valid url");
			if (isOne(urls.length) && !regex(urls[0])) return client[botNum].reply({ from, quoted: message }, "Please specify a valid Facebook url");
			for (const url of urls) {
				if (!isURL(url.trim())) {
					await client[botNum].reply({ from, quoted: message }, "Please specify a valid url");
					continue;
				} else if (!regex(url.trim())) {
					await client[botNum].reply({ from, quoted: message }, "Please specify a valid Facebook url");
					continue;
				}
				const post = await fbDl(url.trim());
				INFOLOG(`[${color(time, "cyan")}]`, `${color(`Downloading Facebook Post`, "#01cdfe")} for ${color(prettyNumber, "#ff71ce")}`);
				if ("error" in post) {
					client[botNum].reply({ from, quoted: message }, `Failed while downloading Facebook post\n\n${post.error}\n${url}`);
					ERRLOG(`[${color(time, "cyan")}]`, `${color("Failed to Download Facebook Post", "red")} for ${color(prettyNumber, "#ff71ce")}`);
					continue;
				}
				await client[botNum].sendMessage(
					from,
					post.isVideo
						? {
								video: new Buffer.from(await fetchBUFFER(post.url)),
								caption: `\`\`\` • Facebook Video Downloader\`\`\`\n\n${post.datePosted ? `Post Uploaded : ${post.datePosted}\n` : ""}Res : ${post.resolution}${
									post.duration ? `\nDuration : ${post.duration}` : ""
								}`,
						  }
						: {
								image: new Buffer.from(await fetchBUFFER(post.url)),
								caption: `\`\`\` • Facebook Image Downloader\`\`\`\n\n${post.datePosted ? `Post Uploaded : ${post.datePosted}\n` : ""}Res : ${post.resolution}`,
						  },
				);
				await delay(300);
			}
			INFOLOG(`[${color(time, "cyan")}]`, `${color(`Downloaded Facebook Post`, "#01cdfe")} for ${color(prettyNumber, "#ff71ce")}`);
		} catch (err) {
			let str = "Something went wrong. Please send this error stack to the owner. :\n\n";
			str += `Type : ${err.name ?? "Converting"}\n`;
			str += `Message : ${err.message ?? err.error}`;
			await client[botNum].reply({ from, quoted: message }, str);
			log(err);
		}
	},
};

function regex(input) {
	return /^(https?:\/\/)?((w{3}\.)|(m\.)?)?(facebook|fb)\.(com|watch)\/.*/.test(input);
}
