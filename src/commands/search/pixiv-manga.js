import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { fetchBUFFER, removeDuplicatesArray } from '../../utils/modules/index.js';
import { downloadManga, searchManga } from '../../utils/pixiv/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'pixivmanga',
	minifiedDescription: 'Search Pixiv Manga',
	description: 'Search manga from Pixiv.',
	usage: '!pixivmanga `<query>`',
	aliases: ['pixmanga'],
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
			const data = await searchManga(querie.trim());
			const dataImage = await downloadManga(data[0].id);

			if (data?.error) {
				await client.reply(from, `${L.errors.failedSearch}\n\n${data.error}\n${querie}`, message);
				continue;
			}

			const container = [];
			let i = 0;
			const images = await fetchBUFFER(dataImage.url.original[0], {
				headers: { referer: `https://www.pixiv.net/ajax/manga/${dataImage.id}` }
			});

			await client.send(
				from,
				{
					image: Buffer.from(images, 'base64'),
					caption:
						Ls.titles.pixivMangaSearch.formatHeaders() +
						`\n\n${Ls.labels.title} : ${dataImage.title.capitalize()}
${Ls.labels.author} : ${dataImage.userName}
${Ls.labels.idArtwork} : ${dataImage.id}
${t(locale, 'search.labels.idAuthor', ['Author'])} : ${dataImage.userId}
${Ls.labels.totalMedia} : ${dataImage.pageCount}`.formatForm()
					// templateButtons: [
					// 	{ urlButton: { displayText: 'Manga Source', url: `https://www.pixiv.net/en/artworks/${dataImage.id}` } }
					// ],
					// footer:
				},
				{ quoted: message }
			);

			for (let j = 0; j < dataImage.url.original.length; j++) {
				if (j != 0) {
					const images = await fetchBUFFER(dataImage.url.original[j], {
						headers: { referer: `https://www.pixiv.net/ajax/manga/${dataImage.id}` }
					});

					await client.send(
						from,
						{
							image: Buffer.from(images, 'base64'),
							caption: '\t',
						templateButtons: [
							{ urlButton: { displayText: Ls.labels.mangaSource, url: `https://www.pixiv.net/en/artworks/${dataImage.id}` } }
						],
							footer: '\t'
						},
						{ quoted: message }
					);
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
					title: Ls.titles.pixivMangaSearch.formatHeaders(),
					text: '\t',
					footer: Ls.labels.chooseOne,
					buttonText: Ls.buttons.openList,
					sections: container
				},
				{}
			);
		}
	}
});
