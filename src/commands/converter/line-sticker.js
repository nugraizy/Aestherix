import path from 'path';

import configuration from '../../helper/config/connect.js';
import { line } from '../../utils/stickers/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'linesticker',
	minifiedDescription: 'Line Sticker',
	description: 'Find Line stickers.',
	usage: '!linesticker `<query>`',
	aliases: ['ls', 'linestick', 'linestickers'],
	category: 'Converter',
	cooldown: 5,
	limit: 1,
	status: 'enable',
	async run({ query, message, from, filename }, client) {
		if (!query) {
			return await client.instance.reply(from, 'Please enter a query', message);
		}

		let result = await line(query);

		if (result.length > 10) {
			result = result.slice(0, 10);
		}

		const capt = `Line Stickers\n\nAuthor : ${result[0].author.capitalize()}\nTot. Stickers : ${result.length}`.formatForm();

		await client.instance.send(from, { text: capt }, { quoted: message });

		for (const { stickers } of result) {
			const sticker = await client.instance.prepareSticker(
				stickers.animated || stickers.static,
				path.join(__dirname, `src/media/temporary_files/${filename}`),
				undefined,
				{
					author: configuration.author,
					packname: configuration.packname
				}
			);

			await client.instance.send(from, { sticker }, { quoted: message });
		}
	}
};
