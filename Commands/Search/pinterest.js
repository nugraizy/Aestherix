import { pinterest } from "../../Utils/Pinterest/index.js";

export default {
    name: "pinterest",
    description: "Search images from pinterest",
    usage: "!pinterest <query>",
    category: "Search",
    aliases: ["pin"],
    limit: 4,
    cooldown: 5,
    async run({ query, from, message }, client) {
        if (!query) return client[botNum].reply({ from, quoted: message }, "You must provide a query");
        let result = await pinterest(query)
            if ("error" in result) return client[botNum].reply({ from, quoted: message }, "Image not found");
            let random = result[Math.floor(Math.random() * result.length)];
            await client[botNum].sendMessage(from, {
                image: { url: random },
                caption: `\`\`\` • Pinterest \`\`\``,
                templateButtons: [
                    { urlButton: { displayText: "Source", url: random } },
                    { quickReplyButton: { displayText: "Next Image", id: `.pinterest ${query}`}},
                ],
                footer: "Void Bot" },
                { quoted: message });
	    },
};
