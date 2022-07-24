import { generateWAMessageFromContent, generateMessageID } from "@adiwajshing/baileys";

export default {
	name: "polling",
	description: "Send polling to a message.",
	category: "Debugging",
	usage: "!polling <emoji>",
	aliases: ["poll", "pollwith"],
	cooldown: 5,
	limit:0,status: "enable",
	async run({ from, message, bodyQuoted, mediaData, query }, client, store) {
		const messages = generateWAMessageFromContent(
			from,
			{
				pollCreationMessage: {
					encKey: generateMessageID(),
					name: "Poll",
					selectableOptionsCount: 2,
					options: [],
				},
			},
			{},
		);
		await client[botNum].relayMessage(from, messages.message, { messageId: messages.key.id });
	},
};
