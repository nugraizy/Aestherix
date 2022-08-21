import { getFilesizeFromBytes, numberWithCommas, delay } from "../../Helper/Modules/index.js";
import { bilibiliSearchCOM } from "../../Utils/Bilibili/index.js";

export default {
	name: "bilibili",
	description: "Search videos from Bilibili",
	usage: "!bilibili <query>",
	category: "Search",
	aliases: ["bili", "bli"],
	limit: 4,
	cooldown: 7,
	status: "enable",
	async run({ query, from, message }, client) {
		if (!query) return client[botNum].reply({ from, quoted: message }, "You must provide a query.");
		try {
			let queries = query.split(",");
			queries = removeDuplicatesArray(queries);
			for (const querie of queries) {
				const videos = await bilibiliSearchCOM(querie.trim());
				if ("error" in videos) {
					await client[botNum].reply({ from, quoted: message }, `${videos.error}\n${videos.cus_error}`);
					continue;
				}
				let i = 0;
				for (const { title, author, author_id, like, share, duration, favorite, view, thumbnail, description, original_video_link, download_link, size } of videos) {
					if (i == 3) break;
					await delay(300);
					await client[botNum].sendMessage(
						from,
						{
							image: { url: thumbnail },
							caption: `\`\`\` • Bilibili \`\`\``,
							templateButtons: [
								{ urlButton: { displayText: `Download Here ${getFilesizeFromBytes(size)}`, url: download_link } },
								{ urlButton: { displayText: "Stream Here", url: original_video_link } },
							],
							footer: `Title : ${title}
Author : ${author}
Author ID : ${author_id}
Like : ${numberWithCommas(like)}
Share : ${numberWithCommas(share)}
Favorite : ${numberWithCommas(favorite)}
Favorite : ${numberWithCommas(view)}
Duration : ${duration}
Description : ${description}`,
						},
						{ quoted: message },
					);
					i++;
				}
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
