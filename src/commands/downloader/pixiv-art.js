import parser from 'yargs-parser';

import { fetchBUFFER, removeDuplicatesArray, loggers, color } from '../../utils/modules/index.js';
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
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'pixivartworkdl',
	minifiedDescription: 'Download Pixiv Artwork',
	description: 'Download artworks from Pixiv',
	usage: '!pixivartworkdl `<url(s)>` (you can send multiple url using space in between)',
	aliases: ['pixartdl', 'pixivartdl'],
	category: 'Downloader',
	limit: 4,
	cooldown: 7,
	status: 'enable',
	async run({ from, query, message, prettyNumber }, client) {
		if (!query) {
			return await client.instance.reply('You must provide a query.', { from, quoted: message });
		}

		await client.instance.reply('Please wait...', { from, quoted: message });

		let { _: urls } = parser(query);

		urls = removeDuplicatesArray(urls);

		loggers.warning(`${color('Downloading Pixiv File', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);

		for (const url of urls) {
			const regexs = regex(url.trim());

			if (!regexs.status) {
				await client.instance.reply(regexs.message + `\nInvalid : ${url}`, { from, quoted: message });
				continue;
			}

			const data = await downloadArtworks(regexs.message);

			if (data?.error) {
				await client.instance.reply(`Failed while downloading Pixiv artworks\n\n${data.error}\n${url}`, {
					from,
					quoted: message
				});
				loggers.error(`${color('Failed to Download Pixiv File', '#FF5555')} for ${color(prettyNumber, '#E4C1F9')}`);
				continue;
			}

			let i = 0;
			const { id, title, userId, userName, pageCount, url: content } = data;
			let caption = `${'Pixiv Artworks Downloader'.formatHeaders()}
			
Title : ${title.capitalize()}
Author : ${userName}
ID Artwork : ${id}
ID Author : ${userId}
Total Media : ${pageCount}`;

			if (content.original.length === 1) {
				const images = await fetchBUFFER(content.original[0], {
					headers: { referer: `https://www.pixiv.net/ajax/illust/${id}` }
				});

				return await client.instance.send(
					from,
					{
						image: new Buffer.from(images, 'base64'),
						caption: caption + `\nSource : https://www.pixiv.net/en/artworks/${id}`.formatForm()
					},
					{ quoted: message }
				);
			}

			for (const urlImage of content.original) {
				caption = i === 0 ? caption + `\nSource https://www.pixiv.net/en/artworks/${id}` : '\t';

				const buffer = await fetchBUFFER(urlImage, { headers: { referer: `https://www.pixiv.net/ajax/illust/${id}` } });

				await client.instance.send(
					from,
					{
						image: new Buffer.from(buffer, 'base64'),
						caption
					},
					{ quoted: message }
				);
				i++;
			}
		}

		loggers.info(`${color('Downloaded Pixiv File', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);
	}
};
