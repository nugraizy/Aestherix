/* global botNum */
import { removeDuplicatesArray } from '../../helper/index.js';
import { searchBandcamp } from '../../utils/bandcamp/index.js';

export default {
	name: 'bandcamp',
	description: 'Search Musics from Bandcamp',
	category: 'Search',
	usage: '!bandcamp <query>',
	aliases: ['bcamp', 'bandc'],
	cooldown: 5,
	limit: 5,
	status: 'enable',
	async run({ from, query, message }, client) {
		if (!query) {
			return await client[botNum].reply({ from, quoted: message }, 'You must provide a query.');
		}

		query = query.split(',');
		query = removeDuplicatesArray(query);

		for (const queries of query) {
			const result = await searchBandcamp(queries);

			if ('error' in result) {
				await client[botNum].reply({ from, quoted: message }, result.error);
				continue;
			}

			const { bandId, bandName, title, albumName, albumId, urlBase, thumbnailUrl } = result[0];

			await client[botNum].sendMessage(from, {
				image: { url: thumbnailUrl },
				caption: '``` • Bandcamp ```',
				footer: `Band Name : ${bandName}
Band ID : ${bandId}
Title : ${title}
Album : ${albumName || 'N/A'}
Album ID : ${albumId || 'N/A'}`,
				templateButtons: [
					{ urlButton: { displayText: 'Image Source', url: thumbnailUrl } },
					{ urlButton: { displayText: 'Stream Here', url: urlBase } },
					{ quickReplyButton: { displayText: 'Download', id: `.bandcampdl ${urlBase}` } },
				],
			});
			await client[botNum].sendMessage(from, {
				buttonText: 'Open List',
				text: '\t',
				footer: '```Looking for some more? Choose between these options.```',
				title: '``` • Bandcamp Tracks```',
				sections: result.slice(1).map((v) => ({ rows: [{ title: `MP3 | ${v.title}`, rowId: `.bandcampdl ${v.urlBase}` }], title: `${v.bandName} - ${v.title}` })),
			});
		}
	},
};
