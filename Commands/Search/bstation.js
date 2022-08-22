import { numberWithCommas, removeDuplicatesArray } from "../../Helper/Modules/index.js";
import { bilibiliSearchTV } from "../../Utils/Bilibili/index.js";

export default {
	name: "bstation",
	description: "Search videos from Bilibili/Bstation ID Server",
	usage: "!bstation <query>",
	category: "Search",
	aliases: ["bstat", "blindo"],
	limit: 4,
	cooldown: 7,
	status: "enable",
	async run({ query, from, message, cmd }, client) {
		if (!query) return await client[botNum].reply({ from, quoted: message }, "You must provide a query.");
		try {
			let queries = query.split(",");
			queries = removeDuplicatesArray(queries);
			for (const querie of queries) {
				const videos = await bilibiliSearchTV(querie.trim());
				if ("error" in videos) {
					await client[botNum].reply({ from, quoted: message }, `${videos.error}\n${videos.cus_error}`);
					continue;
				}
				let i = 0;
				const row = [];
				for (const { title, aid, cover, source, author, view, duration, score } of videos) {
					if (i == 0)
						await client[botNum].sendMessage(
							from,
							{
								image: { url: cover },
								caption: `\`\`\` • Bilibili \`\`\``,
								templateButtons: [
									{ index: 1, urlButton: { displayText: "Source Bstation", url: source } },
									{ index: 2, urlButton: { displayText: "Source Image", url: cover } },
									{ index: 3, quickReplyButton: { displayText: "Download", id: `${cmd}dl ${aid}` } },
								],
								footer: `Title : ${title.capitalize()}
Author : ${author}
Video ID : ${aid}
View : ${numberWithCommas(view)}
Duration : ${duration}
Ratings : ${score}`,
							},
							{ quoted: message },
						);
					i++;
					row.push({
						rows: [
							{
								title: `${i}. ${title}`,
								rowId: `${cmd}dl ${aid}`,
							},
						],
						title: `Bstation | Views : ${numberWithCommas(view)}`,
					});
				}
				await client[botNum].sendMessage(from, {
					buttonText: "Open List",
					text: "\t",
					footer: "```Looking for some more? Choose between these options.```",
					title: "``` • Bstation```",
					sections: row,
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
