/* global botNum */
import { getAyat, getSurahAudio, getSurahDetail } from '../../Utils/EQuran/index.js';
import { extension, mime } from '../../Utils/Misc/index.js';

const regex = (input) => /[1-9][0-9]*/.test(input);

export default {
	name: 'surahaudio',
	description: 'Get surah audio',
	category: 'AL-Quran',
	usage: '!surahaudio <surah number>',
	aliases: ['surah'],
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ query, from, cmd, message }, client) {
		if (!query) {
			return await client[botNum].reply({ from, quoted: message }, 'Please specify a surah number');
		}

		if (!regex(query)) {
			return await client[botNum].reply({ from, quoted: message }, 'Please specify a valid surah number');
		}

		if (parseInt(query) > 114) {
			return await client[botNum].reply({ from, quoted: message }, 'Surah number must be less than 114');
		}

		const audio = await getSurahAudio(query);
		const ayat = await getAyat(query);
		const detail = await getSurahDetail(query);

		const buttons = [{ buttonId: '', buttonText: { displayText: '' }, type: 1 }];

		if (query == 1) {
			buttons[0].buttonId = `${cmd} ${parseInt(query) + 1}`;
			buttons[0].buttonText.displayText = 'Next';
		} else if (query == 114) {
			buttons[0].buttonId = `${cmd} ${parseInt(query) - 1}`;
			buttons[0].buttonText.displayText = 'Previous';
		} else {
			buttons[0].buttonId = `${cmd} ${parseInt(query) - 1}`;
			buttons[0].buttonText.displayText = 'Previous';
			buttons.push({ buttonId: `${cmd} ${parseInt(query) + 1}` });
			buttons.push({ buttonText: { displayText: 'Next' } });
		}

		await client[botNum].buttonDocument(from, ayat.map((v) => ` • ${v.arab}\n؜ • ${v.latin}\n؜ • ${v.indonesia}`).join('\n\n'), 'Made by nanda', buttons, audio.url, {
			quoted: message,
			mimetype: mime(audio.url),
			fileName: `${detail.namaLatin}.${extension(mime(audio.url))}`,
		});
	},
};
