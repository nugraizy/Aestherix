import path from 'path';

import { textToSpeech } from '../../utils/converter/index.js';
import { color, loggers } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';

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
		if (!query) {
			return await client.reply(from, 'Please provide some text to convert to speech', message);
		}

		let language = 'id';
		const parseOptions = query.includes('--') ? query.split('--') : query;

		if (Array.isArray(parseOptions)) {
			query = parseOptions[0];
			language = parseOptions[1];
		}

		try {
			const { buffer } = await textToSpeech(query, language, path.join(__dirname, `src/media/temporary_files/${filename}`));

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

			await client.reply(from, 'Error while converting text to speech', message);

			loggers.error(color('TTS conversion failed:', 'red'), e);
		}
	}
});
