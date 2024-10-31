import { generateWAMessageFromContent } from 'baileys';
import fs from 'fs-extra';

const randomString = (chars, length) => {
	let strings = '';

	for (let i = 0; i < length; i++) {
		strings += chars[Math.floor(Math.random() * chars.length)];
	}

	return strings;
};

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'hydrated',
	description: 'Send hydrated image.',
	category: 'Debugging',
	usage: '!hydrated',
	aliases: ['hd'],
	cooldown: 5,
	limit: 0,
	status: 'disable',
	async run({ from, groupMetadata }, client) {
		const image = await client.instance.prepareMedia(await fs.readFile('./src/media/blank.png'), 'imageMessage');
		const string1 = randomString('0123456789', 16);
		const messages = generateWAMessageFromContent(
			from,
			{
				viewOnceMessage: {
					message: {
						templateMessage: {
							hydratedFourRowTemplate: {
								imageMessage: image.message.imageMessage,
								hydratedContentText: 'hydratedContentText',
								hydratedFooterText: 'hydratedFooterText',
								templateId: string1,
								hydratedButtons: [
									{
										urlButton: {
											url: 'https://google.com/',
											displayText: 'Google'
										},
										index: 0
									},
									{
										quickReplyButton: {
											id: '.menu',
											displayText: 'Open Menu'
										},
										index: 1
									}
								]
							},
							hydratedTemplate: {
								imageMessage: image.message.imageMessage,
								hydratedContentText: 'hydratedContentText',
								hydratedFooterText: 'hydratedFooterText',
								templateId: string1,
								hydratedButtons: [
									{
										urlButton: {
											url: 'https://google.com/',
											displayText: 'Google'
										},
										index: 0
									},
									{
										quickReplyButton: {
											id: '.menu',
											displayText: 'Open Menu'
										},
										index: 1
									}
								]
							}
						}
					}
				}
			},
			{}
		);

		await client.instance.relayMessage(from, messages.message, {
			messageId: messages.key.id,
			cachedGroupMetadata: () => groupMetadata
		});
	}
};
