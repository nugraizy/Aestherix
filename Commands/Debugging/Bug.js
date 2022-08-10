import { generateMessageID, generateWAMessageFromContent } from "@adiwajshing/baileys";

export default {
	name: "bug",
	description: "Send bug.",
	category: "Debugging",
	usage: "!bug",
	aliases: ["bug"],
	cooldown: 5,
	limit: 0,
	status: "enable",
	async run({ from, message, bodyQuoted, mediaData, query }, client, store) {
		return;
	},
};
