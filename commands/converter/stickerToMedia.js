/* global botNum */
import dayjs from 'dayjs';
import path from 'path';

import { __dirname } from '../../index.js';
import { color, INFOLOG } from '../../helper/modules/index.js';
import { convertStickerToMedia } from '../../utils/converter/index.js';

export default {
	name: 'decrypt',
	description: 'Decrypt a sticker to media',
	usage: '!decrypt <reply sticker/send sticker>',
	aliases: ['d'],
	category: 'Converter',
	cooldown: 5,
	limit: 1,
	status: 'enable',
	async run({ isQuotedSticker, from, message, filename, extractMediaData, sender, prettyNumber, typeQuoted }, client) {
		const time = dayjs().format('HH:mm:ss DD/MM');

		if (!isQuotedSticker) {
			return await client[botNum].reply({ from, quoted: message }, 'Please reply a sticker to decrypt');
		}

		const results = await client[botNum].downloadAndSaveMediaMessage(
			extractMediaData,
			path.join(__dirname, `temporary_files/${filename}.${extractMediaData.mimetype.split('/')[1]}`),
			typeQuoted,
		);
		const { result } = await convertStickerToMedia(results, sender, extractMediaData);

		await client[botNum].sendMessage(
			from,
			Buffer.isBuffer(result)
				? {
						image: new Buffer.from(result, 'base64'),
				  } /* eslint-disable-line */
				: {
						video: {
							url: result,
						},
				  } /* eslint-disable-line */,
			{ quoted: message },
		);

		INFOLOG(`[${color(time, 'cyan')}]`, `${color('Media is sent', '#01cdfe')} to ${color(prettyNumber, '#ff71ce')}`);
	},
};
