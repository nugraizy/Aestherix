
import { textToSpeech } from '../../utils/converter/index.js';
import { color, loggers } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';
import { getLocale, useLocale } from '../../helper/i18n/index.js';

export default defineCommand({
	name: 'text2speech',
	minifiedDescription: 'TTS V1',
	description: 'Convert text to speech',
	category: 'Converter',
	usage: '!text2speech `<text>` [--language]',
	aliases: ['tts', 'gtts', 't2s'],
	cooldown: 5,
	limit: 1,
	status: 'enable',
	async run({ query, from, filename, message }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!query) {
			return await client.reply(from, L.errors.ttsTextRequired, message);
		}

		let language = 'id';
		const parseOptions = query.includes('--') ? query.split('--') : query;

		if (Array.isArray(parseOptions)) {
			query = parseOptions[0];
			language = parseOptions[1];
		}

		try {
			const { buffer } = await textToSpeech(query, language, `./tmp/${filename}`);

			await client.send(from, { audio: buffer }, { quoted: message });
		} catch (e) {
			if (e.error === 'lang not found') {
				return await client.reply(
					from,
					`Language not found. Available languages :\n\n${Object.keys(e.lang)
						.map((key, i) => `${i + 1}. ${key}   :  ${e.lang[key]}`)
						.join('\n')}`,
					message
				);
			}

			await client.reply(from, L.errors.error, message);

			loggers.error(color('TTS conversion failed:', 'red'), e);
		}
	}
});
