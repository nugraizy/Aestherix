import { fetchBUFFER, removeDuplicatesArray } from '../../utils/modules/index.js';
import { downloadManga, searchManga } from '../../utils/pixiv/index.js';

export default {
	name: 'pixivmanga',
	description: 'Find manga from Pixiv',
	usage: '!pixivmanga <query>',
	aliases: ['pixmanga'],
	category: 'Search',
	limit: 4,
	cooldown: 8,
	status: 'enable',
	async run({ from, query, message, cmd, groupMetadata }, client) {
		if (!query) {
			return await client[botNum].reply({ groupMetadata, from, quoted: message }, 'You must provide a query.');
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			const data = await searchManga(querie.trim());
			const dataImage = await downloadManga(data[0].id);

			if ('error' in data) {
				await client[botNum].reply(
					{ groupMetadata, from, quoted: message },
					`Failed while searching Pixiv manga\n\n${data.error}\n${querie}`
				);
				continue;
			}

			const container = [];
			let i = 0;
			const images = await fetchBUFFER(dataImage.url.original[0], {
				headers: { referer: `https://www.pixiv.net/ajax/manga/${dataImage.id}` }
			});

			await client[botNum].send(
				from,
				{
					image: new Buffer.from(images, 'base64'),
					caption: 'Pixiv Manga Search'.formatHeaders(),
					templateButtons: [
						{ urlButton: { displayText: 'Manga Source', url: `https://www.pixiv.net/en/artworks/${dataImage.id}` } }
					],
					footer: `Title : ${dataImage.title.capitalize()}
Author : ${dataImage.userName}
ID Artwork : ${dataImage.id}
ID Author : ${dataImage.userId}
Total Media : ${dataImage.pageCount}`
				},
				{ groupMetadata, quoted: message }
			);

			for (let j = 0; j < dataImage.url.original.length; j++) {
				if (j != 0) {
					const images = await fetchBUFFER(dataImage.url.original[j], {
						headers: { referer: `https://www.pixiv.net/ajax/manga/${dataImage.id}` }
					});

					await client[botNum].send(
						from,
						{
							image: new Buffer.from(images, 'base64'),
							caption: '\t',
							templateButtons: [
								{ urlButton: { displayText: 'Manga Source', url: `https://www.pixiv.net/en/artworks/${dataImage.id}` } }
							],
							footer: '\t'
						},
						{ groupMetadata, quoted: message }
					);
				}
			}

			for (const { id, title } of data.slice(1)) {
				container.push({
					rows: [{ title: `${i + 1}. ${title}`, rowId: `${cmd}dl https://www.pixiv.net/en/artworks/${id}` }],
					title: '\t'
				});
				i++;
			}

			await client[botNum].send(
				from,
				{
					title: 'Pixiv Manga Search'.formatHeaders(),
					text: '\t',
					footer: 'choose one of the manga inside of the list to download.',
					buttonText: 'Open List',
					sections: container
				},
				{ groupMetadata }
			);
		}
	}
};
