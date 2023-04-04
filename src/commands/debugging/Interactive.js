import { generateWAMessageFromContent } from '@adiwajshing/baileys';
import fs from 'fs-extra';

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
		const image = await client[botNum].prepareMedia(await fs.readFile('./src/media/blank.png'), 'imageMessage');

		const messages = generateWAMessageFromContent(
			from,
			{
				interactiveMessage: {
					header: {
						title: 'Nanda title',
						subtitle: 'Nanda subtitle',
						hasMediaAttachment: true,
						imageMessage: image.message.imageMessage
					},
					body: {
						text: 'Nanda text'
					},
					footer: {
						text: 'Nanda footer'
					},
					nativeFlowMessage: {
						buttons: [
							{
								name: 'Nanda button name',
								buttonParamsJson: 'Nanda button params json'
							}
						]
					}
				}
			},
			{}
		);

		await client[botNum].relayMessage(from, messages.message, { messageId: messages.key.id });
	}
};
