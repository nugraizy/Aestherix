import fs from 'fs';

import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
import { isURL } from '../../utils/modules/index.js';
import { yandex } from '../../utils/image-reverse-search/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'yandex',
	minifiedDescription: 'Reverse Image Yandex',
	description: 'Reverse image search from Yandex.',
	usage: '!yandex `<reply/send image>`',
	category: 'Search',
	aliases: ['ri', 'similar', 'whatimage', 'whatimg', 'findimg'],
	limit: 5,
	cooldown: 8,
	status: 'enable',
	async run({ isMediaImage, query, extractMediaData, filename, from, message, typeQuoted }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const Ls = useLocale(locale, 'search');

		if (!isURL(query) && !isMediaImage) {
			return await client.reply(from, L.errors.imageRequired, message);
		}

		let media = query && isURL(query) ? query : null;

		try {
			await client.reply(from, L.success.searching, message);

			if (isMediaImage && extractMediaData) {
				media = await client.downloadAndSaveMediaMessage(
					extractMediaData,
					`./tmp/${filename}.${extractMediaData.mimetype.split('/')[1]}`,
					typeQuoted
				);
			}

			const result = await yandex(media);

			if (result?.error) {
				if (isMediaImage && fs.existsSync(media)) {
					await fs.unlink(media).catch(() => {});
				}

				return await client.reply(from, result.error, message);
			} else if (!result.information.length) {
				if (isMediaImage && fs.existsSync(media)) {
					await fs.unlink(media).catch(() => {});
				}

				return await client.reply(from, L.errors.similarNotFound, message);
			}

			let i = 1;
			let capt = '';

			for (const item of result.information) {
				if (i === 1) {
					capt += Ls.titles.reverseImageSearch.formatHeaders();
					capt += `\n${Ls.labels.willSending}\n\n`;
				}

				if (i === 6) {
					break;
				}

				capt += `Title : ${item.title}\n`;
				capt += `${Ls.labels.description} : ${item.description}\n`;
				capt += `${Ls.labels.domain} : ${item.domain}`;

				await client.send(
					from,
					{
						image: { url: item.images.preview[0].url },
						caption: capt.trim().formatForm(),
						templateButtons: [
							{ urlButton: { displayText: Ls.buttons.imageSource, url: item.images.original } },
							{ urlButton: { displayText: Ls.buttons.contentSource, url: item.source } }
						]
					},
					{ quoted: message }
				);
				capt = '';

				i++;
			}

			if (isMediaImage && fs.existsSync(media)) {
				await fs.unlink(media).catch(() => {});
			}
		} catch (err) {
			if (isMediaImage && fs.existsSync(media)) {
				await fs.unlink(media).catch(() => {});
			}

			throw err;
		}
	}
});
