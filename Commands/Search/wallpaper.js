import { removeDuplicatesArray } from "../../Helper/Modules/index.js";
import { arq } from "../../Utils/ARQ/index.js";

export default {
	name: "wallpaper",
	description: "Search wallpaper",
	usage: "!wallpaper <query>",
	category: "Search",
	aliases: ["wall"],
	limit: 4,
	cooldown: 5,
	status: "enable",
	async run({ query, from, message, args, type }, client) {
		if (!query) {
			return await client[botNum].reply({ from, quoted: message }, "You must provide a query.");
		}
		if ((args[1] == "next" || args[1] == "prev") && type == "templateButtonReplyMessage") {
			const data = JSON.parse(JSON.parse(JSON.stringify(args.slice(3).join(" "))));
			const index = data.findIndex((v) => v == args[2]);
			return await client[botNum].sendMessage(
				from,
				{
					image: { url: data[index] },
					caption: `\`\`\` • Wallpaper \`\`\``,
					templateButtons: [
						{ urlButton: { displayText: "Image Source", url: args[1] == "next" ? data[index] : data[index] } },
						index + 1 !== data.length ? { quickReplyButton: { displayText: "Next Image", id: `.wallpaper next ${data[index + 1]} ${JSON.stringify(data)}` } } : {},
						index !== 0 ? { quickReplyButton: { displayText: "Previous Image", id: `.wallpaper prev ${data[index - 1]} ${JSON.stringify(data)}` } } : {},
					],
					footer: `Void Bot     ${index + 1}/${data.length}\nPowered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪`,
				},
				{ quoted: message },
			);
		}
		let queries = query.split(",");
		queries = removeDuplicatesArray(queries);
		for (const querie of queries) {
			let result = await arq.searchWallpaperARQ(querie.trim());
			if ("error" in result || !result.ok) {
				await client[botNum].reply({ from, quoted: message }, JSON.stringify(result));
				continue;
			}
			result = result.result.map((v) => v.url_image);
			await client[botNum].sendMessage(
				from,
				{
					image: { url: result[0] },
					caption: `\`\`\` • Wallpaper \`\`\``,
					templateButtons: [
						{ urlButton: { displayText: "Image Source", url: result[0] } },
						{ quickReplyButton: { displayText: "Next Image", id: `.wallpaper next ${result[1]} ${JSON.stringify(result)}` } },
					],
					footer: `Void Bot     1/${result.length}\nPowered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪`,
				},
				{ quoted: message },
			);
		}
	},
};
