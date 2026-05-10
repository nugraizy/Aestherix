import { cmdId } from '../../helper/modules/prefix.js';
import { googleArticle, removeDuplicatesArray } from '../../utils/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'googlearticle',
	minifiedDescription: 'Search Google Articles',
	description: 'Search articles from Google.',
	usage: '!googlearticle `<query>`',
	aliases: ['gar', 'goarticle', 'articles'],
	category: 'Search',
	cooldown: 5,
	limit: 4,
	status: 'enable',
	run: async ({ query, message, from, type, args }, client) => {
		if (!query) {
			return await client.instance.reply(from, 'You must provide a query.', message);
		}

		if ((args[1] === 'next' || args[1] === 'prev') && type === 'templateButtonReplyMessage') {
			const data = JSON.parse(JSON.parse(JSON.stringify(args.slice(3).join(' '))));
			const index = data.findIndex((v) => v.url === args[2]);

			return await client.instance.send(
				from,
				{
					text: data[index].title,
					caption: 'Google-it Articles'.formatHeaders(),
					templateButtons: [
						{ urlButton: { displayText: 'Article Source', url: data[index].url } },
						index + 1 !== data.length
							? {
									quickReplyButton: {
										displayText: 'Next Article',
										id: cmdId('googlearticle', `next ${data[index + 1].url} ${JSON.stringify(data)}`)
									}
								}
							: {},
						index !== 0
							? {
									quickReplyButton: {
										displayText: 'Previous Image',
										id: cmdId('googlearticle', `prev ${data[index - 1].url} ${JSON.stringify(data)}`)
									}
								}
							: {}
					],
					footer: `${data[index].date ? `${data[index].date} ` : ''}${data[index].description}
                    
${index + 1}/${data.length}\nPowered by Hidden Finder`
				},
				{ quoted: message }
			);
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			const result = await googleArticle(querie, 10);

			if (result?.error) {
				client.instance.reply(from, result.error, message);
				continue;
			}

			await client.instance.send(
				from,
				{
					text: result[0].title,
					caption: 'Google-it Articles'.formatHeaders(),
					templateButtons: [
						{ urlButton: { displayText: 'Article Source', url: result[0].url } },
						result.length !== 1
							? {
									quickReplyButton: {
										displayText: 'Next Article',
										id: cmdId('googlearticle', `next ${result[1].url} ${JSON.stringify(result).replace(/\|/g, '')}`)
									}
								}
							: {}
					],
					footer: `${result[0].date ? `${result[0].date} ` : ''}${result[0].description}

1/${result.length}\nPowered by Hidden Finder`
				},
				{ quoted: message }
			);
		}
	}
};
