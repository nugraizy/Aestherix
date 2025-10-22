import { nickname } from '../../utils/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'nickname',
	minifiedDescription: 'Search Nickname',
	description: 'Find nickname.',
	usage: '!nickname `<query>`',
	aliases: ['nickfind'],
	category: 'Search',
	cooldown: 2,
	limit: 3,
	status: 'enable',
	run: async ({ query, message, from }, client) => {
		if (!query) {
			return client.instance.reply(from, 'You must provide a query.', message);
		}

		const result = await nickname(query);

		if (result?.error) {
			client.instance.reply(from, result.error, message);
		}

		client.instance.reply(
			from,
			`${'Nickfinder'.formatHeaders()}

${result.join('\n').trim()}`,
			message
		);
	}
};
