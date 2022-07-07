import { skip } from "../../Utils/Anonymous/index.js";

export default {
	name: "skip",
	description: "Skip a partner",
	category: "Anonymous",
	usage: "!skip",
	aliases: ["skippartner"],
	cooldown: 5,
	limit: 1,
	async run({ from, message }, client) {
		const skipping = skip(from, 20, client, message);
		if (typeof skipping == "boolean" && !skipping) {
			return await client[botNum].reply({ from, quoted: message }, "You are not in a search!");
		}
		if (typeof skipping == "object" && skipping.partner2) {
			await client[botNum].reply(skipping.partner1, "You've skipped your partner!");
			await client[botNum].sendMessage(skipping.partner2, { text: "Your partner skipped the chat!" });
		} else {
			await client[botNum].reply({ from, quoted: message }, `You already searching for a partner!\nPlease wait for ${skipping.seconds}s`);
		}
	},
};
