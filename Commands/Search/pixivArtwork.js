import { generateMessageID } from "@adiwajshing/baileys";
import { removeDuplicatesArray } from "../../Helper/Modules/index.js";
import { searchArtwork } from "../../Utils/Pixiv/index.js";

export default {
	name: "pixivartwork",
	description: "Find artworks from Pixiv",
	usage: "!pixivartwork <query>",
	aliases: ["pixart", "pixivart"],
	category: "Search",
	limit: 4,
	cooldown: 5,
	async run({ from, query, message, cmd }, client) {
		if (!query) return client[botNum].reply({ from, quoted: message }, "You must provide a query.");
		try {
			let queries = query.split(",");
			queries = removeDuplicatesArray(queries);
			for (const querie of queries) {
				const data = await searchArtwork(querie.trim());
				if ("error" in data) {
					client[botNum].reply({ from, quoted: message }, `Failed while searching Pixiv artworks\n\n${data.error}\n${querie}`);
					continue;
				}
				const container = [];
				for (const { id, title, pageCount, userName, type } of data) {
					container.push({
						rows: [
							{
								title: "Download",
								rowId: `${cmd}dl https://www.pixiv.net/en/artworks/${id}`,
							},
						],
						title: `PIXIV | ${title.capitalize()} | by ${userName} | ${pageCount} | ${type.capitalize()}`,
					});
				}
				await client[botNum].relayMessage(from, { listMessage: { buttonText: "``` • Pixiv Artworks Search```", description: "Pixiv Artworks Search", footerText: "choose one of the artworks inside of the list to download.", listType: 1, sections: container } }, { messageId: generateMessageID() });
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
