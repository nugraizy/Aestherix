import cld from 'cld';
import path from 'path';

import { color, INFOLOG } from '../../utils/modules/index.js';
import { textToSpeech } from '../../utils/converter/index.js';
import { tesseract } from '../../utils/misc/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'audiobook',
	description: 'Take a picture and turn it into an audio book.',
	usage: '!audiobook <reply media/send media>',
	aliases: ['audbook'],
	category: 'Converter',
	cooldown: 5,
	limit: 1,
	status: 'enable',
	async run({ isMediaImage, from, prettyNumber, message, filename, extractMediaData, typeQuoted, groupMetadata }, client) {
		if (!isMediaImage) {
			return await client[botNum].reply('Please send/reply an image to recognize text', {
				from,
				quoted: message,
				groupMetadata
			});
		}

		const file = await client[botNum].downloadAndSaveMediaMessage(
			extractMediaData,
			path.join(__dirname, `src/media/temporary_files/${filename}.${extractMediaData.mimetype.split('/')[1]}`),
			typeQuoted
		);
		const { result } = await tesseract(file, prettyNumber);
		const lang = (await cld.detect(result.text)).languages[0].code;
		const { buffer } = await textToSpeech(
			result.text.trim(),
			lang,
			path.join(__dirname, `src/media/temporary_files/${filename}`)
		);

		await client[botNum].send(from, { text: result.text.trim() }, { groupMetadata, quoted: message });
		await client[botNum].send(from, { audio: buffer }, { groupMetadata, quoted: message });
		INFOLOG(`${color('Text is sent', 'cyan')} to ${color(prettyNumber, '#ff71ce')}`);
	}
};
