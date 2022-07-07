import { stop } from "../../Utils/Anonymous/index.js";

export default {
	name: "stop",
	description: "Stop a partner",
	category: "Anonymous",
	usage: "!stop",
	aliases: ["stoppartner"],
	cooldown: 5,
	limit: 1,
	async run({ from, message }, client) {
		const stopping = stop(from, 0, client);
		if (typeof stopping == "boolean" && !stopping) {
			return await client[botNum].reply({ from, quoted: message }, "You are not in a search!");
		}
		if (typeof stopping == "object" && stopping.partner2) {
			await client[botNum].reply({ quoted: message, from: stopping.partner1 }, "You've stopped the chat!");
			await client[botNum].sendMessage(stopping.partner2, { text: "Your partner stoped the chat!" });
		} else {
			await client[botNum].reply({ from, quoted: message }, `You already searching for a partner!\nPlease wait for ${stopping.seconds}s`);
		}
	},
};
