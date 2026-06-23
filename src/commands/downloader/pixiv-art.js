import parser from 'yargs-parser';

import { getLocale, useLocale, t } from '../../helper/i18n/index.js';
import { fetchBUFFER, removeDuplicatesArray, loggers, color } from '../../utils/modules/index.js';
import { downloadArtworks } from '../../utils/pixiv/index.js';
import { defineCommand } from '../_define.js';

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

export default defineCommand({
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
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const DL = useLocale(locale, 'downloader');

		if (!query) {
			return await client.reply(from, L.errors.noQuery, message);
		}

		const wait = await client.waitMessage(from, L.success.loading, message);

		let { _: urls } = parser(query);

		urls = removeDuplicatesArray(urls);

		let success = 0;
		let error = 0;

		loggers.warning(`${color('Downloading Pixiv File', 'pink')} for ${color(prettyNumber, 'lilac')}`);

		for (const url of urls) {
			const regexs = regex(url.trim());

			if (!regexs.status) {
				await client.reply(from, regexs.message + `\nInvalid : ${url}`, message);
				error++;
				continue;
			}

			const data = await downloadArtworks(regexs.message);

			if (data?.error) {
				await client.reply(from, `Failed while downloading Pixiv artworks\n\n${data.error}\n${url}`, message);
				loggers.error(`${color('Failed to Download Pixiv File', 'red')} for ${color(prettyNumber, 'lilac')}`);
				error++;
				continue;
			}

			let i = 0;
			const { id, title, userId, userName, pageCount, url: content } = data;
			let caption = `${DL.titles.pixivArtworks.formatHeaders()}
			
Title : ${title.capitalize()}
Author : ${userName}
${DL.labels.idArtwork} : ${id}
ID Author : ${userId}
${L.core.labels.totalMedia} : ${pageCount}`;

			if (content.original.length === 1) {
				const images = await fetchBUFFER(content.original[0], {
					headers: { referer: `https://www.pixiv.net/ajax/illust/${id}` }
				});

				await client.send(
					from,
					{
						image: Buffer.from(images, 'base64'),
						caption: caption + `\n${L.core.labels.source} : https://www.pixiv.net/en/artworks/${id}`.formatForm()
					},
					{ quoted: message }
				);

				success++;
				continue;
			}

			for (const urlImage of content.original) {
				caption = i === 0 ? caption + `\nSource https://www.pixiv.net/en/artworks/${id}` : '\t';

				const buffer = await fetchBUFFER(urlImage, { headers: { referer: `https://www.pixiv.net/ajax/illust/${id}` } });

				await client.send(
					from,
					{
						image: Buffer.from(buffer, 'base64'),
						caption
					},
					{ quoted: message }
				);
				i++;
			}

			success++;
		}

		await wait.update(t(locale, 'common.core.progress.commandFinished', [success, error]));

		loggers.info(`${color('Downloaded Pixiv File', 'pink')} for ${color(prettyNumber, 'lilac')}`);
	}
});
