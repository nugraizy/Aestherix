import { generateWAMessageFromContent } from "@adiwajshing/baileys";

export default {
	name: "test",
	description: "TEST",
	category: "Debugging",
	usage: "TEST",
	aliases: ["testt"],
	cooldown: 5,
	async run({ from, message }, client) {
		const messages = generateWAMessageFromContent("0@s.whatsapp.net", { reactionMessage: { key: message.key, text: "😮" } }, {});
		client[botNum].relayMessage(from, messages.message, { messageId: messages.key.id });
	},
};
