import path from 'path';

import { color, loggers } from '../../utils/modules/index.js';
import { tesseract } from '../../utils/misc/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'scanimagetext',
	minifiedDescription: 'Image to text',
	description: 'Recognize text from image.',
	usage: '!scanimagetext `<reply media/send media>`',
	category: 'Converter',
	aliases: ['ocr'],
	cooldown: 5,
	limit: 1,
	status: 'enable',
	async run({ isMediaImage, from, prettyNumber, message, filename, query, extractMediaData, typeQuoted }, client) {
		if (!isMediaImage) {
			return await client.reply(from, 'Please send/reply an image to recognize text', message);
		}

		const file = await client.downloadAndSaveMediaMessage(
			extractMediaData,
			path.join(__dirname, `src/media/temporary_files/${filename}.${extractMediaData.mimetype.split('/')[1]}`),
			typeQuoted
		);
		const scanning = await tesseract(file, prettyNumber, query);

		if (scanning?.error) {
			const lang = scanning.languages
				.map(({ code, name }) => `${code.toUpperCase()} | ${name}`)
				.join('\n')
				.trim();

			client.reply(from, `${scanning.error}\n\nAvailable Languages :\n\n${lang}\n\nUse the code only.`, message);
			return;
		}

		await client.send(from, { text: scanning.result.text.trim() }, { quoted: message });

		loggers.info(`${color('Text is sent', 'pink')} to ${color(prettyNumber, 'lilac')}`);
	}
};
