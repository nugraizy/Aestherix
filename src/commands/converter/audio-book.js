import { franc } from 'franc';
import { iso6393 } from 'iso-639-3';
import path from 'path';

import { textToSpeech } from '../../utils/converter/index.js';
import { tesseract } from '../../utils/misc/index.js';
import { color, loggers } from '../../utils/modules/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'audiobook',
	minifiedDescription: 'Audio book',
	description: 'Take a picture and turn it into an audio book.',
	usage: '!audiobook `<reply media/send media>`',
	aliases: ['audbook'],
	category: 'Converter',
	cooldown: 5,
	limit: 1,
	status: 'enable',
	async run({ isMediaImage, from, prettyNumber, message, filename, extractMediaData, typeQuoted }, client) {
		if (!isMediaImage) {
			return await client.reply(from, 'Please send/reply an image to recognize text', message);
		}

		const file = await client.downloadAndSaveMediaMessage(
			extractMediaData,
			path.join(__dirname, `src/media/temporary_files/${filename}.${extractMediaData.mimetype.split('/')[1]}`),
			typeQuoted
		);
		const { result } = await tesseract(file, prettyNumber);
		const detected = franc(result.text);
		const entry = iso6393.find((l) => l.iso6393 === detected);
		const langCode = entry?.iso6391 || 'en';
		const { buffer } = await textToSpeech(
			result.text.trim(),
			langCode,
			path.join(__dirname, `src/media/temporary_files/${filename}`)
		);

		await client.send(from, { text: result.text.trim() }, { quoted: message });
		await client.send(from, { audio: buffer }, { quoted: message });
		loggers.info(`${color('Text is sent', 'pink')} to ${color(prettyNumber, 'lilac')}`);
	}
};
