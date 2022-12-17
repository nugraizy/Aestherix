/* global botNum */
import { _3hentai, img2pdf, mime } from '../../utils/index.js';

export default {
	name: '3hentai',
	description: 'Search Doujin from 3hentai.net',
	usage: '!3hentai <query>',
	aliases: ['3hent'],
	category: 'Owner',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	run: async ({ isOwner, from, message, query, sender }, client) => {
		if (!isOwner) {
			return await client[botNum].reply({ from, quoted: message }, 'You are not allowed to use this command.');
		}

		if (!query) {
			return client[botNum].reply({ from, quoted: message }, 'You must provide a query.');
		}

		const result = await _3hentai(query);

		if ('error' in result) {
			return client[botNum].reply({ from, quoted: message }, result.error);
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

		await client[botNum].reply({ from, quoted: message }, caption);
		await client[botNum].sendMessage(from, {
			document: Buffer.from(buffer, 'base64'),
			mimetype: mime('pdf'),
			fileName: title,
		});
	},
};
