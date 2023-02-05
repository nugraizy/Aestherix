/* global botNum */
import { fetchBUFFER, removeDuplicatesArray } from '../../helper/modules/index.js';
import { downloadManga } from '../../utils/pixiv/index.js';

const regex = (input) => {
	const reg = /^https?:\/\/(www\.|i\.)?(pximg\.net)|(pixiv\.net)/i;
	const isPixiv = reg.test(input);

	if (isPixiv) {
		const match = input.match(/\d{8,10}/g);

		if (!match) {
			return { status: false, message: 'Manga code not found on your URL. Try another URL.' };
		}

		return { status: true, message: match[0] };
	}

	return { status: false, message: 'This URL is not a valid Pixiv URL. Try another URL.' };
};

export default {
	name: 'pixivmangadl',
	description: 'Download manga from Pixiv',
	usage: '!pixivmangadl <url>',
	aliases: ['pixmangadl'],
	category: 'Downloader',
	limit: 4,
	cooldown: 7,
	status: 'enable',
	async run({ from, query, message }, client) {
		if (!query) {
			return await client[botNum].reply({ from, quoted: message }, 'You must provide a query.');
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			const regexs = regex(querie.trim());

			if (!regexs.status) {
				return await client[botNum].reply({ from, quoted: message }, regexs.message);
			}

			const data = await downloadManga(regexs.message);

			if ('error' in data) {
				await client[botNum].reply(
					{ from, quoted: message },
					`Failed while downloading Pixiv manga\n\n${data.error}\n${querie}`,
				);

				continue;
			}

			let i = 0;
			const { id, title, userId, userName, pageCount, url: urls } = data;
			let caption = `Title : ${title.capitalize()}
Author : ${userName}
ID Artwork : ${id}
ID Author : ${userId}
Total Media : ${pageCount}`;

			if (urls.original.length === 1) {
				const images = await fetchBUFFER(urls.original[0], { headers: { referer: `https://www.pixiv.net/ajax/manga/${id}` } });

				return await client[botNum].sendMessage(
					from,
					{
						image: new Buffer.from(images, 'base64'),
						caption: 'Pixiv Manga Downloader'.formatHeaders(),
						templateButtons: [{ urlButton: { displayText: 'Manga Source', url: `https://www.pixiv.net/en/artworks/${id}` } }],
						footer: caption,
					},
					{ quoted: message },
				);
			}

			for (const url of urls.original) {
				caption = i === 0 ? caption : '\t';

				const buffer = await fetchBUFFER(url, { headers: { referer: `https://www.pixiv.net/ajax/manga/${id}` } });

				await client[botNum].sendMessage(
					from,
					{
						image: new Buffer.from(buffer, 'base64'),
						caption: 'Pixiv Manga Downloader'.formatHeaders(),
						templateButtons: [{ urlButton: { displayText: 'Manga Source', url: `https://www.pixiv.net/en/artworks/${id}` } }],
						footer: caption,
					},
					{ quoted: message },
				);
				i++;
			}
		}
	},
};
