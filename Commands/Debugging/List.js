import { generateWAMessageFromContent } from "@adiwajshing/baileys";

export default {
	name: "list",
	description: "Send list message.",
	category: "Debugging",
	usage: "!list",
	aliases: ["lst"],
	cooldown: 5,
	limit: 0,
	status: "enable",
	async run({ from, query }, client, store) {
		const row = Array(Number(query)).fill({
			rows: [
				{
					title: "🔥",
					rowId: `.menu`,
				},
			],
			title: "VOID BOT | Hello World!",
		});
		const messages = generateWAMessageFromContent(
			from,
			{
				listMessage: {
					buttonText: "Void Bot",
					description: "List Message",
					listType: 1,
					footerText: "Void Bot",
					sections: row,
				},
			},
			{},
		);
		await client[botNum].relayMessage(from, messages.message, { messageId: messages.key.id });
	},
};
