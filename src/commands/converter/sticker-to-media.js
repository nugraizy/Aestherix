import path from 'path';
import isBuffer from 'is-buffer';

import { color, loggers } from '../../utils/modules/index.js';
import { convertStickerToMedia } from '../../utils/converter/index.js';
import { reassign } from '../../helper/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'decrypt',
	minifiedDescription: 'Sticker to Media',
	description: 'Decrypt a sticker to media',
	usage: '!decrypt `<reply/send sticker>`',
	aliases: ['d'],
	category: 'Converter',
	cooldown: 5,
	limit: 1,
	status: 'enable',
	async run(
		{ isQuotedSticker, from, message, filename, extractMediaData, prettyNumber, typeQuoted, waitForInput, sender },
		client
	) {
		if (!isQuotedSticker) {
			return await client.instance.reply(from, 'Please reply a sticker to decrypt', message);
		}

		loggers.info(`${color('Decrypting media', 'pink')} from ${color(prettyNumber, 'lilac')}`);

		const results = await client.instance.downloadAndSaveMediaMessage(
			extractMediaData,
			path.join(__dirname, `src/media/temporary_files/${filename}.${extractMediaData.mimetype.split('/')[1]}`),
			typeQuoted
		);
		const { result } = await convertStickerToMedia(results, prettyNumber, extractMediaData);

		await client.instance.send(
			from,
			isBuffer(result)
				? {
						image: new Buffer.from(result, 'base64')
					} /* eslint-disable-line */
				: {
						video: {
							url: result
						}
					} /* eslint-disable-line */,
			{ quoted: message }
		);

		const wait = await waitForInput(client, {
			expectedType: ['stickerMessage'],
			from,
			sender,
			timeInSecond: 10
		});

		if (!wait.timeout) {
			await this.run(await reassign(wait.message, client, store), client);
		}

		loggers.info(`${color('Media is sent', 'pink')} to ${color(prettyNumber, 'lilac')}`);
	}
};
