import { getSurahDetail } from '../../utils/index.js';

const regex = (input) => /[1-9][0-9]*/.test(input);

/**
 * @type {import('../types.js').Plugins}
 */
export default {
	name: 'surahdetails',
	description: 'Get surah details',
	category: 'AL-Quran',
	usage: '!surahdetail <surah number>',
	aliases: ['surahdetail'],
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

		const detail = await getSurahDetail(query);

		await client[botNum].reply(
			{ groupMetadata, from, quoted: message },
			`Surah ${detail.nomor} (${detail.namaArab}) (${detail.namaLatin})\n\nTotal Ayat : ${detail.totAyat}\nTempat Turun : ${detail.turun}\nArti : ${detail.arti}\nDeskripsi : ${detail.deskripsi}`
		);
	}
};
