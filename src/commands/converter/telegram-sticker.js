import configuration from '../../helper/config/connect.js';
import { telegram } from '../../utils/stickers/telegram.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'telegramsticker',
	minifiedDescription: 'Telegram Sticker',
	description: 'Find Telegram stickers.',
	usage: '!telegramsticker `<query>`',
	aliases: ['ts', 'telestick', 'telegramstickers'],
	category: 'Converter',
	cooldown: 5,
	limit: 4,
	status: 'enable',
	async run({ query, message, from }, client) {
		if (!query) {
			return await client.instance.reply(from, 'Please enter a query', message);
		}

		const wait = await client.instance.waitMessage(from, 'Please wait...', message);

		const result = await telegram(query);

		if (result?.stickers?.length > 10) {
			result.stickers = result.stickers.slice(0, 10);
		}

		const capt = `Telegram Stickers\n\nName : ${result.name.capitalize()}\nTitle : ${result.title.capitalize()}\nTot. Stickers : ${
			result.stickers.length
		}`;

		await wait.update(capt);

		for (const stickers of result.stickers) {
			const sticker = await client.instance.prepareSticker(stickers, undefined, {
				author: configuration.author,
				packname: configuration.packname
			});

			await client.instance.send(from, { sticker });
		}
	}
};
