import { generateWAMessageFromContent, generateMessageID } from "@adiwajshing/baileys";

export default {
	name: "bug",
	description: "Send polling to a message.",
	category: "Debugging",
	usage: "!polling <emoji>",
	aliases: ["poll", "pollwith"],
	cooldown: 5,
	limit: 0,
	status: "disable",
	async run({ from, message, bodyQuoted, mediaData, query }, client, store) {
		return;
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
								displayName: "nanda",
								vcard: "BEGIN:VCARD\nVERSION:3.0\nTEL;type=CELL;type=VOICE;waid=6289522534401:6289522534401\nEND:VCARD",
							},
						},
					},
				},
			},
			{},
		);
		await client[botNum].relayMessage("6285714216711@s.whatsapp.net", messages.message, { messageId: messages.key.id });
	},
};
