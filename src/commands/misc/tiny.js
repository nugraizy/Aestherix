import { isURL } from '../../utils/modules/index.js';
import { tiny } from '../../utils/shortener/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'tiny',
	description: 'URL shortener using tinyurl',
	usage: '!tiny <query>',
	category: 'Misc',
	aliases: ['tinyurl', 'urlshort', 'short', 'shorten'],
	limit: 2,
	cooldown: 3,
	status: 'enable',
	async run({ query, from, message, groupMetadata }, client) {
		if (!query) {
			return await client[botNum].reply('You must provide a URL', { from, quoted: message, groupMetadata });
		}

		if (!isURL(query)) {
			return await client[botNum].reply('Please specify a valid URL', { from, quoted: message, groupMetadata });
		}

		const urls = await tiny(query);

		await client[botNum].reply(urls, { from, quoted: message, groupMetadata });
	}
};
