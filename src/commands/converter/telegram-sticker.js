import path from 'path';

import configuration from '../../helper/config/connect.js';
import { telegram } from '../../utils/stickers/telegram.js';

/**
 * @type {import('../types.js').Plugins}
 */
export default {
	name: 'telegramsticker',
	description: 'Find Telegram stickers.',
	usage: '!telegramsticker <query>',
	aliases: ['ts', 'telestick', 'telegramstickers'],
	category: 'Converter',
	cooldown: 5,
	limit: 4,
	status: 'enable',
	async run({ query, message, from, filename, groupMetadata }, client) {
		if (!query) {
			return await client[botNum].reply({ groupMetadata, from, quoted: message }, 'Please enter a query');
		}

		const result = await telegram(query);

		if (result?.stickers?.length > 10) {
			result.stickers = result.stickers.slice(0, 10);
		}

		const capt = `Telegram Stickers\n\nName : ${result.name.capitalize()}\nTitle : ${result.title.capitalize()}\nTot. Stickers : ${
			result.stickers.length
		}`;

		await client[botNum].send(from, { text: capt }, { groupMetadata, quoted: message });

		for (const stickers of result.stickers) {
			const sticker = await client[botNum].prepareSticker(
				stickers,
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
