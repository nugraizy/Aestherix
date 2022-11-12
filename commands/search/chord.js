/* global botNum */
import { chords } from '../../utils/index.js';

export default {
	name: 'chords',
	description: 'Find music chords.',
	usage: '!chords <query>',
	aliases: ['chord'],
	category: 'Search',
	cooldown: 3,
	limit: 2,
	status: 'enable',
	run: async ({ query, message, from }, client) => {
		if (!query) {
			return client[botNum].reply({ from, quoted: message }, 'You must provide a query.');
		}

		const result = await chords(query);

		if ('error' in result) {
			client[botNum].reply({ from, quoted: message }, result.error);
		}

		client[botNum].reply(
			{ from, quoted: message },
			`${'Chords'.formatHeaders()}

Title : ${result.title}

${result.chord.trim()}`,
		);
	},
};
