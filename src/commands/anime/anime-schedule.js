import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { animeReleases } from '../../utils/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'animeschedule',
	minifiedDescription: 'Anime Schedule',
	description: 'Check Anime schedule.',
	usage: '!animeschedule',
	aliases: ['animerelease', 'animrelease'],
	category: 'Anime',
	cooldown: 4,
	limit: 5,
	status: 'enable',
	run: async ({ from, message, isGroup, sender }, client) => {
		const locale = await getLocale(from, sender);
		const L = useLocale(locale, 'common');
		const La = useLocale(locale, 'anime');

		if (isGroup) {
			return client.reply(from, L.errors.privateOnly, message);
		}

		const text = La.titles.animeReleases.formatHeaders();
		const result = await animeReleases();

		let index = 0;
		let indexDay = 0;

		const translatedText = Object.keys(result).map((v) => La.labels.days[v] || v);

		let capt = '';

		for (const day in result) {
			index === 0 ? (capt += `${text}\n\n`) : (capt += '\n\n');
			capt += `> 📅 ${translatedText[indexDay]}${index === 0 ? La.labels.today : ''}\n\n`;

			for (let i = 0, anime = result[day]; i < result[day].length; i++) {
				const time = Object.keys(anime[i])[0];

				capt += `╭─ ⏰ ${time.format('*')} ──\n`;

				for (const data of anime[i][time]) {
					let tempCapt = '';

					tempCapt += `${La.labels.fullTitle} : ${data.title}\n`;
					tempCapt += 'note' in data ? `📌 ${La.labels.note} : ${data.note}\n` : `${La.labels.episode} : ${data.episode}\n`;
					tempCapt += `${La.labels.url} : ${data.link}\n`;

					if ('source' in data) {
						tempCapt += `${La.labels.source} : ${data.source}\n`;
					}

					capt += tempCapt.formatForm();
				}

				capt += '╰───────\n';
			}

			const INFO = result[day][0];

			await client.send(
				from,
				{
					image: { url: INFO[Object.keys(INFO)][0].thumbnail },
					caption: capt.trim()
				},
				{
					quoted: message
				}
			);

			capt = '';

			index++;
			indexDay++;
		}
	}
});
