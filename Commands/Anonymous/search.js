import { delay } from "@adiwajshing/baileys";
import { search } from "../../Utils/Anonymous/index.js";

export default {
	name: "search",
	description: "Search for a partner",
	category: "Anonymous",
	usage: "!search",
	aliases: ["find", "findpartner"],
	cooldown: 5,
	limit: 1,
	status: "enable",
	async run({ from, message }, client) {
		const searching = await search(from, 20, client, message);
		if (typeof searching == "boolean" && searching) {
			return await client[botNum].reply({ from, quoted: message }, "Searching for a partner...");
		}
		if (typeof searching == "boolean" && !searching) {
			return await client[botNum].reply({ from, quoted: message }, "You are already searching for a partner!");
		}
		if (typeof searching == "object" && searching.partner2) {
			await client[botNum].reply({ quoted: message, from: searching.partner2 }, "Searching for a partner...");
			await delay(1_500);
			await client[botNum].reply({ quoted: searching.messages1, from: searching.partner1 }, "Your partner is found!");
			await client[botNum].reply({ quoted: searching.messages2, from: searching.partner2 }, "Your partner is found!");
		} else if (searching.status == "chatting") {
			return await client[botNum].reply({ from, quoted: message }, "You are already chatting with someone!");
		} else {
			await client[botNum].reply({ from, quoted: message }, "You are already searching for a partner!");
		}
	},
};
