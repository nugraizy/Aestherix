import { generateMessageID } from "@adiwajshing/baileys";
import { removeDuplicatesArray } from "../../Helper/Modules/index.js";
import { searchManga, downloadManga } from "../../Utils/Pixiv/index.js";

export default {
	name: "pixivmanga",
	description: "Find manga from Pixiv",
	usage: "!pixivmanga <query>",
	aliases: ["pixmanga"],
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
				const data = await searchManga(querie.trim());
				const dataImage = await downloadManga(data[0].id);
				if ("error" in data) {
					client[botNum].reply({ from, quoted: message }, `Failed while searching Pixiv manga\n\n${data.error}\n${querie}`);
					continue;
				}
				const container = [];
				let i = 0;
				const images = await fetchBUFFER(dataImage.url.original[0], { headers: { referer: `https://www.pixiv.net/ajax/manga/${dataImage.id}` } });
				await client[botNum].sendMessage(
					from,
					{
						image: new Buffer.from(images, "base64"),
						caption: `\`\`\` • Pixiv Manga Search \`\`\``,
						templateButtons: [{ urlButton: { displayText: "Manga Source", url: `https://www.pixiv.net/en/artworks/${dataImage.id}` } }],
						footer: `Title : ${dataImage.title.capitalize()}
Author : ${dataImage.userName}
ID Artwork : ${dataImage.id}
ID Author : ${dataImage.userId}
Total Media : ${dataImage.pageCount}`,
					},
					{ quoted: message },
				);
				for (let j = 0; j < dataImage.url.original.length; j++) {
					if (j != 0) {
						const images = await fetchBUFFER(dataImage.url.original[j], { headers: { referer: `https://www.pixiv.net/ajax/manga/${dataImage.id}` } });
						await client[botNum].sendMessage(
							from,
							{
								image: new Buffer.from(images, "base64"),
								caption: "\t",
								templateButtons: [{ urlButton: { displayText: "Manga Source", url: `https://www.pixiv.net/en/artworks/${id}` } }],
								footer: "\t",
							},
							{ quoted: message },
						);
					}
				}
				for (const { id, title } of data.slice(1)) {
					container.push({ rows: [{ title: `${i + 1}. ${title}`, rowId: `${cmd}dl https://www.pixiv.net/en/artworks/${id}` }], title: `\t` });
					i++;
				}
				await client[botNum].relayMessage(from, { listMessage: { buttonText: "``` • Pixiv Manga Search```", description: "Pixiv Search", footerText: "choose one of the manga inside of the list to download.", listType: 1, sections: container } }, { messageId: generateMessageID() });
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
