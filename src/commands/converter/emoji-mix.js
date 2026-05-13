import emojiReg from 'emoji-regex';
import _ from 'lodash';

import configuration from '../../helper/config/connect.js';
import { emojimix } from '../../utils/converter/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'emojimixer',
	minifiedDescription: 'Mix Emoji',
	description: 'Mix emoji.',
	usage: '!emojimix `<emoji1>` `<emoji2>`',
	aliases: ['emojimix', 'emx'],
	category: 'Converter',
	cooldown: 5,
	limit: 1,
	status: 'enable',
	async run({ query, from, message }, client) {
		if (!query) {
			return await client.reply(from, 'Please enter a query', message);
		}

		const regex = query.match(emojiReg());

		if (!regex) {
			return await client.reply(from, 'Please enter a valid emoji', message);
		}

		if (regex.length < 2) {
			return await client.reply(from, 'Please enter 2 valid emoji', message);
		}

		const emojis = _.chunk(regex, 2);

		for (const arr of emojis) {
			if (arr.length === 1) {
				continue;
			}

			const result = await emojimix(arr[0], arr[1]);

			if (typeof result === 'object' && result?.error) {
				await client.reply(from, result.error, message);

				continue;
			}

			const sticker = await client.prepareSticker(result, 'imageMessage', {
				author: configuration.author,
				packname: configuration.packname
			});

			await client.send(from, { sticker }, { quoted: message });
		}
	}
};
