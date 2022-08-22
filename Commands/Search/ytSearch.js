import { ytsr } from "../../Utils/YouTube/index.js";
import { numberWithCommas } from "../../Helper/index.js";

export default {
	name: "ytsearch",
	description: "Search YouTube",
	usage: "!ytsearch",
	aliases: ["yts", "ytsr"],
	category: "Search",
	cooldown: 10,
	limit: 5,
	status: "enable",
	async run({ from, query, message }, client) {
		if (!query) {
			return client[botNum].reply({ from, quoted: message }, "Please specify a query.");
		}
		let result = await ytsr(query);
		const { url, title, description, image, timestamp, views, author } = result[0];
		result = result.slice(1);
		let capt = "``` • YouTube Search```\n\n";
		capt += `Title : ${title}\n`;
		capt += `Views : ${numberWithCommas(views)}\n`;
		capt += `Author : ${author.name}\n`;
		capt += `Author Channel : ${author.url}\n`;
		capt += `Duration : ${timestamp ?? "No Data"}\n`;
		capt += `Description : ${description ?? "No Data"}`;
		await client[botNum].sendMessage(from, {
			image: { url: image.replace("https", "http") },
			caption: capt,
			footer: "Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪",
			templateButtons: [
				{ urlButton: { displayText: "Stream Here", url } },
				{ quickReplyButton: { displayText: "Download MP3", id: `.yta ${url}` } },
				{ quickReplyButton: { displayText: "Download MP4", id: `.ytv ${url}` } },
				{ quickReplyButton: { displayText: "Download MP3 & MP4", id: `.yta ${url}|.ytv ${url}` } },
			],
			headerType: 1,
		});
		const row = [];
		result.forEach(({ url, title, timestamp, views, author }) => {
			row.push(
				{ rows: [{ title: `MP4 | ${title}`, rowId: `.ytv ${url}` }], title: `${author.name} | 👁️‍🗨️ ${numberWithCommas(views)} | ${timestamp}` },
				{ rows: [{ title: `MP3 | ${title}`, rowId: `.yta ${url}` }], title: `${author.name} | 👁️‍🗨️ ${numberWithCommas(views)} | ${timestamp}` },
				{ rows: [{ title: `MP3 & MP4 | ${title}`, rowId: `.yta ${url}|.ytv ${url}` }], title: `${author} | 👁️‍🗨️ ${numberWithCommas(views)} | ${timestamp}` },
			);
		}),
			await client[botNum].sendMessage(from, {
				buttonText: "Open list",
				title: "See other result",
				footer: `Made by Void Bot. Powered by Hidden Finder`,
				text: "\t",
				sections: row,
			});
	},
};
