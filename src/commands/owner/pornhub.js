import { numberWithCommas, removeDuplicatesArray } from '../../utils/modules/index.js';
import { arq } from '../../utils/arq/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'pornhub',
	minifiedDescription: 'Search PornHub',
	description: 'Search pornhub.',
	usage: '!pornhub `<query>`',
	category: 'Owner',
	aliases: ['ph', 'phub'],
	limit: 4,
	cooldown: 5,
	status: 'enable',
	async run({ query, from, message, args, type }, client) {
		if (!query) {
			return await client.instance.reply('You must provide a query.', { from, quoted: message });
		}

		if ((args[1] === 'next' || args[1] === 'prev') && type === 'templateButtonReplyMessage') {
			const data = JSON.parse(JSON.parse(JSON.stringify(args.slice(3).join(' '))));
			const index = data.findIndex((v) => v.mainThumb === args[2]);

			return await client.instance.send(
				from,
				{
					image: { url: data[index].mainThumb },
					caption: 'Pornhub'.formatHeaders(),
					templateButtons: [
						{
							urlButton: {
								displayText: 'Image Source',
								url: args[1] === 'next' ? data[index].mainThumb : data[index].mainThumb
							}
						},
						{ urlButton: { displayText: 'PHub Source', url: args[1] === 'next' ? data[index].url : data[index].url } },
						index + 1 !== data.length
							? {
									quickReplyButton: {
										displayText: 'Next Post',
										id: `.phub next ${data[index + 1].mainThumb} ${JSON.stringify(data)}`
									}
							  } /* eslint-disable-line */
							: {},
						index !== 0
							? {
									quickReplyButton: {
										displayText: 'Previous Post',
										id: `.phub prev ${data[index - 1].mainThumb} ${JSON.stringify(data)}`
									}
							  } /* eslint-disable-line */
							: {}
					],
					footer: `Title : ${data[index].title}
Pornstars : ${data[index].pornstars.join(', ')}
Duration : ${data[index].duration}
Views : ${numberWithCommas(data[index].views)}
Ratings : ${data[index].rating.toFixed(2)}
Uploaded : ${data[index].uploaded}
Type : ${data[index].type}
Category : ${data[index].categories.join(', ')}
Tags : ${data[index].tags.join(', ')}
Void Bot     ${index + 1}/${data.length}\nPowered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪`
				},
				{ quoted: message }
			);
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			const result = await arq.searchPHub(querie.trim());

			if (result?.error || !result.ok) {
				await client.instance.reply(JSON.stringify(result), { from, quoted: message });
				continue;
			}

			await client.instance.send(
				from,
				{
					image: { url: result.result[0].mainThumb },
					caption:
						'Pornhub'.formatHeaders() +
						`\n\n${result.result
							.map(({ title, pornstars, duration, views, rating, uploaded, type, categories, tags }) => {
								return `Title : ${title}
Pornstars : ${pornstars.join(', ')}
Duration : ${duration}
Views : ${numberWithCommas(views)}
Ratings : ${rating.toFixed(2)}
Uploaded : ${uploaded}
Type : ${type}
Category : ${categories.join(', ')}
Tags : ${tags.join(', ')}`;
							})
							.join('\n\n')}`.trimEnd()
					// 					templateButtons: [
					// 						{ urlButton: { displayText: 'Image Source', url: result.result[0].mainThumb } },
					// 						{ urlButton: { displayText: 'PHub Source', url: result.result[0].url } },
					// 						result.result.length !== 1
					// 							? {
					// 									quickReplyButton: {
					// 										displayText: 'Next Post',
					// 										id: `.phub next ${result.result[1].mainThumb} ${JSON.stringify(result.result)}`
					// 									}
					// 							  } /* eslint-disable-line */
					// 							: {}
					// 					],
					// 					footer: `
					// Void Bot     1/${result.result.length}\nPowered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪`
				},
				{ quoted: message }
			);
		}
	}
};
