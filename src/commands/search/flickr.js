import { FlickerAPI } from '../../utils/flickr/index.js';
import { numberWithCommas, removeDuplicatesArray } from '../../utils/modules/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'flickr',
	minifiedDescription: 'Search Flickr',
	description: 'Search images from Flickr.',
	usage: '!flickr `<query>`',
	category: 'Search',
	aliases: ['flick'],
	limit: 4,
	cooldown: 5,
	status: 'enable',
	async run({ query, from, message, args, type }, client) {
		if (!query) {
			return await client.instance.reply(from, 'You must provide a query.', message);
		}

		if ((args[1] === 'next' || args[1] === 'prev') && type === 'templateButtonReplyMessage') {
			const data = JSON.parse(JSON.parse(JSON.stringify(args.slice(3).join(' '))));
			const index = data.findIndex((v) => v.download === args[2]);

			return await client.instance.send(
				from,
				{
					image: { url: data[index].download },
					caption:
						'Flickr'.formatHeaders() +
						`\n\nAuthor : ${data[index].userName}
Author Fullname : ${data[index].fullName}
Views : ${numberWithCommas(data[index].views)}
Title : ${data[index].title}
Description : ${data[index].description}
Tags : ${data[index].tags || 'n/a'}
Published : ${data[index].posted}

Powered by Hidden Finder`.formatForm()
					// templateButtons: [
					// 	{ urlButton: { displayText: 'Flickr Source', url: args[1] === 'next' ? data[index].source : data[index].source } },
					// 	index + 1 !== data.length
					// 		? {
					// 				quickReplyButton: {
					// 					displayText: 'Next Image',
					// 					id: `.flickr next ${data[index + 1].download} ${JSON.stringify(data)}`
					// 				}
					// 		  } /* eslint-disable-line */
					// 		: {},
					// 	index !== 0
					// 		? {
					// 				quickReplyButton: {
					// 					displayText: 'Previous Image',
					// 					id: `.flickr prev ${data[index - 1].download} ${JSON.stringify(data)}`
					// 				}
					// 		  } /* eslint-disable-line */
					// 		: {}
					// ],
				},
				{ quoted: message }
			);
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			const flickr = new FlickerAPI();
			let result = await flickr.searchImages(querie.trim());

			if (result?.error) {
				await client.instance.reply(from, result.error, message);
				continue;
			}

			result.forEach((v) => {
				return (v.description = v.description.substring(0, 20));
			});

			result = result.filter((v) => v.title.toLowerCase().includes(querie.toLowerCase()));

			const index = ~~(Math.random() * result.length);

			await client.instance.send(
				from,
				{
					image: { url: result[index].download },
					caption:
						'Flickr'.formatHeaders() +
						`\n\nAuthor : ${result[index].userName}
Author Fullname : ${result[index].fullName}
Views : ${numberWithCommas(result[index].views)}
Title : ${result[index].title}
Description : ${result[index].description}
Tags : ${result[index].tags || 'n/a'}
Published : ${result[index].posted}`
					// 					templateButtons: [
					// 						{ urlButton: { displayText: 'Flickr Source', url: result[0].source } },
					// 						result.length !== 1
					// 							? {
					// 									quickReplyButton: {
					// 										displayText: 'Next Image',
					// 										id: `.flickr next ${result[1].download} ${JSON.stringify(result)}`
					// 									}
					// 							  } /* eslint-disable-line */
					// 							: {}
					// 					],
					// 					footer: `
					// \nPowered by Hidden Finder`
				},
				{ quoted: message }
			);
		}
	}
};
