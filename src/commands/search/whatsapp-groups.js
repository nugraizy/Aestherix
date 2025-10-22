import { searchWAGroups } from '../../utils/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
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
		if (!query) {
			return await client.instance.reply(from, 'You must provide a query.', message);
		}

		const result = await searchWAGroups(query);

		if (result?.error) {
			return await client.instance.reply(from, result.error, message);
		}

		await client.instance.reply(
			from,
			`${'WhatsApp Public Groups'.formatHeaders()}

${result
	.map((v) => `Title : ${v.title}\nURL : ${v.url}`)
	.join('\n\n')
	.trim()}`.formatForm(),
			message
		);
	}
};
