import { yandexImage, removeDuplicatesArray } from '../../utils/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'yandeximage',
	description: 'Find images from Yandex.',
	usage: '!yandeximage <query>',
	aliases: ['yim', 'yis', 'yandimage'],
	category: 'Search',
	cooldown: 5,
	limit: 4,
	status: 'enable',
	run: async ({ query, message, from, type, args, groupMetadata }, client) => {
		if (!query) {
			return await client[botNum].reply('You must provide a query.', { from, quoted: message, groupMetadata });
		}

		if ((args[1] === 'next' || args[1] === 'prev') && type === 'templateButtonReplyMessage') {
			const data = JSON.parse(JSON.parse(JSON.stringify(args.slice(3).join(' '))));
			const index = data.findIndex((v) => v === args[2]);

			return await client[botNum].send(
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
										id: `.yandeximage next ${data[index + 1].url.image} ${JSON.stringify(data)}`
									}
							  } /* eslint-disable-line */
							: {},
						index !== 0
							? {
									quickReplyButton: {
										displayText: 'Previous Image',
										id: `.yandeximage prev ${data[index - 1].url.image} ${JSON.stringify(data)}`
									}
							  } /* eslint-disable-line */
							: {}
					],
					footer: `Void Bot     ${index + 1}/${data.length}\nPowered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪`
				},
				{ groupMetadata, quoted: message }
			);
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			const result = await yandexImage(querie);

			if ('error' in result) {
				client[botNum].reply(result.error, { from, quoted: message, groupMetadata });
				continue;
			}

			const index = ~~(Math.random() * result.length);

			await client[botNum].send(
				from,
				{
					image: { url: result[index].url.image },
					caption: 'Yandex Images'.formatHeaders(),
					templateButtons: [
						{ urlButton: { displayText: 'Image Source', url: result[0].url.image } },
						result.length !== 1
							? {
									quickReplyButton: {
										displayText: 'Next Image',
										id: `.yandeximage next ${result[1].url.image} ${JSON.stringify(result).replace(/\|/g, '')}`
									}
							  } /* eslint-disable-line */
							: {}
					],
					footer: `Title : ${result[index].title}
Article : ${result[index].url.article}
\nPowered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪`
				},
				{ groupMetadata, quoted: message }
			);
		}
	}
};
