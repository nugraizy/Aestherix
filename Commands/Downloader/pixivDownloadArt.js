import fetch from "node-fetch";
import { removeDuplicatesArray } from "../../Helper/Modules/index.js";
import { downloadArtworks } from "../../Utils/Pixiv/index.js";

export default {
	name: "pixivartworkdl",
	description: "Download artworks from Pixiv",
	usage: "!pixivartworkdl <url>",
	aliases: ["pixartdl", "pixivartdl"],
	category: "Downloader",
	limit: 4,
	cooldown: 5,
	status: "enable",
	async run({ from, query, message }, client) {
		if (!query) return client[botNum].reply({ from, quoted: message }, "You must provide a query.");
		try {
			let queries = query.split(",");
			queries = removeDuplicatesArray(queries);
			for (const querie of queries) {
				const regexs = regex(querie.trim());
				if (!regexs.status) return client[botNum].reply({ from, quoted: message }, regexs.message);
				const data = await downloadArtworks(regexs.message);
				if ("error" in data) {
					client[botNum].reply({ from, quoted: message }, `Failed while downloading Pixiv artworks\n\n${data.error}\n${querie}`);
					continue;
				}
				let i = 0;
				const { id, title, userId, userName, pageCount, url: urls } = data;
				let caption = `Title : ${title.capitalize()}
Author : ${userName}
ID Artwork : ${id}
ID Author : ${userId}
Total Media : ${pageCount}`;
				const images = await (await fetch(urls.original[0], { headers: { referer: `https://www.pixiv.net/ajax/illust/${id}` } })).arrayBuffer();
				if (urls.original.length == 1)
					return await client[botNum].sendMessage(
						from,
						{
							image: new Buffer.from(images, "base64"),
							caption: `\`\`\` • Pixiv Artworks Downloader\`\`\`\n\n`,
							templateButtons: [{ urlButton: { displayText: "Artwork Source", url: `https://www.pixiv.net/en/artworks/${id}` } }],
							footer: caption,
						},
						{ quoted: message },
					);
				for (const url of urls.original) {
					caption = i == 0 ? caption : "\t";
					const buffer = await (await fetch(url, { headers: { referer: `https://www.pixiv.net/ajax/illust/${id}` } })).arrayBuffer();
					await client[botNum].sendMessage(
						from,
						{
							image: new Buffer.from(buffer, "base64"),
							caption: `\`\`\` • Pixiv Artworks Downloader\`\`\`\n\n`,
							templateButtons: [{ urlButton: { displayText: "Artwork Source", url: `https://www.pixiv.net/en/artworks/${id}` } }],
							footer: caption,
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

const regex = (input) => {
	const reg = /^https?:\/\/(www\.|i\.)?(pximg\.net)|(pixiv\.net)/i;
	const isPixiv = reg.test(input);
	if (isPixiv) {
		const match = input.match(/\d{8,10}/g);
		if (!match) return { status: false, message: "Artwork code not found on your URL. Try another URL." };
		return { status: true, message: match[0] };
	}
	return { status: false, message: "This URL isn't a valid Pixiv URL. Try another URL." };
};
