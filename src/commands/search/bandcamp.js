import { cmdId } from '../../helper/modules/prefix.js';
import { searchBandcamp } from '../../utils/bandcamp/index.js';
import { removeDuplicatesArray } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'bandcamp',
	minifiedDescription: 'Search Bandcamp',
	description: 'Search Musics from Bandcamp.',
	category: 'Search',
	usage: '!bandcamp `<query>`',
	aliases: ['bcamp', 'bandc'],
	cooldown: 5,
	limit: 5,
	status: 'enable',
	async run({ from, query, message, prefix }, client) {
		if (!query) {
			return await client.reply(from, 'You must provide a query.', message);
		}

		query = query.split(',');
		query = removeDuplicatesArray(query);

		for (const queries of query) {
			const result = await searchBandcamp(queries);

			if (result?.error) {
				await client.reply(from, result.error, message);
				continue;
			}

			// const { bandId, bandName, title, albumName, albumId, urlBase, thumbnailUrl } = result[0];

			await client.send(
				from,
				{
					image: { url: result[0].thumbnailUrl },
					caption:
						'Bandcamp'.formatHeaders() +
						`\n\n${result
							.map(({ bandName, bandId, title, albumName, albumId }) => {
								return `Band Name : ${bandName}
Band ID : ${bandId}
Title : ${title}
Album : ${albumName || 'n/a'}
Album ID : ${albumId || 'n/a'}`;
							})
							.join('\n\n')}`
							.trimEnd()
							.formatForm()
					// 					footer: `Band Name : ${bandName}
					// Band ID : ${bandId}
					// Title : ${title}
					// Album : ${albumName || 'n/a'}
					// Album ID : ${albumId || 'n/a'}`,
					// templateButtons: [
					// 	{ urlButton: { displayText: 'Image Source', url: thumbnailUrl } },
					// 	{ urlButton: { displayText: 'Stream Here', url: urlBase } },
					// 	{ quickReplyButton: { displayText: 'Download', id: `.bandcampdl ${urlBase}` } }
					// ]
				},
				{}
			);
			await client.send(
				from,
				{
					buttonText: 'Open List',
					text: '\t',
					footer: '```Looking for some more? Choose between these options.```',
					title: 'Bandcamp Tracks'.formatHeaders(),
					sections: result.slice(1).map((v) => ({
						rows: [{ title: `MP3 | ${v.title}`, rowId: cmdId('bandcampdl', v.urlBase, { prefix }) }],
						title: `${v.bandName} - ${v.title}`
					}))
				},
				{}
			);
		}
	}
});
