/* global botNum */
import { removeDuplicatesArray } from '../../Helper/Modules/index.js';
import { arq } from '../../Utils/ARQ/index.js';

export default {
	name: 'subreddit',
	description: 'Search Subreddit',
	usage: '!subreddit <query>',
	category: 'Search',
	aliases: ['subr'],
	limit: 4,
	cooldown: 5,
	status: 'enable',
	async run({ query, from, message }, client) {
		if (!query) {
			return await client[botNum].reply({ from, quoted: message }, 'You must provide a query.');
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			const result = await arq.subreddits(querie.trim());

			if ('error' in result || !result.ok) {
				await client[botNum].reply({ from, quoted: message }, JSON.stringify(result));
				continue;
			}

			await client[botNum].sendMessage(from, {
				image: { url: result.result.url },
				caption: '``` • Reddit ```',
				templateButtons: [
					{ urlButton: { displayText: 'Image Source', url: result.result.url } },
					{ urlButton: { displayText: 'Post Source', url: result.result.postLink } },
					{ quickReplyButton: { displayText: 'Next Post', id: `.subreddit ${querie}` } },
				],
				footer: `Author : ${result.result.author}
Title : ${result.result.title}
                    
Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪`,
			});
		}
	},
};
