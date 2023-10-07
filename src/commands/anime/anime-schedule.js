import { translate } from '@vitalets/google-translate-api';

import { animeReleases } from '../../utils/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'animeschedule',
	description: 'Check Anime schedule.',
	usage: '!animeschedule',
	aliases: ['animerelease', 'animrelease'],
	category: 'Anime',
	cooldown: 4,
	limit: 5,
	status: 'enable',
	run: async ({ from, message, type, cmd, args, isGroup, groupMetadata }, client) => {
		if (isGroup) {
			return client[botNum].reply('This command only works in private chat.', { from, quoted: message, groupMetadata });
		}

		const text = 'Anime Releases'.formatHeaders();

		if (type === 'listResponseMessage') {
			const data = JSON.parse(JSON.parse(JSON.stringify(args.slice(1).join(' '))));

			client[botNum].reply(
				`${text}\n\nStream Here\n\n${data
					.map(
						(v) =>
							`📁 ${v.server}\n${v.items
								.map((w, i) => ` ╠  📂${w.title}\n ${i === v.items.length - 1 ? '╚' : '╠'}  📂 ${w.url}`)
								.join('\n')}`
					)
					.join('\n\n')}`.trim(),
				{ from, quoted: message, groupMetadata }
			);

			return;
		}

		const result = await animeReleases();

		const container = [];
		let index = 0;
		let indexDay = 0;

		let { text: translatedText } = await translate(Object.keys(result).join(','), { to: 'id' });

		translatedText = translatedText.split(' ');

		for (const day in result) {
			container.push({
				rows: [
					{
						title: `${result[day][0].titleRomaji} ${result[day][0].titleNative}`,
						description: `Releases : ${result[day][0].time}`,
						rowId: `${cmd} ${JSON.stringify(result[day][0].streams).replace(/\|/g, '')}`
					},
					...result[day].slice(1).map((v) => ({
						title: `${v.titleRomaji} ${v.titleNative}`,
						description: `Releases : ${v.time}`,
						rowId: `${cmd} ${JSON.stringify(v.streams).replace(/\|/g, '')}`
					}))
				],
				title: `${translatedText[indexDay]} ${index === 0 ? '(today)' : ''}`
			});

			index++;
			indexDay++;
		}

		await client[botNum].send(from, {
			title: text,
			text: '\n',
			footer: 'choose one of the title inside of the list to see the available streaming services.',
			buttonText: 'Open List',
			sections: container
		});
	}
};
