import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { _3hentai, imageToPdf, mime } from '../../utils/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: '3hentai',
	minifiedDescription: 'Search Doujin',
	description: 'Search Doujin from 3hentai.net.',
	usage: '!3hentai `<query>`',
	aliases: ['3hent'],
	category: 'Owner',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	run: async ({ from, message, query }, client) => {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!query) {
			return client.reply(from, L.errors.noQuery, message);
		}

		const result = await _3hentai(query);

		if (result?.error) {
			return client.reply(from, result.error, message);
		}

		const { artists, categories, images, language, tags, title, totalPages, uploadDate } = result;

		const caption = `${'3Hentai'.formatHeaders()}
        
Title : ${title}
Upload Date: ${uploadDate}
Tags : ${tags.join(', ')}
Artists : ${artists.join(', ')}
Language : ${language.join(', ')}
Categories : ${categories.join(', ')}
Tot. Pages : ${totalPages}`;

		await client.reply(from, caption.formatForm(), message);

		await client.reply(from, L.success.processing, message);

		const buffer = await imageToPdf(images);

		await client.send(from, {
			document: Buffer.from(buffer, 'base64'),
			mimetype: mime('pdf'),
			fileName: title
		});
	}
});
