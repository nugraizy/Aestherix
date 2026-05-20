import { cmdId } from '../../helper/modules/prefix.js';
import { googleImage, removeDuplicatesArray } from '../../utils/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'googleimage',
	minifiedDescription: 'Search Google Images',
	description: 'Search images from Google.',
	usage: '!googleimage `<query>`',
	aliases: ['gim', 'gis', 'image'],
	category: 'Search',
	cooldown: 5,
	limit: 4,
	status: 'disable',
	run: async ({ query, message, from }, client) => {
		if (!query) {
			return await client.reply(from, 'You must provide a query.', message);
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			const result = await googleImage(querie, 10);

			if (result?.error) {
				client.reply(from, result.error, message);
				continue;
			}

			await client.send(
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
										id: cmdId('googleimage', `next ${result[1]} ${JSON.stringify(result).replace(/\|/g, '')}`)
									}
								}
							: {}
					],
					footer: `1/${result.length}\nPowered by Hidden Finder`
				},
				{ quoted: message }
			);
		}
	}
});
