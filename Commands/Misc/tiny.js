import { tiny } from "../../Utils/Shortener/index.js";
import { isURL } from "../../Helper/Modules/index.js";

export default {
	name: "tiny",
	description: "URL shortener using tinyurl",
	usage: "!tiny <query>",
	category: "Misc",
	aliases: ["tinyurl", "urlshort", "short", "shorten"],
	limit: 2,
	cooldown: 3,
	async run({ query, from }, client) {
		if (!query) return client[botNum].reply(from, "You must provide a URL");
		if (!isURL(query)) return client[botNum].reply(from, "Please specify a valid URL");
		try {
			const urls = await tiny(query);
			await client[botNum].reply(from, urls);
		} catch (err) {
			log(e);
			client[botNum].reply(from, "Error while shortening your URL");
		}
	},
};
