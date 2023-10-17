import path from 'path';

import { color, INFOLOG } from '../../utils/modules/index.js';
import { convertStickerToMedia } from '../../utils/converter/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'decrypt',
	description: 'Decrypt a sticker to media',
	usage: '!decrypt <reply sticker/send sticker>',
	aliases: ['d'],
	category: 'Converter',
	cooldown: 5,
	limit: 1,
	status: 'enable',
	async run({ isQuotedSticker, from, message, filename, extractMediaData, prettyNumber, typeQuoted, groupMetadata }, client) {
		if (!isQuotedSticker) {
			return await client[botNum].reply('Please reply a sticker to decrypt', { from, quoted: message, groupMetadata });
		}

		const results = await client[botNum].downloadAndSaveMediaMessage(
			extractMediaData,
			path.join(__dirname, `src/media/temporary_files/${filename}.${extractMediaData.mimetype.split('/')[1]}`),
			typeQuoted
		);
		const { result } = await convertStickerToMedia(results, prettyNumber, extractMediaData);

		await client[botNum].send(
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

		INFOLOG(`${color('Media is sent', 'cyan')} to ${color(prettyNumber, '#ff71ce')}`);
	}
};
