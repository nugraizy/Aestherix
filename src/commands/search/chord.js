import { chords } from '../../utils/index.js';

/**
 * @type {import('../types.js').Plugins}
 */
export default {
	name: 'chords',
	description: 'Find music chords.',
	usage: '!chords <query>',
	aliases: ['chord'],
	category: 'Search',
	cooldown: 3,
	limit: 2,
	status: 'enable',
	run: async ({ query, message, from, groupMetadata }, client) => {
		if (!query) {
			return client[botNum].reply({ groupMetadata, from, quoted: message }, 'You must provide a query.');
		}

		const result = await chords(query);

		if ('error' in result) {
			client[botNum].reply({ groupMetadata, from, quoted: message }, result.error);
		}

		client[botNum].reply(
			{ from, quoted: message },
			`${'Chords'.formatHeaders()}

Title : ${result.title}

${result.chord.trim()}`
		);
	}
};
