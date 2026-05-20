import { getSurahDetail } from '../../utils/index.js';
import { defineCommand } from '../_define.js';

const regex = (input) => /[1-9][0-9]*/.test(input);

export default defineCommand({
	name: 'surahdetails',
	minifiedDescription: 'Surah Details',
	description: 'Get surah details',
	category: 'AL-Quran',
	usage: '!surahdetail `<surah number>`',
	aliases: ['surahdetail'],
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ query, from, message }, client) {
		if (!query) {
			return await client.reply(from, 'Please specify a surah number', message);
		}

		if (!regex(query)) {
			return await client.reply(from, 'Please specify a valid surah number', message);
		}

		if (parseInt(query) > 114) {
			return await client.reply(from, 'Surah number must be less than 114', message);
		}

		const detail = await getSurahDetail(query);

		await client.reply(
			from,
			`Surah ${detail.nomor} (${detail.namaArab}) (${detail.namaLatin})\n\nTotal Ayat : ${detail.totAyat}\nTempat Turun : ${detail.turun}\nArti : ${detail.arti}\nDeskripsi : ${detail.deskripsi}`,
			message
		);
	}
});
