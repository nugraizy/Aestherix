/* global botNum */
import { generateWAMessageFromContent } from '@adiwajshing/baileys';

import { readBuffer } from '../../helper/index.js';

export default {
	name: 'interactive',
	description: 'Send interactive.',
	category: 'Debugging',
	usage: '!interactive',
	aliases: ['inter'],
	cooldown: 5,
	limit: 0,
	status: 'enable',
	async run({ from }, client) {
		const image = await client[botNum].prepareMedia(readBuffer('./media_files/blank.png'), 'imageMessage');

		const messages = generateWAMessageFromContent(
			from,
			{
				interactiveMessage: {
					header: {
						title: 'Nanda title',
						subtitle: 'Nanda subtitle',
						hasMediaAttachment: true,
						imageMessage: image.message.imageMessage,
					},
					body: {
						text: 'Nanda text',
					},
					footer: {
						text: 'Nanda footer',
					},
					nativeFlowMessage: {
						buttons: [
							{
								name: 'Nanda button name',
								buttonParamsJson: 'Nanda button params json',
							},
						],
					},
				},
			},
			{},
		);

		await client[botNum].relayMessage(from, messages.message, { messageId: messages.key.id });
	},
};
