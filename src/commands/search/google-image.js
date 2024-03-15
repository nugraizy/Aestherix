import { googleImage, removeDuplicatesArray } from '../../utils/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'googleimage',
	minifiedDescription: 'Search Google Images',
	description: 'Search images from Google.',
	usage: '!googleimage <query>',
	aliases: ['gim', 'gis', 'image'],
	category: 'Search',
	cooldown: 5,
	limit: 4,
	status: 'disable',
	run: async ({ query, message, from, type, args, groupMetadata }, client) => {
		if (!query) {
			return await client.instance.reply('You must provide a query.', { from, quoted: message, groupMetadata });
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			const result = await googleImage(querie, 10);

			if ('error' in result) {
				client.instance.reply(result.error, { from, quoted: message, groupMetadata });
				continue;
			}

			await client.instance.send(
				from,
				{
					image: { url: result[0] },
					caption: 'Google-it Images'.formatHeaders(),
					templateButtons: [
						{ urlButton: { displayText: 'Image Source', url: result[0] } },
						result.length !== 1
							? {
									quickReplyButton: {
										displayText: 'Next Image',
										id: `.googleimage next ${result[1]} ${JSON.stringify(result).replace(/\|/g, '')}`
									}
							  } /* eslint-disable-line */
							: {}
					],
					footer: `Void Bot     1/${result.length}\nPowered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪`
				},
				{ groupMetadata, quoted: message }
			);
		}
	}
};
