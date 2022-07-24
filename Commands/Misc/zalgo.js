import { zalgo } from "../../Helper/Modules/index.js";

export default {
	name: "zalgo",
	description: "Convert Text to Zalgo text",
	category: "Misc",
	usage: "!zalgo <query>",
	category: "Misc",
	aliases: ["tozalgo", "zalg"],
	limit: 2,
	cooldown: 3,
	status: "enable",
	async run({ query, from, message }, client) {
		if (!query) return client[botNum].reply({ from, quoted: message }, "You need to provide text to zalgo");
		await client[botNum].reply({ from, quoted: message }, zalgo(query, { size: "maxi" }));
	},
};
