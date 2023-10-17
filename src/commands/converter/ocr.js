import path from 'path';

import { color, INFOLOG } from '../../utils/modules/index.js';
import { tesseract } from '../../utils/misc/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'scanimagetext',
	description: 'Recognize text from image',
	usage: '!scanimagetext <Image(reply/send)>',
	category: 'Converter',
	aliases: ['ocr'],
	cooldown: 5,
	limit: 1,
	status: 'enable',
	async run(
		{ isMediaImage, from, prettyNumber, message, filename, query, extractMediaData, typeQuoted, groupMetadata },
		client
	) {
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
		const scanning = await tesseract(file, prettyNumber, query);

		if ('error' in scanning) {
			const lang = scanning.languages
				.map(({ code, name }) => `${code.toUpperCase()} | ${name}`)
				.join('\n')
				.trim();

			client[botNum].reply(`${scanning.error}\n\nAvailable Languages :\n\n${lang}\n\nUse the code only.`, {
				from,
				quoted: message,
				groupMetadata
			});
			return;
		}

		await client[botNum].send(from, { text: scanning.result.text.trim() }, { groupMetadata, quoted: message });

		INFOLOG(`${color('Text is sent', 'cyan')} to ${color(prettyNumber, '#ff71ce')}`);
	}
};
