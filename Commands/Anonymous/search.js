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
	async run({ from, message }, client) {
		const searching = await search(from, 20, client, message);
		if (typeof searching == "boolean" && searching) {
			return await client[botNum].reply(from, "Searching for a partner...");
		}
		if (typeof searching == "boolean" && !searching) {
			return await client[botNum].reply(from, "You are already searching for a partner!");
		}
		if (typeof searching == "object" && searching.partner2) {
			await client[botNum].reply(searching.partner2, "Searching for a partner...");
			await delay(1_500);
			await client[botNum].reply(searching.partner1, "Your partner is found!", searching.messages1);
			await client[botNum].reply(searching.partner2, "Your partner is found!", searching.messages2);
		} else if (searching.status == "chatting") {
			return await client[botNum].reply(from, "You are already chatting with someone!");
		} else {
			await client[botNum].reply(from, "You are already searching for a partner!");
		}
	},
};
