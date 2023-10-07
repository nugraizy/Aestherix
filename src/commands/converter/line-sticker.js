import path from 'path';

import configuration from '../../helper/config/connect.js';
import { line } from '../../utils/stickers/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'linesticker',
	description: 'Find Line stickers.',
	usage: '!linesticker <query>',
	aliases: ['ls', 'linestick', 'linestickers'],
	category: 'Converter',
	cooldown: 5,
	limit: 1,
	status: 'enable',
	async run({ query, message, from, filename, groupMetadata }, client) {
		if (!query) {
			return await client[botNum].reply('Please enter a query', { from, quoted: message, groupMetadata });
		}

		let result = await line(query);

		if (result.length > 10) {
			result = result.slice(0, 10);
		}

		const capt = `Line Stickers\n\nAuthor : ${result[0].author.capitalize()}\nTot. Stickers : ${result.length}`;

		await client[botNum].send(from, { text: capt }, { groupMetadata, quoted: message });

		for (const { stickers } of result) {
			const sticker = await client[botNum].prepareSticker(
				stickers.animated || stickers.static,
				path.join(__dirname, `src/media/temporary_files/${filename}`),
				undefined,
				{
					author: configuration.author,
					packname: configuration.packname
				}
			);

			await client[botNum].send(from, { sticker }, { groupMetadata, quoted: message });
		}
	}
};
