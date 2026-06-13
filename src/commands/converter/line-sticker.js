import configuration from '../../helper/config/connect.js';
import { line } from '../../utils/stickers/index.js';
import { defineCommand } from '../_define.js';
import { getLocale, useLocale } from '../../helper/i18n/index.js';

export default defineCommand({
	name: 'linesticker',
	minifiedDescription: 'Line Sticker',
	description: 'Find Line stickers.',
	usage: '!linesticker `<query>`',
	aliases: ['ls', 'linestick', 'linestickers'],
	category: 'Converter',
	cooldown: 5,
	limit: 1,
	status: 'enable',
	async run({ query, message, from }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!query) {
			return await client.reply(from, L.errors.noQuery, message);
		}

		let result = await line(query);

		if (result.length > 10) {
			result = result.slice(0, 10);
		}

		const capt = `Line Stickers\n\nAuthor : ${result[0].author.capitalize()}\nTot. Stickers : ${result.length}`.formatForm();

		await client.send(from, { text: capt }, { quoted: message });

		for (const { stickers } of result) {
			const sticker = await client.prepareSticker(stickers.animated || stickers.static, undefined, {
				author: configuration.author,
				packname: configuration.packname
			});

			await client.send(from, { sticker }, { quoted: message });
		}
	}
});
