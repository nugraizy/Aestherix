import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
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
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const Ls = useLocale(locale, 'search');

		if (!query) {
			return await client.reply(from, L.errors.noQuery, message);
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
					caption: Ls.titles.googleImages.formatHeaders(),
					templateButtons: [
						{ urlButton: { displayText: Ls.buttons.imageSource, url: result[0] } },
						result.length !== 1
							? {
									quickReplyButton: {
										displayText: Ls.buttons.nextImage,
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
