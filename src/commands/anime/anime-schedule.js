import { translate } from '@vitalets/google-translate-api';

import { animeReleases } from '../../utils/index.js';

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
	run: async ({ from, message, isGroup, groupMetadata }, client) => {
		if (isGroup) {
			return client.instance.reply('This command only works in private chat.', { from, quoted: message, groupMetadata });
		}

		const text = 'Anime Releases'.formatHeaders();

		const result = await animeReleases();

		let index = 0;
		let indexDay = 0;

		let { text: translatedText } = await translate(Object.keys(result).join(','), { to: 'id' });

		translatedText = translatedText.split(' ');

		let capt = '';

		for (const day in result) {
			index === 0 ? (capt += `${text}\n\n`) : (capt += '\n\n');
			capt += `╭─ 📅 *${translatedText[indexDay]}${index === 0 ? ' (today 🌐)' : ''}*\n\n`;

			for (let i = 0, anime = result[day]; i < result[day].length; i++) {
				const time = Object.keys(anime[i])[0];

				capt += ` ⏰ *${time}* ──\n`;

				for (const v of anime[i][time]) {
					capt += ` 📜 Title : ${v.title.formatHeaders()}\n`;
					capt += ` 🔢 Episode : ${v.episode}\n`;
					capt += ` 🔗 URL : ${v.link}\n\n`;
				}
			}

			const INFO = result[day][0];

			await client.instance.send(
				from,
				{
					image: { url: INFO[Object.keys(INFO)][0].thumbnail },
					caption: capt.trim()
				},
				{
					quoted: message,
					groupMetadata
				}
			);

			capt = '';

			index++;
			indexDay++;
		}
	}
};
