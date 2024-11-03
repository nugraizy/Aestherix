import { chords } from '../../utils/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'chords',
	minifiedDescription: 'Search Chords',
	description: 'Search music chords.',
	usage: '!chords <query>',
	aliases: ['chord'],
	category: 'Search',
	cooldown: 3,
	limit: 2,
	status: 'enable',
	run: async ({ query, message, from }, client) => {
		if (!query) {
			return client.instance.reply('You must provide a query.', { from, quoted: message });
		}

		const result = await chords(query);

		if ('error' in result) {
			client.instance.reply(result.error, { from, quoted: message });
		}

		client.instance.reply(
			`${'Chords'.formatHeaders()}

Title : ${result.title}

${result.chord.trim()}`.formatForm(),
			{ from, quoted: message }
		);
	}
};
