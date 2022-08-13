import { removeDuplicatesArray } from "../../Helper/Modules/index.js";
import { arq } from "../../Utils/ARQ/index.js";

export default {
	name: "findlyrics",
	description: "Search song lyrics",
	usage: "!findlyrics <query>",
	category: "Search",
	aliases: ["lyrics", "lyric"],
	limit: 4,
	cooldown: 5,
	status: "enable",
	async run({ query, from, message, args, type }, client) {
		if (!query) return client[botNum].reply({ from, quoted: message }, "You must provide a query.");
		if ((args[1] == "next" || args[1] == "prev") && type == "templateButtonReplyMessage") {
			const data = JSON.parse(JSON.parse(JSON.stringify(args.slice(3).join(" "))));
			const index = data.findIndex((v) => v.index == args[2]);
			return await client[botNum].sendMessage(
				from,
				{
					text: `\`\`\` • Lyrics \`\`\`
                    
Artist: ${data[index].artist}
Song: ${data[index].song}
\n${data[index].lyrics}`,
					templateButtons: [
						index + 1 !== data.length ? { quickReplyButton: { displayText: "Next Lyrics", id: `.lyrics next ${data[index + 1].index} ${JSON.stringify(data)}` } } : {},
						index !== 0 ? { quickReplyButton: { displayText: "Previous Lyrics", id: `.lyrics prev ${data[index - 1].index} ${JSON.stringify(data)}` } } : {},
					],
					footer: `Void Bot     ${index + 1}/${data.length}\nPowered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪`,
				},
				{ quoted: message },
			);
		}
		let queries = query.split(",");
		queries = removeDuplicatesArray(queries);
		for (const querie of queries) {
			let result = await arq.findLyrics(querie.trim());
			if ("error" in result || !result.ok) {
				await client[botNum].reply({ from, quoted: message }, JSON.stringify(result));
				continue;
			}
			result.result.forEach((v, i) => v.lyrics.replace("Paroles de la chanson par", ""));
			result.result = result.result.map((v, i) => ({ index: i, ...v }));
			await client[botNum].sendMessage(
				from,
				{
					text: `\`\`\` • Lyrics \`\`\`
                    
Artist: ${result.result[0].artist}
Song: ${result.result[0].song}
\n${result.result[0].lyrics}`,
					templateButtons: [{ quickReplyButton: { displayText: "Next Lyrics", id: `.lyrics next ${result.result[1].index} ${JSON.stringify(result.result)}` } }],
					footer: `Void Bot     1/${result.result.length}\nPowered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪`,
				},
				{ quoted: message },
			);
		}
	},
};
