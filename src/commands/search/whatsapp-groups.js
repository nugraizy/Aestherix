import { searchWAGroups } from '../../utils/index.js';

export default {
	name: 'findgroup',
	description: 'Search for public WhatsApp groups.',
	usage: '!findgroup <query>',
	aliases: ['gc', 'publicgc'],
	category: 'Search',
	cooldown: 4,
	limit: 3,
	status: 'enable',
	run: async ({ query, message, from }, client) => {
		if (!query) {
			return client[botNum].reply({ from, quoted: message }, 'You must provide a query.');
		}

		const result = await searchWAGroups(query);

		if ('error' in result) {
			client[botNum].reply({ from, quoted: message }, result.error);
		}

		client[botNum].reply(
			{ from, quoted: message },
			`${'WhatsApp Public Groups'.formatHeaders()}

${result
	.map((v) => `Title : ${v.title}\nURL : ${v.url}`)
	.join('\n\n')
	.trim()}`
		);
	}
};
