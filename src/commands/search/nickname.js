import { nickname } from '../../utils/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'nickname',
	minifiedDescription: 'Search Nickname',
	description: 'Find nickname.',
	usage: '!nickname <query>',
	aliases: ['nickfind'],
	category: 'Search',
	cooldown: 2,
	limit: 3,
	status: 'enable',
	run: async ({ query, message, from, groupMetadata }, client) => {
		if (!query) {
			return client.instance.reply('You must provide a query.', { from, quoted: message, groupMetadata });
		}

		const result = await nickname(query);

		if ('error' in result) {
			client.instance.reply(result.error, { from, quoted: message, groupMetadata });
		}

		client.instance.reply(
			`${'Nickfinder'.formatHeaders()}

${result.join('\n').trim()}`,
			{ from, quoted: message, groupMetadata }
		);
	}
};
