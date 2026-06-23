import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { fetchBUFFER, removeDuplicatesArray } from '../../utils/modules/index.js';
import { downloadArtworks, searchArtwork } from '../../utils/pixiv/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'pixivartwork',
	minifiedDescription: 'Search Pixiv Art',
	description: 'Search artworks from Pixiv.',
	usage: '!pixivartwork `<query>`',
	aliases: ['pixart', 'pixivart'],
	category: 'Search',
	limit: 4,
	cooldown: 8,
	status: 'enable',
	async run({ from, query, message, cmd }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const Ls = useLocale(locale, 'search');

		if (!query) {
			return await client.reply(from, L.errors.noQuery, message);
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			const data = await searchArtwork(querie.trim());
			const dataImage = await downloadArtworks(data[0].id);

			if (data?.error) {
				await client.reply(from, `${L.errors.failedSearch}\n\n${data.error}\n${querie}`, message);
				continue;
			}

			const container = [];
			let i = 0;
			const images = await fetchBUFFER(dataImage.url.original[0], {
				headers: { referer: `https://www.pixiv.net/ajax/illust/${dataImage.id}` }
			});

			await client.send(
				from,
				{
					image: Buffer.from(images, 'base64'),
					caption:
						Ls.titles.pixivArtworkSearch.formatHeaders() +
						`\n\n${Ls.labels.title} : ${dataImage.title.capitalize()}
${Ls.labels.author} : ${dataImage.userName}
${Ls.labels.idArtwork} : ${dataImage.id}
${t(locale, 'search.labels.idAuthor', ['Author'])} : ${dataImage.userId}
${Ls.labels.totalMedia} : ${dataImage.pageCount}`.formatForm()
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

					await client.send(
						from,
						{
							image: Buffer.from(images, 'base64'),
							caption: '\t',
						templateButtons: [
							{ urlButton: { displayText: Ls.labels.artworkSource, url: `https://www.pixiv.net/en/artworks/${dataImage.id}` } }
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
					rows: [{ title: `${i + 1}. ${title}`, rowId: cmdId(cmd, `dl https://www.pixiv.net/en/artworks/${id}`) }],
					title: '\t'
				});
				i++;
			}

			await client.send(
				from,
				{
					buttonText: Ls.titles.pixivArtworkSearch.formatHeaders(),
					title: Ls.labels.seeOtherResult,
					footer: Ls.labels.chooseOne,
					text: '\t',
					sections: container
				},
				{}
			);
		}
	}
});
