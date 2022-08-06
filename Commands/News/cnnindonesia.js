import { cnnindonesia } from "../../Utils/index.js";

export default {
	name: "cnnindonesia",
	description: "Showing latest news in Indonesia from CNN",
	category: "News",
	usage: "!cnnindonesia <keyword/blank(to fetch newest)>",
	aliases: ["cnnid"],
	cooldown: 2,
	limit: 1,
	status: "enable",
	async run({ query, from, message, args, cmd }, client) {
		if (args[1] == "next" || args[1] == "prev") {
			const data = JSON.parse(JSON.parse(JSON.stringify(args.slice(3).join(" "))));
			const index = data.findIndex((v) => v.image == args[2]);
			let caption = `\`\`\` • CNN Indonesia\`\`\`\n\n`;
			caption += `Title : ${data[index].title}\n`;
			caption += `Place : ${data[index].places}\n`;
			caption += `Published : ${data[index].published}\n`;
			caption += `Content : ${data[index].body}\n`;
			return await client[botNum].sendMessage(
				from,
				{
					image: { url: data[index].image },
					caption,
					templateButtons: [
						{ urlButton: { displayText: "Image Source", url: args[1] == "next" ? data[index].image : data[index].image } },
						{ urlButton: { displayText: "Article Source", url: args[1] == "next" ? data[index].link : data[index].link } },
						index + 1 !== data.length ? { quickReplyButton: { displayText: "Next Article", id: `${cmd} next ${data[index + 1].image} ${JSON.stringify(data)}` } } : {},
						index !== 0 ? { quickReplyButton: { displayText: "Previous Article", id: `${cmd} prev ${data[index - 1].image} ${JSON.stringify(data)}` } } : {},
					],
					footer: `Void Bot     ${index + 1}/${data.length}\nPowered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪`,
				},
				{ quoted: message },
			);
		}
		const data = await cnnindonesia(query);
		if ("error" in data) {
			return await client[botNum].reply({ from, quoted: message }, data.error);
		}
		let caption = `\`\`\` • CNN Indonesia\`\`\`\n\n`;
		caption += `Title : ${data[0].title}\n`;
		caption += `Place : ${data[0].places}\n`;
		caption += `Published : ${data[0].published}\n`;
		caption += `Content : ${data[0].body}\n`;
		await client[botNum].sendMessage(
			from,
			{
				image: { url: data[0].image },
				caption,
				templateButtons: [{ urlButton: { displayText: "Image Source", url: data[0].image } }, { urlButton: { displayText: "Article Source", url: data[0].link } }, { quickReplyButton: { displayText: "Next Article", id: `${cmd} next ${data[1].image} ${JSON.stringify(data)}` } }],
				footer: `Void Bot     1/${data.length}\nPowered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪`,
			},
			{ quoted: message },
		);
	},
};
