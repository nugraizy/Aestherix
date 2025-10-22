import { getAyat, getSurahDetail } from '../../utils/index.js';

const regex = (input) => /[1-9][0-9]*/.test(input);

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'surahayat',
	minifiedDescription: 'Surah Ayat',
	description: 'Get surah ayat',
	category: 'AL-Quran',
	usage: '!surahayat `<surah number>`',
	aliases: ['ayat'],
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ query, from, message }, client) {
		if (!query) {
			return await client.instance.reply(from, 'Please specify a surah number', message);
		}

		if (!regex(query)) {
			return await client.instance.reply(from, 'Please specify a valid surah number', message);
		}

		if (parseInt(query) > 114) {
			return await client.instance.reply(from, 'Surah number must be less than 114', message);
		}

		const ayat = await getAyat(query);
		const detail = await getSurahDetail(query);

		await client.instance.reply(
			from,
			`Surah ${detail.nomor} (${detail.namaArab}) (${detail.namaLatin})\n\nTotal Ayat : ${detail.totAyat}\nTempat Turun : ${
				detail.turun
			}\nArti : ${detail.arti}\n\n${ayat.map((v) => ` • ${v.arab}\n؜ • ${v.latin}\n؜ • ${v.indonesia}`).join('\n\n')}`,
			message
		);
	}
};
