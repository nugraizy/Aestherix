import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { searchWAGroups } from '../../utils/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'findgroup',
	minifiedDescription: 'Public Group',
	description: 'Search for public WhatsApp groups.',
	usage: '!findgroup `<query>`',
	aliases: ['gc', 'publicgc'],
	category: 'Search',
	cooldown: 4,
	limit: 3,
	status: 'enable',
	run: async ({ query, message, from }, client) => {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!query) {
			return await client.reply(from, L.errors.noQuery, message);
		}

		const result = await searchWAGroups(query);

		if (result?.error) {
			return await client.reply(from, result.error, message);
		}

		await client.reply(
			from,
			`${'WhatsApp Public Groups'.formatHeaders()}

${result
	.map((v) => `Title : ${v.title}\nURL : ${v.url}`)
	.join('\n\n')
	.trim()}`.formatForm(),
			message
		);
	}
});
