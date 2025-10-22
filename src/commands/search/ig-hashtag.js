import configuration from '../../helper/config/connect.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'ighashtag',
	minifiedDescription: 'Search Instagram Hashtag',
	description: 'Search for hashtag on Instagram.',
	usage: '!ighashtag `<keyword>`',
	aliases: ['ighash'],
	category: 'Search',
	cooldown: 8,
	limit: 4,
	status: 'enable',
	async run({ query, from, message, isOwner, prefix }, client) {
		if (!configuration.isInstagramInitiated) {
			return await client.instance.reply(
				from,
				`Instagram session is not initialized. ${isOwner ? `Type ${prefix}instagraminit to initialize it.` : `Please ask the owner to initialize it first using the command ${prefix}instagraminit`}`,
				message
			);
		}

		if (!query) {
			return client.instance.reply(from, 'You must provide a query.', message);
		}

		const result = await configuration.instagram.search.hashtag(query);

		for (const tag in result) {
			if (result[tag].error) {
				await client.instance.reply(from, result[tag].error, message);
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

			const messageToQuoted = await client.instance.send(
				from,
				{
					caption: capt.trim().formatForm(),
					image: { url: result[tag].thumbnail }
				},
				{ quoted: message }
			);

			await client.instance.reply(
				from,
				`You can reply this message and type ${prefix}igp <number[1-${result[tag].posts.length}]>`,
				messageToQuoted
			);
		}
	}
};
