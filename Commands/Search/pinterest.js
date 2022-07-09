import { pinterest } from "../../Utils/Pinterest/index.js";

export default {
	name: "pinterest",
	description: "Search images from pinterest",
	usage: "!pinterest <query>",
	category: "Search",
	aliases: ["pin"],
	limit: 4,
	cooldown: 5,
	async run({ query, from, message, args }, client) {
		if (!query) return client[botNum].reply({ from, quoted: message }, "You must provide a query.");
		if (args[2] == "next" || args[2] == "prev") {
			const IMAGES = args[3].split("*");
			const INDEX = IMAGES.findIndex((v) => v == args[1]);
			return await client[botNum].sendMessage(
				from,
				{
					image: { url: args[2] == "next" ? IMAGES[INDEX] : IMAGES[INDEX] },
					caption: `\`\`\` • Pinterest \`\`\``,
					templateButtons: [
						{ urlButton: { displayText: "Source", url: query } },
						INDEX !== IMAGES.length ? { quickReplyButton: { displayText: "Next Image", id: `.pinterest ${IMAGES[INDEX + 1]} next ${IMAGES.join("*")}` } } : {},
						INDEX !== 0 ? { quickReplyButton: { displayText: "Previous Image", id: `.pinterest ${IMAGES[INDEX - 1]} prev ${IMAGES.join("*")}` } } : {},
					],
					footer: `Void Bot     ${INDEX + 1}/${IMAGES.length}`,
				},
				{ quoted: message },
			);
		}
		const result = await pinterest(query);
		if ("error" in result) return client[botNum].reply({ from, quoted: message }, result.message);
		await client[botNum].sendMessage(
			from,
			{
				image: { url: result[0] },
				caption: `\`\`\` • Pinterest \`\`\``,
				templateButtons: [{ urlButton: { displayText: "Source", url: result[0] } }, { quickReplyButton: { displayText: "Next Image", id: `.pinterest ${result[1]} next ${result.join("*")}` } }],
				footer: `Void Bot     1/${result.length}`,
			},
			{ quoted: message },
		);
	},
};
