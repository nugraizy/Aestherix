
import { color, loggers } from '../../utils/modules/index.js';
import { tesseract } from '../../utils/misc/index.js';
import { defineCommand } from '../_define.js';
import { getLocale, useLocale } from '../../helper/i18n/index.js';

export default defineCommand({
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
		const scanning = await tesseract(file, prettyNumber, query);

		if (scanning?.error) {
			const lang = scanning.languages
				.map(({ code, name }) => `${code.toUpperCase()} | ${name}`)
				.join('\n')
				.trim();

			await client.reply(from, `${scanning.error}\n\nAvailable Languages :\n\n${lang}\n\nUse the code only.`, message);
			return;
		}

		await client.send(from, { text: scanning.result.text.trim() }, { quoted: message });

		loggers.info(`${color('Text is sent', 'pink')} to ${color(prettyNumber, 'lilac')}`);
	}
});
