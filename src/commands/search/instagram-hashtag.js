import configuration from '../../helper/config/connect.js';
import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'ighashtag',
	minifiedDescription: 'Search Instagram Hashtag',
	description: 'Search for hashtag on Instagram.',
	usage: '!ighashtag `<keyword>`',
	aliases: ['ighash'],
	category: 'Search',
	cooldown: 8,
	limit: 4,
	status: 'enable',
	async run({ query, from, message, prefix }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!configuration.isInstagramInitiated) {
			return await client.reply(from, L.errors.instagramNotInit, message);
		}

		if (!query) {
			return client.reply(from, L.errors.noQuery, message);
		}

		const result = await configuration.instagram.search.hashtag(query);

		for (const tag in result) {
			if (result[tag].error) {
				await client.reply(from, result[tag].error, message);
				continue;
			}

			let capt = 'Instagram Hashtag Search'.formatHeaders();

			for (const post of result[tag].posts) {
				capt += `\n\nUsername : ${post.username}\n`;
				capt += `Likes : ${post.likeCount}\n`;
				capt += `Comments : ${post.commentCount}\n`;
				capt += `Source : ${post.source}\n`;
				capt += `Media Type : ${post.mediaType}\n`;
				capt += `Caption : ${post.caption}\n\n`;
			}

			const messageToQuoted = await client.send(
				from,
				{
					caption: capt.trim().formatForm(),
					image: { url: result[tag].thumbnail }
				},
				{ quoted: message }
			);

			await client.reply(
				from,
				`You can reply this message and type ${prefix}igp <number[1-${result[tag].posts.length}]>`,
				messageToQuoted
			);
		}
	}
});
