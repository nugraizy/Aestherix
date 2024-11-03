import { getSurahDetail } from '../../utils/index.js';

const regex = (input) => /[1-9][0-9]*/.test(input);

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'surahdetails',
	minifiedDescription: 'Surah Details',
	description: 'Get surah details',
	category: 'AL-Quran',
	usage: '!surahdetail <surah number>',
	aliases: ['surahdetail'],
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ query, from, message }, client) {
		if (!query) {
			return await client.instance.reply('Please specify a surah number', { from, quoted: message });
		}

		if (!regex(query)) {
			return await client.instance.reply('Please specify a valid surah number', { from, quoted: message });
		}

		if (parseInt(query) > 114) {
			return await client.instance.reply('Surah number must be less than 114', { from, quoted: message });
		}

		const detail = await getSurahDetail(query);

		await client.instance.reply(
			`Surah ${detail.nomor} (${detail.namaArab}) (${detail.namaLatin})\n\nTotal Ayat : ${detail.totAyat}\nTempat Turun : ${detail.turun}\nArti : ${detail.arti}\nDeskripsi : ${detail.deskripsi}`,
			{ from, quoted: message }
		);
	}
};
