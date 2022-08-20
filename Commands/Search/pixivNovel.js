import { generateMessageID } from "@adiwajshing/baileys";
import { numberWithCommas, removeDuplicatesArray } from "../../Helper/Modules/index.js";
import { getNovelContent, searchNovel } from "../../Utils/Pixiv/index.js";

export default {
	name: "pixivnovel",
	description: "Find novel from Pixiv",
	usage: "!pixivnovel <query>",
	aliases: ["pixnovel"],
	category: "Search",
	limit: 4,
	cooldown: 5,
	status: "enable",
	async run({ from, query, message, cmd }, client) {
		if (!query) return client[botNum].reply({ from, quoted: message }, "You must provide a query.");
		try {
			let queries = query.split(",");
			queries = removeDuplicatesArray(queries);
			for (const querie of queries) {
				const data = await searchNovel(querie.trim());
				if ("error" in data) {
					client[botNum].reply({ from, quoted: message }, `Failed while searching Pixiv novel\n\n${data.error}\n${querie}`);
					continue;
				}
				const container = [];
				const { userName, id, userId, likeCount, viewCount, content } = await getNovelContent(data[0].id);
				await client[botNum].sendMessage(
					from,
					{
						text: `Title : ${data[0].title.capitalize()}
Author : ${userName}
ID Artwork : ${id}
ID Author : ${userId}
Tot. Like : ${numberWithCommas(likeCount)}
Tot. View : ${numberWithCommas(viewCount)}
						
${content}`,
						templateButtons: [{ urlButton: { displayText: "Novel Source", url: `https://www.pixiv.net/novel/show.php?id=${data[0].id}` } }],
						footer: ` • Pixiv Novel Content`,
					},
					{ quoted: message },
				);
				for (const { id, title, pageCount, userName, type } of data.slice(1)) {
					container.push({
						rows: [
							{
								title: `Read ${title}`,
								rowId: `${cmd}get https://www.pixiv.net/novel/show.php?id=${id}`,
							},
						],
						title: `PIXIV | ${title.capitalize()} | by ${userName} | ${pageCount} | ${type.capitalize()}`,
					});
				}
				await client[botNum].sendMessage(from, {
					title: "``` • Pixiv Novel Search```",
					text: "\t",
					footer: "choose one of the novel inside of the list to read.",
					buttonText: "Open List",
					sections: container,
				});
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
