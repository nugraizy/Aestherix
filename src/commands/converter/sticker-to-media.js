import path from 'path';

import { color, loggers } from '../../utils/modules/index.js';
import { convertStickerToMedia } from '../../utils/converter/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'decrypt',
	minifiedDescription: 'Sticker to Media',
	description: 'Decrypt a sticker to media',
	usage: '!decrypt <reply sticker/send sticker>',
	aliases: ['d'],
	category: 'Converter',
	cooldown: 5,
	limit: 1,
	status: 'enable',
	async run({ isQuotedSticker, from, message, filename, extractMediaData, prettyNumber, typeQuoted, groupMetadata }, client) {
		if (!isQuotedSticker) {
			return await client.instance.reply('Please reply a sticker to decrypt', { from, quoted: message, groupMetadata });
		}

		const results = await client.instance.downloadAndSaveMediaMessage(
			extractMediaData,
			path.join(__dirname, `src/media/temporary_files/${filename}.${extractMediaData.mimetype.split('/')[1]}`),
			typeQuoted
		);
		const { result } = await convertStickerToMedia(results, prettyNumber, extractMediaData);

		await client.instance.send(
			from,
			Buffer.isBuffer(result)
				? {
						image: new Buffer.from(result, 'base64')
				  } /* eslint-disable-line */
				: {
						video: {
							url: result
						}
				  } /* eslint-disable-line */,
			{ groupMetadata, quoted: message }
		);

		loggers.info(`${color('Media is sent', '#FF99C8')} to ${color(prettyNumber, '#E4C1F9')}`);
	}
};
