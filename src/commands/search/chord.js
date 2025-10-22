import { chords } from '../../utils/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'chords',
	minifiedDescription: 'Search Chords',
	description: 'Search music chords.',
	usage: '!chords `<query>`',
	aliases: ['chord'],
	category: 'Search',
	cooldown: 3,
	limit: 2,
	status: 'enable',
	run: async ({ query, message, from }, client) => {
		if (!query) {
			return client.instance.reply(from, 'You must provide a query.', message);
		}

		const result = await chords(query);

		if (result?.error) {
			return await client.instance.reply(from, result.error, message);
		}

		return await client.instance.reply(
			from,
			`${'Chords'.formatHeaders()}

Title : ${result.title}

${result.chord.trim()}`.formatForm(),
			message
		);
	}
};
