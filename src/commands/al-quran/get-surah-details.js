import { getLocale, useLocale } from '../../helper/i18n/index.js';
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
	async run({ query, from, message, sender }, client) {
		const locale = await getLocale(from, sender);
		const L = useLocale(locale, 'common');
		const Lq = useLocale(locale, 'al-quran');

		if (!query) {
			return await client.reply(from, L.errors.surahRequired, message);
		}

		if (!regex(query)) {
			return await client.reply(from, L.errors.surahInvalid, message);
		}

		if (parseInt(query) > 114) {
			return await client.reply(from, L.errors.surahMax, message);
		}

		const detail = await getSurahDetail(query);

		await client.reply(
			from,
			`Surah ${detail.nomor} (${detail.namaArab}) (${detail.namaLatin})\n\n${Lq.labels.totalAyat} : ${detail.totAyat}\n${Lq.labels.revealedAt} : ${detail.turun}\n${Lq.labels.meaning} : ${detail.arti}\n${Lq.labels.description} : ${detail.deskripsi}`,
			message
		);
	}
});
