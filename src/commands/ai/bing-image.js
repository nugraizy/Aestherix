import { delay } from 'baileys';
import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { createImageBing } from '../../utils/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'bingimage',
	minifiedDescription: 'Create Image',
	description: 'Create Image from text using Bing AI.',
	category: 'AI',
	usage: '!bingimage `<query>`',
	aliases: ['bingimg', 'imgbing'],
	cooldown: 3,
	limit: 5,
	status: 'enable',
	premium: true,
	async run({ query, from, message }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!query) {
			return client.reply(from, L.errors.noQuery, message);
		}

		const images = await createImageBing(query);

		if (!images?.length) {
			return client.reply(from, L.info.noResults, message);
		}

		for (const image of images) {
			await client.send(from, { image: { url: image } }, { quoted: message });
			await delay(300);
		}
	}
});
