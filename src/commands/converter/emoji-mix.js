import emojiReg from 'emoji-regex';
import _ from 'lodash';

import configuration from '../../helper/config/connect.js';
import { emojimix } from '../../utils/converter/index.js';
import { defineCommand } from '../_define.js';
import { getLocale, useLocale } from '../../helper/i18n/index.js';

export default defineCommand({
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
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!query) {
			return await client.reply(from, L.errors.noQuery, message);
		}

		const regex = query.match(emojiReg());

		if (!regex) {
			return await client.reply(from, L.errors.emojiRequired, message);
		}

		if (regex.length < 2) {
			return await client.reply(from, L.errors.emojiTwoRequired, message);
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
});
