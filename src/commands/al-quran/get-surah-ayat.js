import { getAyat, getSurahDetail } from '../../utils/index.js';

const regex = (input) => /[1-9][0-9]*/.test(input);

/**
 * @type {import('../types.js').Plugins}
 */
export default {
	name: 'surahayat',
	description: 'Get surah ayat',
	category: 'AL-Quran',
	usage: '!surahayat <surah number>',
	aliases: ['ayat'],
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

		const ayat = await getAyat(query);
		const detail = await getSurahDetail(query);

		await client[botNum].reply(
			{ groupMetadata, from, quoted: message },
			`Surah ${detail.nomor} (${detail.namaArab}) (${detail.namaLatin})\n\nTotal Ayat : ${detail.totAyat}\nTempat Turun : ${
				detail.turun
			}\nArti : ${detail.arti}\n\n${ayat.map((v) => ` • ${v.arab}\n؜ • ${v.latin}\n؜ • ${v.indonesia}`).join('\n\n')}`
		);
	}
};
