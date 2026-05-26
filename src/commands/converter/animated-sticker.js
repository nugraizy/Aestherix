import rgbcolor from 'rgb-color';
import yargsParser from 'yargs-parser';

import { AnimatedSticker } from '../../helper/canvas/index.js';
import { color, loggers } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'animatedsticker',
	minifiedDescription: 'Animated Text',
	description: 'Generate animated gif sticker',
	category: 'Converter',
	usage: '!gittp `<text>` `[--color in hex]`  `[--fonts]`',
	aliases: ['gittp'],
	cooldown: 5,
	limit: 1,
	status: 'enable',
	async run({ from, query, message, prettyNumber, bodyQuoted }, client) {
		if (!query && !bodyQuoted) {
			query = 'Where is the text?';
		}

		let parseOptions = yargsParser(query, { configuration: { 'short-option-groups': false } });

		parseOptions = {
			text: parseOptions._.join(' '),
			color:
				Object.keys(parseOptions)
					.filter((v) => v !== '_')?.[0]
					?.split(',') || []
		};

		query = parseOptions.text;

		if (parseOptions.color) {
			for (const color of parseOptions.color) {
				if (color.trim() === 'rainbow') {
					parseOptions.color = ['3fffff', '3fff3f', 'ff3fff', 'ff3f3f', '3f3fff'];
					break;
				} else {
					const check = rgbcolor(color.trim());
					const index = parseOptions.color.findIndex((v) => v === color);

					if (check.isValid()) {
						parseOptions.color[index] = check.hex();
					} else {
						parseOptions.color.splice(index, 1);
					}
				}
			}
		}

		const sticker = new AnimatedSticker();

		if (bodyQuoted) {
			const buffer = await sticker.render(bodyQuoted, parseOptions.color);

			await client.send(from, { sticker: buffer }, { quoted: message });
			loggers.info(`${color('Sticker is sent', 'pink')} to ${color(prettyNumber, 'lilac')}`);
			return;
		}

		if (query) {
			const buffer = await sticker.render(query, parseOptions.color);

			await client.send(from, { sticker: buffer }, { quoted: message });
			loggers.info(`${color('Sticker is sent', 'pink')} to ${color(prettyNumber, 'lilac')}`);
			return;
		}

		return await client.reply(from, 'Please enter text to convert to sticker', message);
	}
});
