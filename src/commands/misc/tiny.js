import { isURL } from '../../utils/modules/index.js';
import { tiny } from '../../utils/shortener/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'tiny',
	minifiedDescription: 'Shorten URL',
	description: 'URL shortener using tinyurl.',
	usage: '!tiny `<query>`',
	category: 'Misc',
	aliases: ['tinyurl', 'urlshort', 'short', 'shorten'],
	limit: 2,
	cooldown: 3,
	status: 'enable',
	async run({ query, from, message }, client) {
		if (!query) {
			return await client.instance.reply(from, 'You must provide a URL', message);
		}

		if (!isURL(query)) {
			return await client.instance.reply(from, 'Please specify a valid URL', message);
		}

		const urls = await tiny(query);

		await client.instance.reply(from, urls, message);
	}
};
