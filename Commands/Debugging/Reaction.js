import { generateWAMessageFromContent } from "@adiwajshing/baileys";
import emojiReg from "emoji-regex";

export default {
	name: "reaction",
	description: "Send reaction to a message.",
	category: "Debugging",
	usage: "!reaction <emoji>",
	aliases: ["react", "reactwith"],
	cooldown: 5,
	limit: 0,
	status: "enable",
	async run({ from, message, bodyQuoted, mediaData, query, fromMe }, client, store) {
		if (bodyQuoted) {
			const emojis = query.match(emojiReg());
			if (emojis) {
				const messages = generateWAMessageFromContent(
					"0@s.whatsapp.net",
					{ reactionMessage: { key: { id: mediaData.stanzaId, remoteJid: from, fromMe, participant: mediaData.participant }, text: emojis[0] } },
					{
						quoted: message,
					},
				);
				client[botNum].relayMessage(from, messages.message, { messageId: messages.key.id });
			}
			return;
		}
		const emojis = query.match(emojiReg());
		if (emojis) {
			const chats = (await store.loadMessages(from)).map((m) => m.key);
			for (const chat of chats) {
				const messages = generateWAMessageFromContent("0@s.whatsapp.net", { reactionMessage: { key: chat, text: emojis[0] } }, {});
				client[botNum].relayMessage(from, messages.message, { messageId: messages.key.id });
			}
		}
	},
};
