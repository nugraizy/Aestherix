import { getTafsirSurah } from '../../utils/index.js';

const regex = (input) => /[1-9][0-9]*/.test(input);

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'getsurahtafsir',
	description: 'Get Surah Tafsir',
	category: 'AL-Quran',
	usage: '!getsurahtafsir <surah number>',
	aliases: ['gettafsir', 'tafsir'],
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ query, from, message, groupMetadata }, client) {
		if (!query) {
			return await client[botNum].reply('Please specify a surah number', { from, quoted: message, groupMetadata });
		}

		if (!regex(query)) {
			return await client[botNum].reply('Please specify a valid surah number', { from, quoted: message, groupMetadata });
		}

		if (parseInt(query) > 114) {
			return await client[botNum].reply('Surah number must be less than 114', { from, quoted: message, groupMetadata });
		}

		const tafsir = await getTafsirSurah(query);

		await client[botNum].reply(tafsir.map((v) => `${v.arab} • \n • ${v.tafsir}`).join('\n\n'), {
			from,
			quoted: message,
			groupMetadata
		});
	}
};
