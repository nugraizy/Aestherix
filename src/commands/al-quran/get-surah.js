import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { getListSurah } from '../../utils/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'getsurah',
	minifiedDescription: 'Surah List',
	description: 'Get List of Surah from The Quran',
	category: 'AL-Quran',
	usage: '!getsurah',
	aliases: ['surah'],
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ from, message, sender }, client) {
		const locale = await getLocale(from, sender);
		const Lq = useLocale(locale, 'al-quran');

		const lists = await getListSurah();

		await client.reply(
			from,
			lists
				.map(
					(v, i) =>
						`${i + 1}. ${v.nama_latin}\n${Lq.labels.totalVerses} : ${v.jumlah_ayat}\n${Lq.labels.meaning} : ${v.arti}\n${Lq.labels.revealedIn} : ${
							v.tempat_turun
						}\n${Lq.labels.audio} : ${v.audio}\n`
				)
				.join('\n'),
			message
		);
	}
});
