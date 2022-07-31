import parser from "yargs-parser";
import { getWaifu, gifToMp4 } from "../../Utils/index.js";
import { removeDuplicatesArray } from "../../Helper/Modules/index.js";

export default {
	name: "waifupic",
	description: "Search images from waifu pics",
	usage: "!waifupic <query>",
	category: "Search",
	aliases: ["wpic"],
	limit: 4,
	cooldown: 5,
	status: "enable",
	async run({ query, from, message, args, sender }, client) {
		if (!query) return client[botNum].reply({ from, quoted: message }, "You must provide a query.");
		if (args[1] == "next" || args[1] == "prev") {
			const data = JSON.parse(JSON.parse(JSON.stringify(args.slice(5).join(" "))));
			const index = data.findIndex((v) => v == args[4]);
			let buffer;
			const isGif = data[index].endsWith("gif");
			if (isGif) buffer = await gifToMp4(data[index], sender);
			return await client[botNum].sendMessage(
				from,
				{
					...(isGif ? { video: buffer, gifPlayback: true } : { image: { url: data[index] } }),
					caption: `\`\`\` • Waifu Pics \`\`\``,
					templateButtons: [
						{ urlButton: { displayText: "Image Source", url: args[1] == "next" ? data[index] : data[index] } },
						index + 1 !== data.length ? { quickReplyButton: { displayText: "Next Image", id: `.waifupic next ${args[2]} ${args[3]} ${data[index + 1]} ${JSON.stringify(data)}` } } : { quickReplyButton: { displayText: `Search More ${args[2].capitalize()}`, id: `.waifupic ${args[2]} -${args[3]}` } },
						index !== 0 ? { quickReplyButton: { displayText: "Previous Image", id: `.waifupic prev ${args[2]} ${args[3]} ${data[index - 1]} ${JSON.stringify(data)}` } } : {},
					],
					footer: `Powered by waifu.pics\nVoid Bot     ${index + 1}/${data.length}`,
				},
				{ quoted: message },
			);
		}
		let { _: queries, nsfw } = parser(query.toLowerCase(), {
			configuration: {
				"short-option-groups": false,
			},
			alias: {
				nsfw: ["nsfw", "notsafe"],
				sfw: ["safe", "sfw"],
			},
		});
		queries = removeDuplicatesArray(queries);
		for (const querie of queries) {
			const result = await getWaifu(querie.trim(), nsfw ? "nsfw" : "sfw");
			if ("error" in result) {
				await client[botNum].reply({ from, quoted: message }, result.error);
				continue;
			}
			let buffer;
			const isGif = result[0].endsWith("gif");
			if (isGif) buffer = await gifToMp4(result[0], sender);
			await client[botNum].sendMessage(
				from,
				{
					...(isGif ? { video: buffer } : { image: { url: result[0] } }),
					image: { url: result[0] },
					caption: `\`\`\` • Waifu Pics \`\`\``,
					templateButtons: [{ urlButton: { displayText: "Image Source", url: result[0] } }, { quickReplyButton: { displayText: "Next Image", id: `.waifupic next ${querie} ${nsfw ? "nsfw" : "sfw"} ${result[1]} ${JSON.stringify(result)}` } }],
					footer: `Powered by waifu.pics\nVoid Bot     1/${result.length}`,
				},
				{ quoted: message },
			);
		}
	},
};
