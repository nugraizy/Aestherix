import { checkAfk, getAfk, setAfk } from "../../Helper/Misc/AFK/afk.js";

export default {
	name: "afk",
	description: "Going away from keyboard.",
	category: "Misc",
	usage: "!afk <reason|no reason>",
	aliases: ["away", "idle"],
	limit: 2,
	cooldown: 3,
	async run({ message, from, query, isGroup, sender }, client) {
		if (!isGroup) return client[botNum].reply({ from, quoted: message }, "This command is only available in group chat.");
		setAfk(sender, from, query);
		await client[botNum].sendMessage(from, { text: `@${sender.split("@")[0]} is now AFK.`, contextInfo: { mentionedJid: [sender] } }, { quoted: message });
	},
};
