import rgbcolor from 'rgb-color';

import { ttp } from '../../helper/canvas/index.js';
import { color, loggers } from '../../utils/modules/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'staticsticker',
	minifiedDescription: 'Static Text',
	description: 'Generate static sticker',
	category: 'Converter',
	usage: '!staticsticker <text> [--color] [--fonts]',
	aliases: ['sittp'],
	cooldown: 5,
	limit: 1,
	status: 'enable',
	async run({ from, query, message, groupMetadata, prettyNumber, bodyQuoted }, client) {
		if (!query) {
			query = 'Mana text nya?';
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

		if (bodyQuoted) {
			ttp(prettyNumber, bodyQuoted, colors).then(async (buffer) => {
				await client.instance.send(from, { sticker: new Buffer.from(buffer, 'base64') }, { groupMetadata, quoted: message });

				loggers.INF(`${color('Sticker is sent', '#FF99C8')} to ${color(prettyNumber, '#E4C1F9')}`);
			});
		} else if (query) {
			ttp(prettyNumber, query, colors).then(async (buffer) => {
				await client.instance.send(from, { sticker: new Buffer.from(buffer, 'base64') }, { groupMetadata, quoted: message });

				loggers.INF(`${color('Sticker is sent', '#FF99C8')} to ${color(prettyNumber, '#E4C1F9')}`);
			});
		} else {
			await client.instance.reply('Please enter text to convert to sticker', { from, quoted: message, groupMetadata });
		}
	}
};
