import { delay } from 'baileys';
import { createImageBing } from '../../utils/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'bingimage',
	minifiedDescription: 'Create Image',
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
			return client.instance.reply('Please specify a query.', { from, quoted: message, groupMetadata });
		}

		const images = await createImageBing(query);

		if (!images?.length) {
			return client.instance.reply('No images found.', { from, quoted: message, groupMetadata });
		}

		for (const image of images) {
			await client.instance.send(from, { image: { url: image } }, { quoted: message, groupMetadata });
			await delay(300);
		}
	}
};
