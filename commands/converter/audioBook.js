/* global botNum */
import cld from 'cld';
import dayjs from 'dayjs';
import path from 'path';

import { __dirname } from '../../index.js';
import { color, INFOLOG } from '../../helper/modules/index.js';
import { textToSpeech } from '../../utils/converter/index.js';
import { tesseract } from '../../utils/misc/index.js';

export default {
	name: 'audiobook',
	description: 'Take a picture and turn it into an audio book.',
	usage: '!audiobook <reply media/send media>',
	aliases: ['audbook'],
	category: 'Converter',
	cooldown: 5,
	limit: 1,
	status: 'enable',
	async run({ isMediaImage, from, prettyNumber, message, filename, extractMediaData, typeQuoted }, client) {
		if (!isMediaImage) {
			return await client[botNum].reply({ from, quoted: message }, 'Please send/reply an image to recognize text');
		}

		const time = dayjs().format('HH:mm:ss DD/MM');
		const file = await client[botNum].downloadAndSaveMediaMessage(
			extractMediaData,
			path.join(__dirname, `temporary_files/${filename}.${extractMediaData.mimetype.split('/')[1]}`),
			typeQuoted,
		);
		const { result } = await tesseract(file, prettyNumber);
		const lang = (await cld.detect(result.text)).languages[0].code;
		const { buffer } = await textToSpeech(result.text.trim(), lang, path.join(__dirname, `temporary_files/${filename}`));

		await client[botNum].sendMessage(from, { text: result.text.trim() }, { quoted: message });
		await client[botNum].sendMessage(from, { audio: buffer }, { quoted: message });
		INFOLOG(`[${color(time, 'cyan')}]`, `${color('Text is sent', '#01cdfe')} to ${color(prettyNumber, '#ff71ce')}`);
	},
};
