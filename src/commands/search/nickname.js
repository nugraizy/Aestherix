import { nickname } from '../../utils/index.js';

/**
 * @type {import('../types.js').Plugins}
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
			return client[botNum].reply({ groupMetadata, from, quoted: message }, 'You must provide a query.');
		}

		const result = await nickname(query);

		if ('error' in result) {
			client[botNum].reply({ groupMetadata, from, quoted: message }, result.error);
		}

		client[botNum].reply(
			{ from, quoted: message },
			`${'Nickfinder'.formatHeaders()}

${result.join('\n').trim()}`
		);
	}
};
