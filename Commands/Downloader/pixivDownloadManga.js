import fetch from "node-fetch";
import { removeDuplicatesArray } from "../../Helper/Modules/index.js";
import { downloadManga } from "../../Utils/Pixiv/index.js";

export default {
	name: "pixivmangadl",
	description: "Download manga from Pixiv",
	usage: "!pixivmangadl <url>",
	aliases: ["pixmangadl"],
	category: "Downloader",
	limit: 4,
	cooldown: 5,
	async run({ from, query, message }, client) {
		if (!query) return client[botNum].reply({ from, quoted: message }, "You must provide a query.");
		try {
			let queries = query.split(",");
			queries = removeDuplicatesArray(queries);
			for (const querie of queries) {
				const regexs = regex(querie.trim());
				if (!regexs.status) return client[botNum].reply({ from, quoted: message }, regexs.message);
				const data = await downloadManga(regexs.message);
				if ("error" in data) {
					client[botNum].reply({ from, quoted: message }, `Failed while downloading Pixiv manga\n\n${data.error}\n${querie}`);
					continue;
				}
				const { id, title, userId, userName, pageCount, url: urls } = data;
				const caption = `\`\`\` • Pixiv Manga Downloader\`\`\`\n\n
Title : ${title.capitalize()}
Author : ${userName}
ID Artwork : ${id}
ID Author : ${userId}
Total Media : ${pageCount}`;
				client[botNum].reply({ from, quoted: message }, caption);
				for (const url of urls) {
					const buffer = await (
						await fetch(url, {
							headers: {
								referer: `https://www.pixiv.net/ajax/manga/${id}`,
							},
						})
					).arrayBuffer();
					await client[botNum].sendMessage(from, { image: new Buffer.from(buffer, "base64") }, { quoted: message });
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

const regex = (input) => {
	const reg = /^https?:\/\/(www\.|i\.)?(pximg\.net)|(pixiv\.net)/i;
	const isPixiv = reg.test(input);
	if (isPixiv) {
		const match = input.match(/\d{8,10}/g);
		if (!match) return { status: false, message: "Manga code not found on your URL. Try another URL." };
		return { status: true, message: match[0] };
	}
	return { status: false, message: "This URL isn't a valid Pixiv URL. Try another URL." };
};
