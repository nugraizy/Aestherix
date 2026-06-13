import { franc } from 'franc';
import { iso6393 } from 'iso-639-3';

import { textToSpeech } from '../../utils/converter/index.js';
import { tesseract } from '../../utils/misc/index.js';
import { color, loggers } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';
import { getLocale, useLocale } from '../../helper/i18n/index.js';

export default defineCommand({
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
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!isMediaImage || !extractMediaData) {
			return await client.reply(from, L.errors.imageRequired, message);
		}

		const file = await client.downloadAndSaveMediaMessage(
			extractMediaData,
			`./tmp/${filename}.${extractMediaData.mimetype.split('/')[1]}`,
			typeQuoted
		);
		const { result } = await tesseract(file, prettyNumber);
		const detected = franc(result.text);
		const entry = iso6393.find((l) => l.iso6393 === detected);
		const langCode = entry?.iso6391 || 'en';
		const { buffer } = await textToSpeech(
			result.text.trim(),
			langCode,
			`./tmp/${filename}`
		);

		await client.send(from, { text: result.text.trim() }, { quoted: message });
		await client.send(from, { audio: buffer }, { quoted: message });
		loggers.info(`${color('Text is sent', 'pink')} to ${color(prettyNumber, 'lilac')}`);
	}
});
