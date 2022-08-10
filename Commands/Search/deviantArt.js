import { numberWithCommas, removeDuplicatesArray } from "../../Helper/Modules/index.js";
import { searchDeviantArt } from "../../Utils/DeviantArt/index.js";

export default {
	name: "deviantart",
	description: "Search images from Deviant Art",
	usage: "!deviantart <query>",
	category: "Search",
	aliases: ["dvart", "devart"],
	limit: 4,
	cooldown: 5,
	status: "enable",
	async run({ query, from, message, args }, client) {
		if (!query) return client[botNum].reply({ from, quoted: message }, "You must provide a query.");
		if (args[1] == "next" || args[1] == "prev") {
			const data = JSON.parse(JSON.parse(JSON.stringify(args.slice(3).join(" "))));
			const index = data.findIndex((v) => v.image == args[2]);
			return await client[botNum].sendMessage(
				from,
				{
					image: { url: data[index].image },
					caption: `\`\`\` • Deviant Art \`\`\``,
					templateButtons: [
						{ urlButton: { displayText: "Image Source", url: args[1] == "next" ? data[index].image : data[index].image } },
						{ urlButton: { displayText: "Deviant Art Source", url: args[1] == "next" ? data[index].source : data[index].source } },
						index + 1 !== data.length ? { quickReplyButton: { displayText: "Next Image", id: `.deviantart next ${data[index + 1].image} ${JSON.stringify(data)}` } } : {},
						index !== 0 ? { quickReplyButton: { displayText: "Previous Image", id: `.deviantart prev ${data[index - 1].image} ${JSON.stringify(data)}` } } : {},
					],
					footer: `Title : ${data[index].title.capitalize()}
Author : ${data[index].author}
Favourites : ${numberWithCommas(data[index].favourites)}
Views : ${numberWithCommas(data[index].views)}
Void Bot     ${index + 1}/${data.length}\nPowered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪`,
				},
				{ quoted: message },
			);
		}
		let queries = query.split(",");
		queries = removeDuplicatesArray(queries);
		for (const querie of queries) {
			const result = await searchDeviantArt(querie.trim());
			if ("error" in result) {
				await client[botNum].reply({ from, quoted: message }, result.error);
				continue;
			}
			await client[botNum].sendMessage(
				from,
				{
					image: { url: result[0].image },
					caption: `\`\`\` • Deviant Art \`\`\``,
					templateButtons: [
						{ urlButton: { displayText: "Image Source", url: result[0].image } },
						{ urlButton: { displayText: "Deviant Art Source", url: result[0].source } },
						{ quickReplyButton: { displayText: "Next Image", id: `.deviantart next ${result[1].image} ${JSON.stringify(result).replace(/\|/g, "")}` } },
					],
					footer: `Title : ${result[0].author.capitalize()}
Author : ${result[0].author}
Favourites : ${numberWithCommas(result[0].favourites)}
Views : ${numberWithCommas(result[0].views)}
Void Bot     1/${result.length}\nPowered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪`,
				},
				{ quoted: message },
			);
		}
	},
};
