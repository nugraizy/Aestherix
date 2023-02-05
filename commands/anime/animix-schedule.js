/* global botNum */
import { translate } from '@vitalets/google-translate-api';

import { animixReleases } from '../../utils/index.js';

export default {
	name: 'animixschedule',
	description: 'Check Anime schedule from Animixplay.to',
	usage: '!animixschedule',
	aliases: ['animerelease', 'animrelease'],
	category: 'Anime',
	cooldown: 4,
	limit: 5,
	status: 'enable',
	run: async ({ from, message, type, cmd, args }, client) => {
		const text = 'Animixplay Releases'.formatHeaders();

		if (type === 'listResponseMessage') {
			const data = JSON.parse(JSON.parse(JSON.stringify(args.slice(1).join(' '))));

			client[botNum].reply(
				{ from, quoted: message },
				`${text}\n\nStream Here\n\n${data
					.map(
						(v) =>
							`📁 ${v.server}\n${v.items
								.map((w, i) => ` ╠  📂${w.title}\n ${i === v.items.length - 1 ? '╚' : '╠'}  📂 ${w.url}`)
								.join('\n')}`,
					)
					.join('\n\n')}`.trim(),
			);

			return;
		}

		const result = await animixReleases();

		const container = [];
		let index = 0;
		let indexDay = 0;

		let { text: translatedText } = await translate(Object.keys(result).join(','), { to: 'id' });

		translatedText = translatedText.split(' ');

		for (const day in result) {
			container.push({
				rows: [
					{
						title: `${result[day][0].title}`,
						description: `Releases : ${result[day][0].time}`,
						rowId: `${cmd} ${JSON.stringify(result[day][0].streams).replace(/\|/g, '')}`,
					},
					...result[day].slice(1).map((v) => ({
						title: `${v.title}`,
						description: `Releases : ${v.time}`,
						rowId: `${cmd} ${JSON.stringify(v.streams).replace(/\|/g, '')}`,
					})),
				],
				title: `${translatedText[indexDay]} ${index === 0 ? '(today)' : ''}`,
			});

			index++;
			indexDay++;
		}

		await client[botNum].sendMessage(from, {
			title: text,
			text: '\n',
			footer: 'choose one of the title inside of the list to see the available streaming services.',
			buttonText: 'Open List',
			sections: container,
		});
	},
};
