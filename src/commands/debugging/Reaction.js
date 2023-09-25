import { generateMessageID, generateWAMessageFromContent } from '@adiwajshing/baileys';
import emojiReg from 'emoji-regex';
import { readFileSync } from 'fs';
import { ZERO, S_WHATSAPP_NET } from '../../helper/index.js';

import configuration from '../../helper/config/connect.js';

const DATABASE_PATH = `./src/media/connection_databases/${configuration.cli.input[0] ?? 'Session-debug'}.json`;

/**
 * @type {import('../types.js').Plugins}
 */
export default {
	name: 'reaction',
	description: 'Send reaction to a message.',
	category: 'Debugging',
	usage: '!reaction <emoji>',
	aliases: ['react', 'reactwith'],
	cooldown: 5,
	limit: 0,
	status: 'enable',
	async run({ from, message, bodyQuoted, mediaData, query, fromMe }, client, store) {
		if (bodyQuoted) {
			const emojis = query.match(emojiReg());

			if (emojis) {
				const messages = generateWAMessageFromContent(
					ZERO,
					{
						reactionMessage: {
							key: { id: mediaData.stanzaId, remoteJid: from, fromMe, participant: mediaData.participant },
							text: emojis[0]
						}
					},
					{
						quoted: message
					}
				);

				await client[botNum].relayMessage(from, messages.message, { messageId: messages.key.id });
			}

			return;
		}

		const emojis = query.match(emojiReg());

		if (emojis) {
			const chats = configuration.OPTIONS.json
				? JSON.parse(readFileSync(DATABASE_PATH)).messages[from].map((v) => v.key)
				: (await store.loadMessages(from)).map((v) => v.key);

			for (const chat of chats) {
				chat.participant = chat.fromMe ? `${botNum.split(':')[0]}${S_WHATSAPP_NET}` : chat.participant;

				await client[botNum].relayMessage(
					from,
					{ reactionMessage: { key: chat, text: emojis[0] } },
					{ messageId: generateMessageID() }
				);
			}
		}
	}
};
