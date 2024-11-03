import { searchWAGroups } from '../../utils/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'findgroup',
	minifiedDescription: 'Public Group',
	description: 'Search for public WhatsApp groups.',
	usage: '!findgroup <query>',
	aliases: ['gc', 'publicgc'],
	category: 'Search',
	cooldown: 4,
	limit: 3,
	status: 'enable',
	run: async ({ query, message, from }, client) => {
		if (!query) {
			return client.instance.reply('You must provide a query.', { from, quoted: message });
		}

		const result = await searchWAGroups(query);

		if ('error' in result) {
			client.instance.reply(result.error, { from, quoted: message });
		}

		client.instance.reply(
			`${'WhatsApp Public Groups'.formatHeaders()}

${result
	.map((v) => `Title : ${v.title}\nURL : ${v.url}`)
	.join('\n\n')
	.trim()}`.formatForm(),
			{ from, quoted: message }
		);
	}
};
