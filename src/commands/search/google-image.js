import { googleImage, removeDuplicatesArray } from '../../utils/index.js';

export default {
	name: 'googleimage',
	description: 'Find images from Google.',
	usage: '!googleimage <query>',
	aliases: ['gim', 'gis', 'image'],
	category: 'Search',
	cooldown: 5,
	limit: 4,
	status: 'enable',
	run: async ({ query, message, from, type, args, groupMetadata }, client) => {
		if (!query) {
			return await client[botNum].reply({ groupMetadata, from, quoted: message }, 'You must provide a query.');
		}

		if ((args[1] === 'next' || args[1] === 'prev') && type === 'templateButtonReplyMessage') {
			const data = JSON.parse(JSON.parse(JSON.stringify(args.slice(3).join(' '))));
			const index = data.findIndex((v) => v === args[2]);

			return await client[botNum].send(
				from,
				{
					image: { url: data[index] },
					caption: 'Google-it Images'.formatHeaders(),
					templateButtons: [
						{ urlButton: { displayText: 'Image Source', url: data[index] } },
						index + 1 !== data.length
							? {
									quickReplyButton: {
										displayText: 'Next Image',
										id: `.googleimage next ${data[index + 1]} ${JSON.stringify(data)}`
									}
							  } /* eslint-disable-line */
							: {},
						index !== 0
							? {
									quickReplyButton: {
										displayText: 'Previous Image',
										id: `.googleimage prev ${data[index - 1]} ${JSON.stringify(data)}`
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
			const result = await googleImage(querie, 10);

			if ('error' in result) {
				client[botNum].reply({ groupMetadata, from, quoted: from }, result.error);
				continue;
			}

			await client[botNum].send(
				from,
				{
					image: { url: result[0] },
					caption: 'Google-it Images'.formatHeaders(),
					templateButtons: [
						{ urlButton: { displayText: 'Image Source', url: result[0] } },
						result.length !== 1
							? {
									quickReplyButton: {
										displayText: 'Next Image',
										id: `.googleimage next ${result[1]} ${JSON.stringify(result).replace(/\|/g, '')}`
									}
							  } /* eslint-disable-line */
							: {}
					],
					footer: `Void Bot     1/${result.length}\nPowered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪`
				},
				{ groupMetadata, quoted: message }
			);
		}
	}
};
