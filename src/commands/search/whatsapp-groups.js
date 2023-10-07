import { searchWAGroups } from '../../utils/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'findgroup',
	description: 'Search for public WhatsApp groups.',
	usage: '!findgroup <query>',
	aliases: ['gc', 'publicgc'],
	category: 'Search',
	cooldown: 4,
	limit: 3,
	status: 'enable',
	run: async ({ query, message, from, groupMetadata }, client) => {
		if (!query) {
			return client[botNum].reply('You must provide a query.', { from, quoted: message, groupMetadata });
		}

		const result = await searchWAGroups(query);

		if ('error' in result) {
			client[botNum].reply(result.error, { from, quoted: message, groupMetadata });
		}

		client[botNum].reply(
			`${'WhatsApp Public Groups'.formatHeaders()}

${result
	.map((v) => `Title : ${v.title}\nURL : ${v.url}`)
	.join('\n\n')
	.trim()}`,
			{ from, quoted: message, groupMetadata }
		);
	}
};
