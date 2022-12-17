/* global botNum */
import { removeDuplicatesArray } from '../../helper/modules/index.js';
import { arq } from '../../utils/arq/index.js';

export default {
	name: 'stockimages',
	description: 'Search stock images',
	usage: '!stockimages <query>',
	category: 'Search',
	aliases: ['stockimg'],
	limit: 4,
	cooldown: 5,
	status: 'enable',
	async run({ query, from, message, args }, client) {
		if (!query) {
			return await client[botNum].reply({ from, quoted: message }, 'You must provide a query.');
		}

		if (args[1] == 'next' || args[1] == 'prev') {
			const data = JSON.parse(JSON.parse(JSON.stringify(args.slice(3).join(' '))));
			const index = data.findIndex((v) => v == args[2]);

			return await client[botNum].sendMessage(
				from,
				{
					image: { url: data[index] },
					caption: 'Stock Images'.formatHeaders(),
					templateButtons: [
						{ urlButton: { displayText: 'Image Source', url: args[1] == 'next' ? data[index] : data[index] } },
						index + 1 !== data.length
							? {
									quickReplyButton: {
										displayText: 'Next Image',
										id: `.stockimages next ${data[index + 1]} ${JSON.stringify(data)}`,
									},
							  } /* eslint-disable-line */
							: {},
						index !== 0
							? {
									quickReplyButton: {
										displayText: 'Previous Image',
										id: `.stockimages prev ${data[index - 1]} ${JSON.stringify(data)}`,
									},
							  } /* eslint-disable-line */
							: {},
					],
					footer: `Void Bot     ${index + 1}/${data.length}\nPowered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪`,
				},
				{ quoted: message },
			);
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			let result = await arq.searchImage(querie.trim());

			if ('error' in result || !result.ok) {
				await client[botNum].reply({ from, quoted: message }, JSON.stringify(result));
				continue;
			}

			result = result.result.map((v) => v.url);
			await client[botNum].sendMessage(
				from,
				{
					image: { url: result[0] },
					caption: 'Stock Images'.formatHeaders(),
					templateButtons: [
						{ urlButton: { displayText: 'Image Source', url: result[0] } },
						result.length !== 1
							? {
									quickReplyButton: {
										displayText: 'Next Image',
										id: `.stockimages next ${result[1]} ${JSON.stringify(result)}`,
									},
							  } /* eslint-disable-line */
							: {},
					],
					footer: `Void Bot     1/${result.length}\nPowered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪`,
				},
				{ quoted: message },
			);
		}
	},
};
