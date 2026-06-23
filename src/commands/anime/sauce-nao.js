import fs from 'fs';

import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
import { isURL, sauceNao } from '../../utils/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'saucenao',
	minifiedDescription: 'Saucenao Image Search',
	description: 'Reverse image anime search',
	usage: '!saucenao `<reply image/send image>`',
	category: 'Anime',
	aliases: ['nao', 'waitnao'],
	limit: 2,
	cooldown: 2,
	status: 'enable',
	async run({ isMediaImage, query, extractMediaData, filename, from, message, typeQuoted }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const La = useLocale(locale, 'anime');

		if (!isURL(query) && !isMediaImage) {
			return await client.reply(from, L.errors.imageRequired, {
				from,
				quoted: message
			});
		}

		let media = query && isURL(query) ? query : null;

		const wait = await client.waitMessage(from, L.success.searching, message);

		if (isMediaImage) {
			media = await client.downloadAndSaveMediaMessage(
				extractMediaData,
				`./tmp/${filename}.${extractMediaData.mimetype.split('/')[1]}`,
				typeQuoted
			);
		}

		const result = await sauceNao(media);

		if (result?.error) {
		if (isMediaImage && extractMediaData) {
				await fs.unlink(media).catch(() => {});
			}

			return await wait.update(result.error);
		}

		if (result.title === '') {
			return await wait.update(La.labels.cannotDiscover);
		}

		const capt = `${La.titles.sauceNao.formatHeaders()}

${La.labels.fullTitle} : ${result.title}
${La.labels.description} : ${result.description}
${La.labels.similarity} : ${result.similarity}%

${La.buttons.poweredBySauceNao}`.formatForm();

		await wait.update(capt.trim());

		if (isMediaImage) {
			await fs.unlink(media).catch(() => {});
		}
	}
});
