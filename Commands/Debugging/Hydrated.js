/* global botNum */
import { generateWAMessageFromContent } from '@adiwajshing/baileys';

import { readBuffer } from '../../Helper/index.js';

const randomString = (chars, length) => {
	let strings = '';

	for (let i = 0; i < length; i++) {
		strings += chars[Math.floor(Math.random() * chars.length)];
	}

	return strings;
};

export default {
	name: 'hydrated',
	description: 'Send hydrated image.',
	category: 'Debugging',
	usage: '!hydrated',
	aliases: ['hd'],
	cooldown: 5,
	limit: 0,
	status: 'enable',
	async run({ from }, client) {
		const image = await client[botNum].prepareMedia(readBuffer('./Media Files/blank.png'), 'imageMessage');
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
											displayText: 'Google',
										},
										index: 0,
									},
									{
										quickReplyButton: {
											id: '.menu',
											displayText: 'Open Menu',
										},
										index: 1,
									},
								],
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
											displayText: 'Google',
										},
										index: 0,
									},
									{
										quickReplyButton: {
											id: '.menu',
											displayText: 'Open Menu',
										},
										index: 1,
									},
								],
							},
						},
					},
				},
			},
			{},
		);

		await client[botNum].relayMessage(from, messages.message, { messageId: messages.key.id });
	},
};
