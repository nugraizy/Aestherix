import { numberWithCommas, removeDuplicatesArray } from "../../Helper/Modules/index.js";
import { getNovelContent } from "../../Utils/Pixiv/index.js";

export default {
	name: "pixivnovelget",
	description: "Get novel content from Pixiv",
	usage: "!pixivnovelget <url>",
	aliases: ["pixnovelget"],
	category: "Search",
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
				const data = await getNovelContent(regexs.message);
				if ("error" in data) {
					client[botNum].reply({ from, quoted: message }, `Failed while looking for Pixiv novel content\n\n${data.error}\n${querie}`);
					continue;
				}
				const { title, likeCount, userName, viewCount, userId, content } = data;
				const caption = `Title : ${title.capitalize()}
Author : ${userName}
ID Artwork : ${regexs.message}
ID Author : ${userId}
Tot. Like : ${numberWithCommas(likeCount)}
Tot. View : ${numberWithCommas(viewCount)}

${content}`;
				await client[botNum].sendMessage(
					from,
					{
						text: caption,
						templateButtons: [{ urlButton: { displayText: "Novel Source", url: `https://www.pixiv.net/novel/show.php?id=${regexs.message}` } }],
						footer: " • Pixiv Novel Content",
					},
					{ quoted: message },
				);
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
		if (!match) return { status: false, message: "Novel code not found on your URL. Try another URL." };
		return { status: true, message: match[0] };
	}
	return { status: false, message: "This URL isn't a valid Pixiv URL. Try another URL." };
};
