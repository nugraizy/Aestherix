import { isURL } from "../../Helper/Modules/index.js";
import { tiny } from "../../Utils/Shortener/index.js";

export default {
	name: "tiny",
	description: "URL shortener using tinyurl",
	usage: "!tiny <query>",
	category: "Misc",
	aliases: ["tinyurl", "urlshort", "short", "shorten"],
	limit: 2,
	cooldown: 3,
	status: "enable",
	async run({ query, from, message }, client) {
		if (!query) return client[botNum].reply({ from, quoted: message }, "You must provide a URL");
		if (!isURL(query)) return client[botNum].reply({ from, quoted: message }, "Please specify a valid URL");
		try {
			const urls = await tiny(query);
			await client[botNum].reply({ from, quoted: message }, urls);
		} catch (err) {
			log(err);
			client[botNum].reply({ from, quoted: message }, "Error while shortening your URL");
		}
	},
};
