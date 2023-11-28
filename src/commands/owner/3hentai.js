import { _3hentai, img2pdf, mime } from '../../utils/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: '3hentai',
	minifiedDescription: 'Search Doujin',
	description: 'Search Doujin from 3hentai.net.',
	usage: '!3hentai <query>',
	aliases: ['3hent'],
	category: 'Owner',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	run: async ({ from, message, query, sender, groupMetadata }, client) => {
		if (!query) {
			return client.instance.reply('You must provide a query.', { from, quoted: message, groupMetadata });
		}

		const result = await _3hentai(query);

		if ('error' in result) {
			return client.instance.reply(result.error, { from, quoted: message, groupMetadata });
		}

		const { artists, categories, images, language, tags, title, totalPages, uploadDate } = result;

		const buffer = await img2pdf(images, sender);
		const caption = `${'3Hentai'.formatHeaders()}
        
Title : ${title}
Upload Date: ${uploadDate}
Tags : ${tags.join(', ')}
Artists : ${artists.join(', ')}
Language : ${language.join(', ')}
Categories : ${categories.join(', ')}
Tot. Pages : ${totalPages}`;

		await client.instance.reply(caption, { from, quoted: message, groupMetadata });
		await client.instance.send(from, {
			document: Buffer.from(buffer, 'base64'),
			mimetype: mime('pdf'),
			fileName: title
		});
	}
};
