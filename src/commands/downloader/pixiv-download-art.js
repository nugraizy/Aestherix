import { fetchBUFFER, removeDuplicatesArray } from '../../utils/modules/index.js';
import { downloadArtworks } from '../../utils/pixiv/index.js';

const regex = (input) => {
	const reg = /^https?:\/\/(www\.|i\.)?(pximg\.net)|(pixiv\.net)/i;
	const isPixiv = reg.test(input);

	if (isPixiv) {
		const match = input.match(/\d{8,10}/g);

		if (!match) {
			return { status: false, message: 'Artwork code not found on your URL. Try another URL.' };
		}

		return { status: true, message: match[0] };
	}

	return { status: false, message: 'This URL is not a valid Pixiv URL. Try another URL.' };
};

/**
 * @type {import('../types.js').Plugins}
 */
export default {
	name: 'pixivartworkdl',
	description: 'Download artworks from Pixiv',
	usage: '!pixivartworkdl <url>',
	aliases: ['pixartdl', 'pixivartdl'],
	category: 'Downloader',
	limit: 4,
	cooldown: 7,
	status: 'enable',
	async run({ from, query, message, grouppMetadata }, client) {
		if (!query) {
			return await client[botNum].reply({ grouppMetadata, from, quoted: message }, 'You must provide a query.');
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			const regexs = regex(querie.trim());

			if (!regexs.status) {
				return await client[botNum].reply({ grouppMetadata, from, quoted: message }, regexs.message);
			}

			const data = await downloadArtworks(regexs.message);

			if ('error' in data) {
				await client[botNum].reply(
					{ grouppMetadata, from, quoted: message },
					`Failed while downloading Pixiv artworks\n\n${data.error}\n${querie}`
				);

				continue;
			}

			let i = 0;
			const { id, title, userId, userName, pageCount, url: urls } = data;
			let caption = `${'Pixiv Artworks Downloader'.formatHeaders()}\n\nTitle : ${title.capitalize()}
Author : ${userName}
ID Artwork : ${id}
ID Author : ${userId}
Total Media : ${pageCount}`;

			if (urls.original.length === 1) {
				const images = await fetchBUFFER(urls.original[0], {
					headers: { referer: `https://www.pixiv.net/ajax/illust/${id}` }
				});

				return await client[botNum].send(
					from,
					{
						image: new Buffer.from(images, 'base64'),
						caption: caption + `\nSource https://www.pixiv.net/en/artworks/${id}`
					},
					{ grouppMetadata, quoted: message }
				);
			}

			for (const url of urls.original) {
				caption = i === 0 ? caption + `\nSource https://www.pixiv.net/en/artworks/${id}` : '\t';

				const buffer = await fetchBUFFER(url, { headers: { referer: `https://www.pixiv.net/ajax/illust/${id}` } });

				await client[botNum].send(
					from,
					{
						image: new Buffer.from(buffer, 'base64'),
						caption
					},
					{ grouppMetadata, quoted: message }
				);
				i++;
			}
		}
	}
};
