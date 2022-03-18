import { extractZalgo } from "../../Helper/Modules/index.js";

export default {
	name: "extractzalgo",
	description: "Extract Zalgo text to Text",
	usage: "!extractzalgo <query>",
	category: "Misc",
	aliases: ["conzalgo", "conzalg"],
	limit: 2,
	cooldown: 3,
	async run({ query, from }, client) {
		if (!query) return client[botNum].reply(from, "You need to provide text to extract the zalgo");
		await client[botNum].reply(from, extractZalgo(query));
	},
};
