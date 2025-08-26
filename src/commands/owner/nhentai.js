import { nhentai, imageToPdf, mime } from '../../utils/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
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
			return client.instance.reply('You must provide a query.', { from, quoted: message });
		}

		const result = await nhentai(query);

		if (result?.error) {
			return client.instance.reply(result.error, { from, quoted: message });
		}

		const { artists, categories, images, languages, tags, title, totalPages, uploadDate, totalFavorites } = result;

		const caption = `${'NHentai'.formatHeaders()}
        
Title : ${title.pretty}
Upload Date: ${uploadDate}
Artists : ${artists.join(', ')}
Language : ${languages.join(', ')}
Tags : ${tags.join(', ')}
Categories : ${categories.join(', ')}
Tot. Favorites : ${totalFavorites}
Tot. Pages : ${totalPages}`;

		await client.instance.reply(caption.formatForm(), { from, quoted: message });

		await client.instance.reply('Processing PDFs', { from, quoted: message });

		const buffer = await imageToPdf(images);

		await client.instance.send(from, {
			document: Buffer.from(buffer, 'base64'),
			mimetype: mime('pdf'),
			fileName: title.pretty + '.pdf'
		});
	}
};
