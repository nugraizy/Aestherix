import { instagram } from '../../utils/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'ighashtag',
	minifiedDescription: 'Search Instagram Hashtag',
	description: 'Search for hashtag on Instagram.',
	usage: '!ighashtag <keyword>',
	aliases: ['ighash'],
	category: 'Search',
	cooldown: 8,
	limit: 4,
	status: 'enable',
	async run({ query, from, message, groupMetadata }, client) {
		if (!query) {
			return client.instance.reply('You must provide a query.', { from, quoted: message, groupMetadata });
		}

		const result = await instagram.search.hashtag(query);

		for (const tag in result) {
			if (result[tag].error) {
				await client.instance.reply(result[tag].error, { from, quoted: message, groupMetadata });
				continue;
			}

			let capt = 'Instagram Hashtag Search'.formatHeaders();

			for (const post of result[tag].posts) {
				capt += `\n\nUsername : ${post.username}\n`;
				capt += `Caption : ${post.caption}\n`;
				capt += `Likes : ${post.likeCount}\n`;
				capt += `Comments : ${post.commentCount}\n`;
				capt += `Link : ${post.link}\n`;
				capt += `Link : ${post.source}\n\n`;
			}

			await client.instance.send(
				from,
				{
					caption: 'Instagram Hashtag Search'.formatHeaders() + `\n\n${capt.trim()}`,
					image: { url: result[tag].thumbnail },
					footer: `Tot. Post : ${result[tag].totalPostFormatted}`
				},
				{ groupMetadata, quoted: message }
			);
		}
	}
};
