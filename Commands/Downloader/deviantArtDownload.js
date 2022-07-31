import { downloadDeviantArt } from "../../Utils/DeviantArt/index.js";
import { removeDuplicatesArray, numberWithCommas } from "../../Helper/Modules/index.js";

export default {
	name: "deviantartdl",
	description: "Download images from Deviant Art",
	usage: "!deviantartdl <url>",
	category: "Downloader",
	aliases: ["dvartdl", "devartdl"],
	limit: 4,
	cooldown: 5,
	status: "enable",
	async run({ query, from, message, args }, client) {
		if (!query) return client[botNum].reply({ from, quoted: message }, "You must provide a query.");
		try {
			let queries = query.split(",");
			queries = removeDuplicatesArray(queries);
			for (const querie of queries) {
				const regexs = regex(querie.trim());
				if (!regexs.status) return client[botNum].reply({ from, quoted: message }, regexs.message);
				const result = await downloadDeviantArt(regexs.message.trim());
				if ("error" in result) {
					await client[botNum].reply({ from, quoted: message }, result.error);
					continue;
				}
				await client[botNum].sendMessage(
					from,
					{
						image: { url: result.image },
						caption: `\`\`\` • Deviant Art \`\`\``,
						templateButtons: [{ urlButton: { displayText: "Image Source", url: result.image } }, { urlButton: { displayText: "Deviant Art Source", url: result.source } }],
						footer: `Title : ${result.author.capitalize()}
Author : ${result.author}
Favourites : ${numberWithCommas(result.favourites)}
Views : ${numberWithCommas(result.views)}`,
					},
					{ quoted: message },
				);
			}
		} catch (err) {
			log(err);
		}
	},
};

const regex = (input) => {
	const reg = /^https?:\/\/(www\.)?deviantart\.com\/[0-9a-bA-Z-?]*\/art\/[0-9a-zA-Z-?]*[0-9]*/gi;
	const isDeviant = reg.test(input);
	if (isDeviant) {
		const match = input.match(/\d{8,10}/g);
		if (!match) return { status: false, message: "DeviantArt code not found on your URL. Try another URL." };
		return { status: true, message: match[0] };
	}
	return { status: false, message: "This URL isn't a valid Deviant Art URL. Try another URL." };
};
