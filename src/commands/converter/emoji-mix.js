import emojiReg from 'emoji-regex';
import path from 'path';
import _ from 'lodash';

import configuration from '../../helper/config/connect.js';
import { emojimix } from '../../utils/converter/index.js';

export default {
	name: 'emojimixer',
	description: 'Mix emoji.',
	usage: '!emojimix <Emoji1> <Emoji2>',
	aliases: ['emojimix', 'emx'],
	category: 'Converter',
	cooldown: 5,
	limit: 1,
	status: 'enable',
	async run({ query, from, filename, message, groupMetadata }, client) {
		if (!query) {
			return await client[botNum].reply({ groupMetadata, from, quoted: message }, 'Please enter a query');
		}

		const regex = query.match(emojiReg());

		if (!regex) {
			return await client[botNum].reply({ groupMetadata, from, quoted: message }, 'Please enter a valid emoji');
		}

		if (regex.length < 2) {
			return await client[botNum].reply({ groupMetadata, from, quoted: message }, 'Please enter 2 valid emoji');
		}

		const emojis = _.chunk(regex, 2);

		for (const arr of emojis) {
			if (arr.length === 1) {
				continue;
			}

			const result = await emojimix(arr[0], arr[1]);

			if (typeof result === 'object' && 'error' in result) {
				await client[botNum].reply({ groupMetadata, from, quoted: message }, result.error);

				continue;
			}

			const sticker = await client[botNum].prepareSticker(
				result,
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
