import rgbcolor from 'rgb-color';

import { StaticSticker } from '../../helper/canvas/index.js';
import { color, loggers } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';
import { getLocale, useLocale } from '../../helper/i18n/index.js';

export default defineCommand({
	name: 'staticsticker',
	minifiedDescription: 'Static Text',
	description: 'Generate static sticker',
	category: 'Converter',
	usage: '!staticsticker `<text>` `[--color in hex]` `[--fonts]`',
	aliases: ['sittp'],
	cooldown: 5,
	limit: 1,
	status: 'enable',
	async run({ from, query, message, prettyNumber, bodyQuoted }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!query) {
			query = 'Where is the text?';
		}

		let colors = [];
		const parseOptions = query.includes('--') ? query.split('--') : query;

		if (Array.isArray(parseOptions)) {
			query = parseOptions[0];
			colors.push(...parseOptions.slice(1));

			for (const color of colors) {
				if (color.trim() === 'rainbow') {
					colors = ['3fffff', '3fff3f', 'ff3fff', 'ff3f3f', '3f3fff'];

					break;
				} else {
					const check = rgbcolor(color.trim());
					const index = colors.findIndex((v) => v === color);

					if (check.isValid()) {
						colors[index] = check.hex();
					} else {
						colors.splice(index, 1);
					}
				}
			}
		}

		const sticker = new StaticSticker();

		if (bodyQuoted) {
			const buffer = await sticker.render(bodyQuoted, colors);

			await client.send(from, { sticker: buffer }, { quoted: message });
			loggers.info(`${color('Sticker is sent', 'pink')} to ${color(prettyNumber, 'lilac')}`);
		} else if (query) {
			const buffer = await sticker.render(query, colors);

			await client.send(from, { sticker: buffer }, { quoted: message });
			loggers.info(`${color('Sticker is sent', 'pink')} to ${color(prettyNumber, 'lilac')}`);
		} else {
			await client.reply(from, L.errors.textRequired, message);
		}
	}
});
