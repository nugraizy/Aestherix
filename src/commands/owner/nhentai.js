import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { imageToPdf, mime, nhentai } from '../../utils/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'nhentai',
	minifiedDescription: 'Search Doujin from NHentai',
	description: 'Search Doujin from nhentai.net.',
	usage: '!nhentai `<query>`',
	aliases: ['nhent'],
	category: 'Owner',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	run: async ({ from, message, query }, client) => {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const Lo = useLocale(locale, 'owner');

		if (!query) {
			return client.reply(from, L.errors.noQuery, message);
		}

		const result = await nhentai(query);

		if (result?.error) {
			return client.reply(from, result.error, message);
		}

		const { artists, categories, images, languages, tags, titles, uploaded, groups, pages, parodies, totalFavorites } = result;

		const caption = `${Lo.titles.nhentai.formatHeaders()}
        
*${titles.english}*
#${query}
${Lo.labels.parodies} : ${parodies || 'N/A'}
${Lo.labels.tags} : ${tags.join(', ')}
${Lo.labels.artists} : ${artists.join(', ')}
${Lo.labels.groups} : ${groups.join(', ')}
${Lo.labels.languages} : ${languages.join(', ')}
${Lo.labels.categories} : ${categories.join(', ')}
${Lo.labels.pages} : ${pages}
${Lo.labels.uploadDate} : ${uploaded}
❤️ : ${totalFavorites}`;

		await client.reply(from, caption.formatForm(), message);

		const wait = await client.waitMessage(from, L.success.processing, message);

		const buffer = await imageToPdf(images.pages);

		await client.send(from, {
			document: Buffer.from(buffer, 'base64'),
			mimetype: mime('pdf'),
			fileName: titles.pretty + '.pdf'
		});

		await wait.update(Lo.labels.pdfsProcessed);
	}
});
