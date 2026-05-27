import { Context } from '../../core/context.js';
import { convertStickerToMedia } from '../../utils/converter/index.js';
import { convertLottieToVideo } from '../../utils/converter/lottie.js';
import { color, loggers } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';

import { inflateRawSync } from 'node:zlib';

function extractLottieFromZip(buffer) {
	let offset = 0;

	while (offset < buffer.length - 4) {
		if (buffer.readUInt32LE(offset) !== 0x04034b50) {
			break;
		}

		const compressionMethod = buffer.readUInt16LE(offset + 8);
		const fnameLen = buffer.readUInt16LE(offset + 26);
		const extraLen = buffer.readUInt16LE(offset + 28);
		const compressedSize = buffer.readUInt32LE(offset + 18);
		const fname = buffer.subarray(offset + 30, offset + 30 + fnameLen).toString();
		const dataStart = offset + 30 + fnameLen + extraLen;

		if (fname.endsWith('.json')) {
			const raw = buffer.subarray(dataStart, dataStart + compressedSize);
			const content = compressionMethod === 8 ? inflateRawSync(raw) : raw;

			return JSON.parse(content.toString());
		}

		offset = dataStart + compressedSize;
	}

	return null;
}

export default defineCommand({
	name: 'decrypt',
	minifiedDescription: 'Sticker to Media',
	description: 'Decrypt a sticker to media',
	usage: '!decrypt `<reply/send sticker>`',
	aliases: ['d', 'tomedia'],
	category: 'Converter',
	cooldown: 5,
	limit: 1,
	status: 'enable',
	async run(
		{ isQuotedSticker, from, message, mediaData, prettyNumber, waitForInput, sender, shouldSkipCheck },
		client,
		store
	) {
		if (!isQuotedSticker && !shouldSkipCheck) {
			return await client.reply(from, 'Please reply a sticker to decrypt', message);
		}

		loggers.info(`${color('Decrypting media', 'pink')} from ${color(prettyNumber, 'lilac')}`);

		const isLottie = Boolean(mediaData?.message?.lottieStickerMessage);
		const downloadTarget = isLottie ? { message: mediaData.message.lottieStickerMessage.message } : mediaData;

		const stickerBuffer = await client.downloadMediaMessage(downloadTarget, 'buffer');

		if (isLottie) {
			const lottieJson = extractLottieFromZip(stickerBuffer);

			if (!lottieJson) {
				return await client.reply(from, 'Failed to extract Lottie animation data.', message);
			}

			const videoBuffer = await convertLottieToVideo(lottieJson, prettyNumber);

			await client.send(from, { video: videoBuffer, gifPlayback: true }, { quoted: message });
			loggers.info(`${color('Lottie media is sent', 'pink')} to ${color(prettyNumber, 'lilac')}`);
			return;
		}

		const { result, isVideo } = await convertStickerToMedia(stickerBuffer, prettyNumber);

		await client.send(
			from,
			isVideo
				? {
						video: result,
						gifPlayback: true
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
			await this.run({ ...(await Context.from(wait.message, client, store)), shouldSkipCheck: true }, client, store);
		}
	}
});
