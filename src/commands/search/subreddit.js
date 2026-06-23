import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
import { removeDuplicatesArray } from '../../utils/modules/index.js';
import { arq } from '../../utils/arq/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'subreddit',
	minifiedDescription: 'Search Subreddit',
	description: 'Search Subreddit.',
	usage: '!subreddit `<query>`',
	category: 'Search',
	aliases: ['subr'],
	limit: 4,
	cooldown: 5,
	status: 'enable',
	async run({ query, from, message }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const Ls = useLocale(locale, 'search');

		if (!query) {
			return await client.reply(from, L.errors.noQuery, message);
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			const result = await arq.subreddits(querie.trim());

			if (result?.error || !result.ok) {
				await client.reply(from, JSON.stringify(result), message);
				continue;
			}

			await client.send(
				from,
				{
					image: { url: result.result.url },
					caption:
						Ls.titles.reddit.formatHeaders() +
						`\n\nAuthor : ${result.result.author}
Title : ${result.result.title}`.formatForm()
					// templateButtons: [
					// 	{ urlButton: { displayText: 'Image Source', url: result.result.url } },
					// 	{ urlButton: { displayText: 'Post Source', url: result.result.postLink } },
					// 	{ quickReplyButton: { displayText: 'Next Post', id: `.subreddit ${querie}` } }
					// ],
					// footer:
				},
				{}
			);
		}
	}
});
