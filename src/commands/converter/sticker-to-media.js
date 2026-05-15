import { Context } from '../../core/context.js';
import { convertStickerToMedia } from '../../utils/converter/index.js';
import { color, loggers } from '../../utils/modules/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'decrypt',
	minifiedDescription: 'Sticker to Media',
	description: 'Decrypt a sticker to media',
	usage: '!decrypt `<reply/send sticker>`',
	aliases: ['d', 'tomedia'],
	category: 'Converter',
	cooldown: 5,
	limit: 1,
	status: 'enable',
	async run({ isQuotedSticker, from, message, mediaData, prettyNumber, waitForInput, sender, shouldSkipCheck }, client) {
		if (!isQuotedSticker && !shouldSkipCheck) {
			return await client.reply(from, 'Please reply a sticker to decrypt', message);
		}

		loggers.info(`${color('Decrypting media', 'pink')} from ${color(prettyNumber, 'lilac')}`);

		const stickerBuffer = await client.downloadMediaMessage(mediaData, 'buffer');
		const { result, isVideo } = await convertStickerToMedia(stickerBuffer, prettyNumber);

		await client.send(
			from,
			isVideo
				? {
						video: result
					}
				: {
						image: result
					},
			{ quoted: message }
		);

		loggers.info(`${color('Media is sent', 'pink')} to ${color(prettyNumber, 'lilac')}`);

		const wait = await waitForInput(client, {
			expectedType: ['stickerMessage'],
			from,
			sender,
			timeInSecond: 10
		});

		if (!wait.timeout) {
			await this.run({ ...(await Context.from(wait.message, client, store)), shouldSkipCheck: true }, client);
		}
	}
};
