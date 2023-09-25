import path from 'path';

import { textToSpeech } from '../../utils/converter/index.js';

/**
 * @type {import('../types.js').Plugins}
 */
export default {
	name: 'text2speech',
	description: 'Convert text to speech',
	category: 'Converter',
	usage: '!text2speech <text> [--language]',
	aliases: ['tts', 'gtts', 't2s'],
	cooldown: 5,
	limit: 1,
	status: 'enable',
	async run({ query, from, filename, message, groupMetadata }, client) {
		if (!query) {
			return await client[botNum].reply(
				{ groupMetadata, from, quoted: message },
				'Please provide some text to convert to speech'
			);
		}

		let language = 'id';
		const parseOptions = query.includes('--') ? query.split('--') : query;

		if (Array.isArray(parseOptions)) {
			query = parseOptions[0];
			language = parseOptions[1];
		}

		try {
			const { buffer } = await textToSpeech(query, language, path.join(__dirname, `src/media/temporary_files/${filename}`));

			await client[botNum].send(from, { audio: buffer }, { groupMetadata, quoted: message });
		} catch (e) {
			if (e.error === 'lang not found') {
				return await client[botNum].reply(
					{ groupMetadata, from, quoted: message },
					`Language not found. Available languages :\n\n${Object.keys(e.lang)
						.map((key, i) => `${i + 1}. ${key}   :  ${e.lang[key]}`)
						.join('\n')}`
				);
			}

			await client[botNum].reply({ from, quoted: message }, 'Error while converting text to speech');

			log(e);
		}
	}
};
