import rgbcolor from 'rgb-color';
import yargsParser from 'yargs-parser';

import { attp } from '../../helper/canvas/index.js';
import { color, loggers } from '../../utils/modules/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'animatedsticker',
	minifiedDescription: 'Animated Text',
	description: 'Generate animated gif sticker',
	category: 'Converter',
	usage: '!gittp <text> [--color]',
	aliases: ['gittp'],
	cooldown: 5,
	limit: 1,
	status: 'enable',
	async run({ from, query, message, prettyNumber, bodyQuoted }, client) {
		if (!query && !bodyQuoted) {
			query = 'Mana text nya?';
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

		if (bodyQuoted) {
			const { buffer } = await attp(prettyNumber, bodyQuoted, parseOptions.color);

			await client.instance.send(from, { sticker: new Buffer.from(buffer, 'base64') }, { quoted: message });
			loggers.info(`${color('Sticker is sent', '#FF99C8')} to ${color(prettyNumber, '#E4C1F9')}`);
			return;
		}

		if (query) {
			const { buffer } = await attp(prettyNumber, query, parseOptions.color);

			await client.instance.send(from, { sticker: new Buffer.from(buffer, 'base64') }, { quoted: message });
			loggers.info(`${color('Sticker is sent', '#FF99C8')} to ${color(prettyNumber, '#E4C1F9')}`);
			return;
		}

		return await client.instance.reply('Please enter text to convert to sticker', { from, quoted: message });
	}
};
