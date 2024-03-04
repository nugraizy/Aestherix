import { removeDuplicatesArray } from '../../utils/modules/index.js';
import { arq } from '../../utils/arq/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'subreddit',
	minifiedDescription: 'Search Subreddit',
	description: 'Search Subreddit.',
	usage: '!subreddit <query>',
	category: 'Search',
	aliases: ['subr'],
	limit: 4,
	cooldown: 5,
	status: 'enable',
	async run({ query, from, message, groupMetadata }, client) {
		if (!query) {
			return await client.instance.reply('You must provide a query.', { from, quoted: message, groupMetadata });
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			const result = await arq.subreddits(querie.trim());

			if ('error' in result || !result.ok) {
				await client.instance.reply(JSON.stringify(result), { from, quoted: message, groupMetadata });
				continue;
			}

			await client.instance.send(
				from,
				{
					image: { url: result.result.url },
					caption:
						'Reddit'.formatHeaders() +
						`\n\nAuthor : ${result.result.author}
Title : ${result.result.title}`.formatForm()
					// templateButtons: [
					// 	{ urlButton: { displayText: 'Image Source', url: result.result.url } },
					// 	{ urlButton: { displayText: 'Post Source', url: result.result.postLink } },
					// 	{ quickReplyButton: { displayText: 'Next Post', id: `.subreddit ${querie}` } }
					// ],
					// footer:
				},
				{ groupMetadata }
			);
		}
	}
};
