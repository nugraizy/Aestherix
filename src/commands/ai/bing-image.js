import { delay } from '@adiwajshing/baileys';
import { createImageBing } from '../../utils/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'bingimage',
	description: 'Create Image from text using Bing AI.',
	category: 'AI',
	usage: '!bingimage <query>',
	aliases: ['bingimg', 'imgbing'],
	cooldown: 3,
	limit: 5,
	status: 'enable',
	premium: true,
	async run({ query, from, message, groupMetadata }, client) {
		if (!query) {
			return client[botNum].reply('Please specify a query.', { from, quoted: message, groupMetadata });
		}

		const images = await createImageBing(query);

		for (const image of images) {
			await client[botNum].send(from, { image: { url: image } }, { quoted: message, groupMetadata });
			await delay(300);
		}
	}
};
