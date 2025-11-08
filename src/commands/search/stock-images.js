import { arq } from '../../utils/arq/index.js';
import { removeDuplicatesArray } from '../../utils/modules/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'stockimages',
	minifiedDescription: 'Stock Images V1',
	description: 'Search stock images.',
	usage: '!stockimages `<query>`',
	category: 'Search',
	aliases: ['stockimg'],
	limit: 4,
	cooldown: 5,
	status: 'enable',
	async run({ query, from, message, args }, client) {
		if (!query) {
			return await client.instance.reply(from, 'You must provide a query.', message);
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
					footer: `${index + 1}/${data.length}\nPowered by Hidden Finder`
				},
				{ quoted: message }
			);
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			let result = await arq.searchImage(querie.trim());

			if (result?.error || !result.ok) {
				await client.instance.reply(from, JSON.stringify(result), message);
				continue;
			}

			const index = ~~(Math.random() * result.length);

			result = result.result.map((v) => v.url);
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
					footer: 'Powered by Hidden Finder'
				},
				{ quoted: message }
			);
		}
	}
};
