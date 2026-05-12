import { cmdId } from '../../helper/modules/prefix.js';
import { removeDuplicatesArray } from '../../utils/modules/index.js';
import { stockImagesPexel } from '../../utils/wallpapers/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'stockimages2',
	minifiedDescription: 'Stock Images V2',
	description: 'Search stock images.',
	usage: '!stockimages2 `<query>`',
	category: 'Search',
	aliases: ['stockimg2'],
	limit: 4,
	cooldown: 5,
	status: 'enable',
	async run({ query, from, message, args }, client) {
		if (!query) {
			return await client.reply(from, 'You must provide a query.', message);
		}

		if (args[1] === 'next' || args[1] === 'prev') {
			const data = JSON.parse(JSON.parse(JSON.stringify(args.slice(3).join(' '))));
			const index = data.findIndex((v) => v === args[2]);

			return await client.send(
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
										id: cmdId('stockimages', `next ${data[index + 1]} ${JSON.stringify(data)}`)
									}
								}
							: {},
						index !== 0
							? {
									quickReplyButton: {
										displayText: 'Previous Image',
										id: cmdId('stockimages', `prev ${data[index - 1]} ${JSON.stringify(data)}`)
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
			const result = await stockImagesPexel(querie.trim());

			if (result?.error || !result) {
				await client.reply(from, JSON.stringify(result), message);
				continue;
			}

			const index = ~~(Math.random() * result.length);

			await client.send(
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
										id: cmdId('stockimages', `next ${result[1]} ${JSON.stringify(result)}`)
									}
								}
							: {}
					],
					footer: '\nPowered by Hidden Finder'
				},
				{ quoted: message }
			);
		}
	}
};
