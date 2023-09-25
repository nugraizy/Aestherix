import { getTafsirSurah } from '../../utils/index.js';

const regex = (input) => /[1-9][0-9]*/.test(input);

/**
 * @type {import('../types.js').Plugins}
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
			return await client[botNum].reply({ groupMetadata, from, quoted: message }, 'Please specify a surah number');
		}

		if (!regex(query)) {
			return await client[botNum].reply({ groupMetadata, from, quoted: message }, 'Please specify a valid surah number');
		}

		if (parseInt(query) > 114) {
			return await client[botNum].reply({ groupMetadata, from, quoted: message }, 'Surah number must be less than 114');
		}

		const tafsir = await getTafsirSurah(query);

		await client[botNum].reply(
			{ groupMetadata, from, quoted: message },
			tafsir.map((v) => `${v.arab} • \n • ${v.tafsir}`).join('\n\n')
		);
	}
};
