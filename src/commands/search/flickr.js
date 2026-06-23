import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
import { FlickerAPI } from '../../utils/flickr/index.js';
import { numberWithCommas, removeDuplicatesArray } from '../../utils/modules/index.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
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
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const Ls = useLocale(locale, 'search');

		if (!query) {
			return await client.reply(from, L.errors.noQuery, message);
		}

		if ((args[1] === 'next' || args[1] === 'prev') && type === 'templateButtonReplyMessage') {
			const data = JSON.parse(JSON.parse(JSON.stringify(args.slice(3).join(' '))));
			const index = data.findIndex((v) => v.download === args[2]);

			return await client.send(
				from,
				{
					image: { url: data[index].download },
					caption:
						Ls.titles.flickr.formatHeaders() +
						`\n\nAuthor : ${data[index].userName}
Author Fullname : ${data[index].fullName}
${Ls.labels.views} : ${numberWithCommas(data[index].views)}
Title : ${data[index].title}
${Ls.labels.description} : ${data[index].description}
${Ls.labels.tags} : ${data[index].tags || 'n/a'}
${Ls.labels.published} : ${data[index].posted}

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
				await client.reply(from, result.error, message);
				continue;
			}

			result.forEach((v) => {
				return (v.description = v.description.substring(0, 20));
			});

			result = result.filter((v) => v.title.toLowerCase().includes(querie.toLowerCase()));

			const index = ~~(Math.random() * result.length);

			await client.send(
				from,
				{
					image: { url: result[index].download },
					caption:
						Ls.titles.flickr.formatHeaders() +
						`\n\nAuthor : ${result[index].userName}
Author Fullname : ${result[index].fullName}
${Ls.labels.views} : ${numberWithCommas(result[index].views)}
Title : ${result[index].title}
${Ls.labels.description} : ${result[index].description}
${Ls.labels.tags} : ${result[index].tags || 'n/a'}
${Ls.labels.published} : ${result[index].posted}`
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
});
