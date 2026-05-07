import { generateWAMessageFromContent } from 'baileys';
import emojiReg from 'emoji-regex';
import { ZERO } from '../../helper/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'reaction',
	description: 'Send reaction to a message.',
	category: 'Debugging',
	usage: '!reaction `<emoji>`',
	aliases: ['react', 'reactwith'],
	cooldown: 5,
	limit: 0,
	status: 'disable',
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
						quoted: message,
						messageId: client.instance.generateMessageID()
					}
				);

				await client.instance.relay(from, messages.message, { messageId: messages.key.id });
			}

			return;
		}

		const emojis = query.match(emojiReg());

		if (emojis) {
			const chats = store.loadMessages(from).map((v) => v.key);

			for (const chat of chats) {
				chat.participant = chat.fromMe ? client.instance.decodeJid(instance) : chat.participant;

				await client.instance.relay(from, { reactionMessage: { key: chat, text: emojis[0] } });
			}
		}
	}
};
