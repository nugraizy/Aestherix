import dayjs from 'dayjs';
import path from 'path';

import { color, INFOLOG } from '../../utils/modules/index.js';
import { tesseract } from '../../utils/misc/index.js';

/**
 * @type {import('../types.js').Plugins}
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
			return await client[botNum].reply({ from, quoted: message }, 'Please send/reply an image to recognize text');
		}

		const time = dayjs().format('HH:mm:ss DD/MM');

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

			client[botNum].reply(
				{ groupMetadata, from, quoted: message },
				`${scanning.error}\n\nAvailable Languages :\n\n${lang}\n\nUse the code only.`
			);
			return;
		}

		await client[botNum].send(from, { text: scanning.result.text.trim() }, { groupMetadata, quoted: message });

		INFOLOG(`[${color(time, 'cyan')}]`, `${color('Text is sent', '#01cdfe')} to ${color(prettyNumber, '#ff71ce')}`);
	}
};
