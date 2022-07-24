import { generateMessageID } from "@adiwajshing/baileys";
import { removeDuplicatesArray } from "../../Helper/Modules/index.js";
import { searchNovel } from "../../Utils/Pixiv/index.js";

export default {
	name: "pixivnovel",
	description: "Find novel from Pixiv",
	usage: "!pixivnovel <query>",
	aliases: ["pixnovel"],
	category: "Search",
	limit: 4,
	cooldown: 5,
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
				for (const { id, title, pageCount, userName, type } of data) {
					container.push({
						rows: [
							{
								title: "Download",
								rowId: `${cmd}get https://www.pixiv.net/novel/show.php?id=${id}`,
							},
						],
						title: `PIXIV | ${title.capitalize()} | by ${userName} | ${pageCount} | ${type.capitalize()}`,
					});
				}
				await client[botNum].relayMessage(from, { listMessage: { buttonText: "``` • Pixiv Novel Search```", description: "Pixiv Novel Search", footerText: "choose one of the artworks inside of the list to download.", listType: 1, sections: container } }, { messageId: generateMessageID() });
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
