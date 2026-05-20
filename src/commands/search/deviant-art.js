import { cmdId } from '../../helper/modules/prefix.js';
import { searchDeviantArt } from '../../utils/deviant_art/index.js';
import { numberWithCommas, removeDuplicatesArray } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'deviantart',
	minifiedDescription: 'Search Deviant Art',
	description: 'Search images from Deviant Art',
	usage: '!deviantart `<query>`',
	category: 'Search',
	aliases: ['dvart', 'devart'],
	limit: 4,
	cooldown: 7,
	status: 'enable',
	async run({ query, from, message, args, type }, client, store, ctx) {
		if (!query) {
			return await client.reply(from, 'You must provide a query.', message);
		}

		if ((args[1] === 'next' || args[1] === 'prev') && type === 'templateButtonReplyMessage') {
			const data = JSON.parse(JSON.parse(JSON.stringify(args.slice(3).join(' '))));
			const index = data.findIndex((v) => v.image === args[2]);

			return await client.send(
				from,
				{
					image: { url: data[index].image },
					caption: 'Deviant Art'.formatHeaders(),
					templateButtons: [
						{ urlButton: { displayText: 'Image Source', url: args[1] === 'next' ? data[index].image : data[index].image } },
						{
							urlButton: {
								displayText: 'Deviant Art Source',
								url: args[1] === 'next' ? data[index].source : data[index].source
							}
						},
						index + 1 !== data.length
							? {
									quickReplyButton: {
										displayText: 'Next Image',
										id: cmdId('deviantart', `next ${data[index + 1].image} ${JSON.stringify(data)}`, ctx)
									}
								}
							: {},
						index !== 0
							? {
									quickReplyButton: {
										displayText: 'Previous Image',
										id: cmdId('deviantart', `prev ${data[index - 1].image} ${JSON.stringify(data)}`, ctx)
									}
								}
							: {}
					],
					footer: `Title : ${data[index].title.capitalize()}
Author : ${data[index].author}
Favourites : ${numberWithCommas(data[index].favourites)}
Views : ${numberWithCommas(data[index].views)}
${index + 1}/${data.length}\nPowered by Hidden Finder`
				},
				{ quoted: message }
			);
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			const result = await searchDeviantArt(querie.trim());

			if (result?.error) {
				await client.reply(from, result.error, message);
				continue;
			}

			const index = ~~(Math.random() * result.length);

			await client.send(
				from,
				{
					image: { url: result[index].image },
					caption: 'Deviant Art'.formatHeaders(),
					templateButtons: [
						{ urlButton: { displayText: 'Image Source', url: result[0].image } },
						{ urlButton: { displayText: 'Deviant Art Source', url: result[0].source } },
						result.length !== 1
							? {
									quickReplyButton: {
										displayText: 'Next Image',
										id: cmdId('deviantart', `next ${result[1].image} ${JSON.stringify(result).replace(/\|/g, '')}`, ctx)
									}
								}
							: {}
					],
					footer: `Title : ${result[index].author.capitalize()}
Author : ${result[index].author}
Favourites : ${numberWithCommas(result[index].favourites)}
Views : ${numberWithCommas(result[index].views)}
\nPowered by Hidden Finder`
				},
				{ quoted: message }
			);
		}
	}
});
