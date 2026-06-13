import { cmdId } from '../../helper/modules/prefix.js';
import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { extension, getAyat, getSurahAudio, getSurahDetail, mime } from '../../utils/index.js';
import { defineCommand } from '../_define.js';

const regex = (input) => /[1-9][0-9]*/.test(input);

export default defineCommand({
	name: 'surahaudio',
	minifiedDescription: 'Surah Audio',
	description: 'Get surah audio',
	category: 'AL-Quran',
	usage: '!surahaudio `<surah number>`',
	aliases: ['surah'],
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ query, from, cmd, message }, client) {
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

		const audio = await getSurahAudio(query);
		const ayat = await getAyat(query);
		const detail = await getSurahDetail(query);

		const buttons = [{ buttonId: '', buttonText: { displayText: '' }, type: 1 }];

		if (query === 1) {
			buttons[0].buttonId = cmdId(cmd, parseInt(query) + 1);
			buttons[0].buttonText.displayText = 'Next';
		} else if (query === 114) {
			buttons[0].buttonId = cmdId(cmd, parseInt(query) - 1);
			buttons[0].buttonText.displayText = 'Previous';
		} else {
			buttons[0].buttonId = cmdId(cmd, parseInt(query) - 1);
			buttons[0].buttonText.displayText = 'Previous';
			buttons.push({ buttonId: cmdId(cmd, parseInt(query) + 1) });
			buttons.push({ buttonText: { displayText: 'Next' } });
		}

		await client.buttonDocument(
			from,
			ayat.map((v) => ` • ${v.arab}\n؜ • ${v.latin}\n؜ • ${v.indonesia}`).join('\n\n'),
			'Made by nanda',
			buttons,
			audio.url,
			{
				quoted: message,
				mimetype: mime(audio.url),
				fileName: `${detail.namaLatin}.${extension(mime(audio.url))}`
			}
		);
	}
});
