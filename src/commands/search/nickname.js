import { nickname } from '../../utils/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'nickname',
	description: 'Find nickname.',
	usage: '!nickname <query>',
	aliases: ['nickfind'],
	category: 'Search',
	cooldown: 2,
	limit: 3,
	status: 'enable',
	run: async ({ query, message, from, groupMetadata }, client) => {
		if (!query) {
			return client[botNum].reply('You must provide a query.', { from, quoted: message, groupMetadata });
		}

		const result = await nickname(query);

		if ('error' in result) {
			client[botNum].reply(result.error, { from, quoted: message, groupMetadata });
		}

		client[botNum].reply(
			`${'Nickfinder'.formatHeaders()}

${result.join('\n').trim()}`,
			{ from, quoted: message, groupMetadata }
		);
	}
};
