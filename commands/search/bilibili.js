/* global botNum */
import { getFilesizeFromBytes, numberWithCommas, delay, removeDuplicatesArray } from '../../helper/modules/index.js';
import { bilibiliSearchCOM } from '../../utils/bilibili/index.js';

export default {
	name: 'bilibili',
	description: 'Search videos from Bilibili',
	usage: '!bilibili <query>',
	category: 'Search',
	aliases: ['bili', 'bli'],
	limit: 4,
	cooldown: 7,
	status: 'enable',
	async run({ query, from, message }, client) {
		if (!query) {
			return await client[botNum].reply({ from, quoted: message }, 'You must provide a query.');
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			const videos = await bilibiliSearchCOM(querie.trim());

			if ('error' in videos) {
				await client[botNum].reply({ from, quoted: message }, `${videos.error}\n${videos.cusMessage}`);
				continue;
			}

			let i = 0;

			for (const { title, author, authorId, like, share, duration, favorite, view, thumbnail, description, originalVideoLink, downloadLink, size } of videos) {
				if (i == 3) {
					break;
				}

				await delay(300);
				await client[botNum].sendMessage(
					from,
					{
						image: { url: thumbnail },
						caption: '``` • Bilibili ```',
						templateButtons: [
							{ urlButton: { displayText: `Download Here ${getFilesizeFromBytes(size)}`, url: downloadLink } },
							{ urlButton: { displayText: 'Stream Here', url: originalVideoLink } },
						],
						footer: `Title : ${title}
Author : ${author}
Author ID : ${authorId}
Like : ${numberWithCommas(like)}
Share : ${numberWithCommas(share)}
Favorite : ${numberWithCommas(favorite)}
Favorite : ${numberWithCommas(view)}
Duration : ${duration}
Description : ${description}`,
					},
					{ quoted: message },
				);
				i++;
			}
		}
	},
};
