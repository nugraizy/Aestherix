import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { googleArticle, removeDuplicatesArray } from '../../utils/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
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
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const Ls = useLocale(locale, 'search');

		if (!query) {
			return await client.reply(from, L.errors.noQuery, message);
		}

		if ((args[1] === 'next' || args[1] === 'prev') && type === 'templateButtonReplyMessage') {
			const data = JSON.parse(JSON.parse(JSON.stringify(args.slice(3).join(' '))));
			const index = data.findIndex((v) => v.url === args[2]);

			return await client.send(
				from,
				{
					text: data[index].title,
					caption: Ls.titles.googleArticles.formatHeaders(),
					templateButtons: [
						{ urlButton: { displayText: Ls.buttons.articleSource, url: data[index].url } },
						index + 1 !== data.length
							? {
									quickReplyButton: {
										displayText: Ls.buttons.nextArticle,
										id: cmdId('googlearticle', `next ${data[index + 1].url} ${JSON.stringify(data)}`)
									}
								}
							: {},
						index !== 0
							? {
									quickReplyButton: {
										displayText: Ls.buttons.previousArticle,
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
				client.reply(from, result.error, message);
				continue;
			}

			await client.send(
				from,
				{
					text: result[0].title,
					caption: Ls.titles.googleArticles.formatHeaders(),
					templateButtons: [
						{ urlButton: { displayText: Ls.buttons.articleSource, url: result[0].url } },
						result.length !== 1
							? {
									quickReplyButton: {
										displayText: Ls.buttons.nextArticle,
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
});
