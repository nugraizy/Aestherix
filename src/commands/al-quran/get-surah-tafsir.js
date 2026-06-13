import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { getTafsirSurah } from '../../utils/index.js';
import { defineCommand } from '../_define.js';

const regex = (input) => /[1-9][0-9]*/.test(input);

export default defineCommand({
	name: 'getsurahtafsir',
	minifiedDescription: 'Surah Tafsir',
	description: 'Get surah tafsir',
	category: 'AL-Quran',
	usage: '!getsurahtafsir `<surah number>`',
	aliases: ['gettafsir', 'tafsir'],
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ query, from, message }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!query) {
			return await client.reply(from, L.errors.surahRequired, message);
		}

		if (!regex(query)) {
			return await client.reply(from, L.errors.surahInvalid, message);
		}

		if (parseInt(query) > 114) {
			return await client.reply(from, L.errors.surahMax, message);
		}

		const tafsir = await getTafsirSurah(query);

		await client.reply(from, tafsir.map((v) => `${v.arab} • \n • ${v.tafsir}`).join('\n\n'), message);
	}
});
