import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { isURL } from '../../utils/modules/index.js';
import { tiny } from '../../utils/shortener/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
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
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!query) {
			return await client.reply(from, L.errors.noUrl, message);
		}

		if (!isURL(query)) {
			return await client.reply(from, L.errors.invalidUrl, message);
		}

		const urls = await tiny(query);

		await client.reply(from, urls, message);
	}
});
