import { googleArticle, removeDuplicatesArray } from '../../utils/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'googlearticle',
	description: 'Find articles from Google.',
	usage: '!googlearticle <query>',
	aliases: ['gar', 'goarticle', 'articles'],
	category: 'Search',
	cooldown: 5,
	limit: 4,
	status: 'enable',
	run: async ({ query, message, from, type, args, groupMetadata }, client) => {
		if (!query) {
			return await client[botNum].reply('You must provide a query.', { from, quoted: message, groupMetadata });
		}

		if ((args[1] === 'next' || args[1] === 'prev') && type === 'templateButtonReplyMessage') {
			const data = JSON.parse(JSON.parse(JSON.stringify(args.slice(3).join(' '))));
			const index = data.findIndex((v) => v.url === args[2]);

			return await client[botNum].send(
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
										id: `.googlearticle next ${data[index + 1].url} ${JSON.stringify(data)}`
									}
							  } /* eslint-disable-line */
							: {},
						index !== 0
							? {
									quickReplyButton: {
										displayText: 'Previous Image',
										id: `.googlearticle prev ${data[index - 1].url} ${JSON.stringify(data)}`
									}
							  } /* eslint-disable-line */
							: {}
					],
					footer: `${data[index].date ? `${data[index].date} ` : ''}${data[index].description}
                    
Void Bot     ${index + 1}/${data.length}\nPowered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪`
				},
				{ groupMetadata, quoted: message }
			);
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			const result = await googleArticle(querie, 10);

			if ('error' in result) {
				client[botNum].reply(result.error, { from, quoted: message, groupMetadata });
				continue;
			}

			await client[botNum].send(
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
										id: `.googlearticle next ${result[1].url} ${JSON.stringify(result).replace(/\|/g, '')}`
									}
							  } /* eslint-disable-line */
							: {}
					],
					footer: `${result[0].date ? `${result[0].date} ` : ''}${result[0].description}

Void Bot     1/${result.length}\nPowered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪`
				},
				{ groupMetadata, quoted: message }
			);
		}
	}
};
