import { fetchBUFFER, removeDuplicatesArray } from '../../utils/modules/index.js';
import { downloadArtworks, searchArtwork } from '../../utils/pixiv/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'pixivartwork',
	minifiedDescription: 'Search Pixiv Art',
	description: 'Search artworks from Pixiv.',
	usage: '!pixivartwork <query>',
	aliases: ['pixart', 'pixivart'],
	category: 'Search',
	limit: 4,
	cooldown: 8,
	status: 'enable',
	async run({ from, query, message, cmd }, client) {
		if (!query) {
			return await client.instance.reply('You must provide a query.', { from, quoted: message });
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			const data = await searchArtwork(querie.trim());
			const dataImage = await downloadArtworks(data[0].id);

			if (data?.error) {
				await client.instance.reply(`Failed while searching Pixiv artworks\n\n${data.error}\n${querie}`, {
					from,
					quoted: message
				});
				continue;
			}

			const container = [];
			let i = 0;
			const images = await fetchBUFFER(dataImage.url.original[0], {
				headers: { referer: `https://www.pixiv.net/ajax/illust/${dataImage.id}` }
			});

			await client.instance.send(
				from,
				{
					image: new Buffer.from(images, 'base64'),
					caption:
						'Pixiv Artwork Search'.formatHeaders() +
						`\n\nTitle : ${dataImage.title.capitalize()}
Author : ${dataImage.userName}
ID Artwork : ${dataImage.id}
ID Author : ${dataImage.userId}
Total Media : ${dataImage.pageCount}`.formatForm()
					// templateButtons: [
					// 	{ urlButton: { displayText: 'Artwork Source', url: `https://www.pixiv.net/en/artworks/${dataImage.id}` } }
					// ],
					// footer:
				},
				{ quoted: message }
			);

			for (let j = 0; j < dataImage.url.original.length; j++) {
				if (j != 0) {
					let images = await fetchBUFFER(dataImage.url.original[j], {
						headers: { referer: `https://www.pixiv.net/ajax/illust/${dataImage.id}` }
					});

					await client.instance.send(
						from,
						{
							image: new Buffer.from(images, 'base64'),
							caption: '\t',
							templateButtons: [
								{ urlButton: { displayText: 'Artwork Source', url: `https://www.pixiv.net/en/artworks/${dataImage.id}` } }
							],
							footer: '\t'
						},
						{ quoted: message }
					);

					images = null;
				}
			}

			for (const { id, title } of data.slice(1)) {
				container.push({
					rows: [{ title: `${i + 1}. ${title}`, rowId: `${cmd}dl https://www.pixiv.net/en/artworks/${id}` }],
					title: '\t'
				});
				i++;
			}

			await client.instance.send(
				from,
				{
					buttonText: 'Pixiv Artworks Search'.formatHeaders(),
					title: 'See other result',
					footer: 'choose one of the artworks inside of the list to download.',
					text: '\t',
					sections: container
				},
				{}
			);
		}
	}
};
