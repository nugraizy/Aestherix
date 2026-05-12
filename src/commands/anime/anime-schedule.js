import { animeReleases } from '../../utils/index.js';

const DAYS = {
	Sunday: 'Minggu',
	Monday: 'Senin',
	Tuesday: 'Selasa',
	Wednesday: 'Rabu',
	Thursday: 'Kamis',
	Friday: 'Jumat',
	Saturday: 'Sabtu'
};

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'animeschedule',
	minifiedDescription: 'Anime Schedule',
	description: 'Check Anime schedule.',
	usage: '!animeschedule',
	aliases: ['animerelease', 'animrelease'],
	category: 'Anime',
	cooldown: 4,
	limit: 5,
	status: 'enable',
	run: async ({ from, message, isGroup }, client) => {
		if (isGroup) {
			return client.reply(from, 'This command only works in private chat.', message);
		}

		const text = 'Anime Releases'.formatHeaders();
		const result = await animeReleases();

		let index = 0;
		let indexDay = 0;

		const translatedText = Object.keys(result).map((v) => v.replace(v, DAYS[v]));

		let capt = '';

		for (const day in result) {
			index === 0 ? (capt += `${text}\n\n`) : (capt += '\n\n');
			capt += `> 📅 ${translatedText[indexDay]}${index === 0 ? ' (today 🌐)' : ''}\n\n`;

			for (let i = 0, anime = result[day]; i < result[day].length; i++) {
				const time = Object.keys(anime[i])[0];

				capt += `╭─ ⏰ ${time.format('*')} ──\n`;

				for (const data of anime[i][time]) {
					let tempCapt = '';

					tempCapt += `Title : ${data.title}\n`;
					tempCapt += 'note' in data ? `📌 Note : ${data.note}\n` : `Episode : ${data.episode}\n`;
					tempCapt += `URL : ${data.link}\n`;

					if ('source' in data) {
						tempCapt += `Source : ${data.source}\n`;
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
};
