import { isURL } from '../../utils/modules/index.js';
import { tiny } from '../../utils/shortener/index.js';

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
			return await client[botNum].reply({ groupMetadata, from, quoted: message }, 'You must provide a URL');
		}

		if (!isURL(query)) {
			return await client[botNum].reply({ groupMetadata, from, quoted: message }, 'Please specify a valid URL');
		}

		const urls = await tiny(query);

		await client[botNum].reply({ groupMetadata, from, quoted: message }, urls);
	}
};
