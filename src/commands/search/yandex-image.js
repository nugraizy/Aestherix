import { cmdId } from '../../helper/modules/prefix.js';
import { removeDuplicatesArray, yandexImage } from '../../utils/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
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
		if (!query) {
			return await client.instance.reply(from, 'You must provide a query.', message);
		}

		if ((args[1] === 'next' || args[1] === 'prev') && type === 'templateButtonReplyMessage') {
			const data = JSON.parse(JSON.parse(JSON.stringify(args.slice(3).join(' '))));
			const index = data.findIndex((v) => v === args[2]);

			return await client.instance.send(
				from,
				{
					image: { url: data[index] },
					caption: 'Yandex Images'.formatHeaders(),
					templateButtons: [
						{ urlButton: { displayText: 'Image Source', url: data[index].url.image } },
						index + 1 !== data.length
							? {
									quickReplyButton: {
										displayText: 'Next Image',
										id: cmdId('yandeximage', `next ${data[index + 1].url.image} ${JSON.stringify(data)}`)
									}
								}
							: {},
						index !== 0
							? {
									quickReplyButton: {
										displayText: 'Previous Image',
										id: cmdId('yandeximage', `prev ${data[index - 1].url.image} ${JSON.stringify(data)}`)
									}
								}
							: {}
					],
					footer: `Aestherix Bot     ${index + 1}/${data.length}\nPowered by Hidden Finder`
				},
				{ quoted: message }
			);
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			const result = await yandexImage(querie);

			if (result?.error) {
				client.instance.reply(from, result.error, message);
				continue;
			}

			const index = ~~(Math.random() * result.length);

			await client.instance.send(
				from,
				{
					image: { url: result[index].url.image },
					caption:
						'Yandex Images'.formatHeaders() +
						`\n\nTitle : ${result[index].title}
Article : ${result[index].url.article}`.formatForm()
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
};
