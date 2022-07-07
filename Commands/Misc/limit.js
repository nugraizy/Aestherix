import { checkLimit } from "../../Helper/Modules/index.js";

export default {
	name: "limit",
	description: "Check your daily limit.",
	category: "Misc",
	usage: "limit",
	aliases: ["limit", "lim"],
	cooldown: 3,
	limit: 0,
	async run({ from, sender }, client) {
		await client[botNum].reply(from, checkLimit(sender) ? `Your limit : ${checkLimit(sender).limit}\nType user : ${checkLimit(sender).type}` : "404"); // cma simple la, kalo mau update bole contribute.
	},
};
