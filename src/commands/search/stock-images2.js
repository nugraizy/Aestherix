import { removeDuplicatesArray } from '../../utils/modules/index.js';
import { stockImagesPexel } from '../../utils/wallpapers/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'stockimages2',
	minifiedDescription: 'Stock Images V2',
	description: 'Search stock images.',
	usage: '!stockimages2 <query>',
	category: 'Search',
	aliases: ['stockimg2'],
	limit: 4,
	cooldown: 5,
	status: 'enable',
	async run({ query, from, message, args }, client) {
		if (!query) {
			return await client.instance.reply('You must provide a query.', { from, quoted: message });
		}

		if (args[1] === 'next' || args[1] === 'prev') {
			const data = JSON.parse(JSON.parse(JSON.stringify(args.slice(3).join(' '))));
			const index = data.findIndex((v) => v === args[2]);

			return await client.instance.send(
				from,
				{
					image: { url: data[index] },
					caption: 'Stock Images'.formatHeaders(),
					templateButtons: [
						{ urlButton: { displayText: 'Image Source', url: args[1] === 'next' ? data[index] : data[index] } },
						index + 1 !== data.length
							? {
									quickReplyButton: {
										displayText: 'Next Image',
										id: `.stockimages next ${data[index + 1]} ${JSON.stringify(data)}`
									}
							  } /* eslint-disable-line */
							: {},
						index !== 0
							? {
									quickReplyButton: {
										displayText: 'Previous Image',
										id: `.stockimages prev ${data[index - 1]} ${JSON.stringify(data)}`
									}
							  } /* eslint-disable-line */
							: {}
					],
					footer: `Void Bot     ${index + 1}/${data.length}\nPowered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪`
				},
				{ quoted: message }
			);
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			const result = await stockImagesPexel(querie.trim());

			if ('error' in result || !result) {
				await client.instance.reply(JSON.stringify(result), { from, quoted: message });
				continue;
			}

			const index = ~~(Math.random() * result.length);

			await client.instance.send(
				from,
				{
					image: { url: result[index] },
					caption: 'Stock Images'.formatHeaders(),
					templateButtons: [
						{ urlButton: { displayText: 'Image Source', url: result[0] } },
						result.length !== 1
							? {
									quickReplyButton: {
										displayText: 'Next Image',
										id: `.stockimages next ${result[1]} ${JSON.stringify(result)}`
									}
							  } /* eslint-disable-line */
							: {}
					],
					footer: '\nPowered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪'
				},
				{ quoted: message }
			);
		}
	}
};
