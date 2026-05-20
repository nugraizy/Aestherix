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
		if (!query) {
			return client.reply(from, 'You must provide a query.', message);
		}

		const result = await nhentai(query);

		if (result?.error) {
			return client.reply(from, result.error, message);
		}

		const { artists, categories, images, languages, tags, titles, uploaded, groups, pages, parodies, totalFavorites } = result;

		const caption = `${'NHentai'.formatHeaders()}
        
*${titles.english}*
#${query}
Parodies : ${parodies || 'N/A'}
Tags : ${tags.join(', ')}
Artists : ${artists.join(', ')}
Groups : ${groups.join(', ')}
Languages : ${languages.join(', ')}
Categories : ${categories.join(', ')}
Pages : ${pages}
Uploaded : ${uploaded}
❤️ : ${totalFavorites}`;

		await client.reply(from, caption.formatForm(), message);

		const wait = await client.waitMessage(from, 'Processing PDFs', message);

		const buffer = await imageToPdf(images.pages);

		await client.send(from, {
			document: Buffer.from(buffer, 'base64'),
			mimetype: mime('pdf'),
			fileName: titles.pretty + '.pdf'
		});

		await wait.update('PDFs successfully processed.');
	}
});
