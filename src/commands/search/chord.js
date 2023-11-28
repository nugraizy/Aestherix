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
	run: async ({ query, message, from, groupMetadata }, client) => {
		if (!query) {
			return client.instance.reply('You must provide a query.', { from, quoted: message, groupMetadata });
		}

		const result = await chords(query);

		if ('error' in result) {
			client.instance.reply(result.error, { from, quoted: message, groupMetadata });
		}

		client.instance.reply(
			`${'Chords'.formatHeaders()}

Title : ${result.title}

${result.chord.trim()}`,
			{ from, quoted: message, groupMetadata }
		);
	}
};
