import { generateWAMessageFromContent } from "@adiwajshing/baileys";

export default {
	name: "test",
	description: "TEST",
	category: "Debugging",
	usage: "TEST",
	aliases: ["testt"],
	cooldown: 5,
	async run({ from, message }, client) {
		const messages = generateWAMessageFromContent("0@s.whatsapp.net", { reactionMessage: { reaction: { key: message.key, text: "Nice", unread: false }, key: message.key, text: "NANDA" } }, {});
		client[botNum].relayMessage(from, messages.message, { messageId: messages.key.id });
	},
};
