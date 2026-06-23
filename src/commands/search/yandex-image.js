import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { removeDuplicatesArray, yandexImage } from '../../utils/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'yandeximage',
	minifiedDescription: 'Yandex Images',
	description: 'Search images from Yandex.',
	usage: '!yandeximage `<query>`',
	aliases: ['yim', 'yis', 'yandimage'],
	category: 'Search',
	cooldown: 5,
	limit: 4,
	status: 'enable',
	run: async ({ query, message, from, type, args }, client) => {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const Ls = useLocale(locale, 'search');

		if (!query) {
			return await client.reply(from, L.errors.noQuery, message);
		}

		if ((args[1] === 'next' || args[1] === 'prev') && type === 'templateButtonReplyMessage') {
			const data = JSON.parse(JSON.parse(JSON.stringify(args.slice(3).join(' '))));
			const index = data.findIndex((v) => v === args[2]);

			return await client.send(
				from,
				{
					image: { url: data[index] },
					caption: Ls.titles.yandexImages.formatHeaders(),
					templateButtons: [
						{ urlButton: { displayText: Ls.buttons.imageSource, url: data[index].url.image } },
						index + 1 !== data.length
							? {
									quickReplyButton: {
										displayText: Ls.buttons.nextImage,
										id: cmdId('yandeximage', `next ${data[index + 1].url.image} ${JSON.stringify(data)}`)
									}
								}
							: {},
						index !== 0
							? {
									quickReplyButton: {
										displayText: Ls.buttons.previousImage,
										id: cmdId('yandeximage', `prev ${data[index - 1].url.image} ${JSON.stringify(data)}`)
									}
								}
							: {}
					],
					footer: `${index + 1}/${data.length}\nPowered by Hidden Finder`
				},
				{ quoted: message }
			);
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			const result = await yandexImage(querie);

			if (result?.error) {
				client.reply(from, result.error, message);
				continue;
			}

			const index = ~~(Math.random() * result.length);

			await client.send(
				from,
				{
					image: { url: result[index].url.image },
					caption:
						Ls.titles.yandexImages.formatHeaders() +
						`\n\nTitle : ${result[index].title}
${Ls.labels.content} : ${result[index].url.article}`.formatForm()
					// templateButtons: [
					// 	{ urlButton: { displayText: 'Image Source', url: result[0].url.image } },
					// 	result.length !== 1
					// 		? {
					// 				quickReplyButton: {
					// 					displayText: 'Next Image',
					// 					id: `.yandeximage next ${result[1].url.image} ${JSON.stringify(result).replace(/\|/g, '')}`
					// 				}
					// 		  }
					// 		: {}
					// ],
					// footer: ''
				},
				{ quoted: message }
			);
		}
	}
});
