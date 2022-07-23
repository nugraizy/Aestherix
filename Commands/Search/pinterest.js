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
		if (args[1] == "next" || args[1] == "prev") {
			const data = JSON.parse(JSON.parse(JSON.stringify(args.slice(3).join(" "))));
			const index = data.findIndex((v) => v.image == args[2]);
			return await client[botNum].sendMessage(
				from,
				{
					image: { url: data[index].image },
					caption: `\`\`\` • Pinterest \`\`\``,
					templateButtons: [
						{ urlButton: { displayText: "Image Source", url: args[1] == "next" ? data[index].image : data[index].image } },
						{ urlButton: { displayText: "Pinterest Source", url: args[1] == "next" ? data[index].pinSource : data[index].pinSource } },
						index + 1 !== data.length ? { quickReplyButton: { displayText: "Next Image", id: `.pinterest next ${data[index + 1].image} ${JSON.stringify(data)}` } } : {},
						index !== 0 ? { quickReplyButton: { displayText: "Previous Image", id: `.pinterest prev ${data[index - 1].image} ${JSON.stringify(data)}` } } : {},
					],
					footer: `Author : ${data[index].authorUsername}
Author Fullname : ${data[index].authorFullname}
Follower : ${data[index].follower}
Caption : ${data[index].caption}
Void Bot     ${index + 1}/${data.length}`,
				},
				{ quoted: message },
			);
		}
		const result = await pinterest(query);
		if ("error" in result) return client[botNum].reply({ from, quoted: message }, result.message);
		result.forEach((v) => {
			return (v.caption = v.caption == "" ? "No caption" : v.caption);
		});
		await client[botNum].sendMessage(
			from,
			{
				image: { url: result[0].image },
				caption: `\`\`\` • Pinterest \`\`\``,
				templateButtons: [
					{ urlButton: { displayText: "Image Source", url: result[0].image } },
					{ urlButton: { displayText: "Pinterest Source", url: result[0].pinSource } },
					{ quickReplyButton: { displayText: "Next Image", id: `.pinterest next ${result[1].image} ${JSON.stringify(result).replace(/\|/g, "")}` } },
				],
				footer: `Author : ${result[0].authorUsername}
Author Fullname : ${result[0].authorFullname}
Follower : ${result[0].follower}
Caption : ${result[0].caption}
Void Bot     1/${result.length}`,
			},
			{ quoted: message },
		);
	},
};
