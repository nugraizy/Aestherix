import { generateWAMessageFromContent } from "@adiwajshing/baileys";

export default {
	name: "list",
	description: "Send list message.",
	category: "Debugging",
	usage: "!list",
	aliases: ["lst"],
	cooldown: 5,
	async run({ from, message, bodyQuoted, mediaData, query }, client, store) {
		const messages = generateWAMessageFromContent(
			from,
			{
				listMessage: {
					buttonText: "Void Bot",
					description: "List Message",
					listType: 1,
					footerText: "Void Bot",
					sections: [
						{
							rows: [
								{
									title: "This is a Test",
									rowId: `.menu`,
								},
							],
							title: "VOID BOT | Hello World!",
						},
					],
				},
			},
			{},
		);
		await client[botNum].relayMessage(from, messages.message, { messageId: messages.key.id });
	},
};
