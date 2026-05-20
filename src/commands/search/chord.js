import { chords } from '../../utils/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
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
			return client.reply(from, 'You must provide a query.', message);
		}

		const result = await chords(query);

		if (result?.error) {
			return await client.reply(from, result.error, message);
		}

		return await client.reply(
			from,
			`${'Chords'.formatHeaders()}

Title : ${result.title}

${result.chord.trim()}`.formatForm(),
			message
		);
	}
});
