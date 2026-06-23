import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { layarkaca21 } from '../../utils/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'layarkaca21',
	minifiedDescription: 'Search Layarkaca21',
	description: 'Search movies from Layarkaca21 websites.',
	usage: '!layarkaca21 `<query>`',
	aliases: ['lk21', 'd21'],
	category: 'Search',
	cooldown: 5,
	limit: 4,
	status: 'enable',
	run: async ({ query, message, from, args, type }, client) => {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const Ls = useLocale(locale, 'search');

		if (!query) {
			return client.reply(from, L.errors.noQuery, message);
		}

		if ((args[1] === 'next' || args[1] === 'prev') && type === 'templateButtonReplyMessage') {
			const data = JSON.parse(JSON.parse(JSON.stringify(args.slice(3).join(' '))));
			const index = data.findIndex((v) => v.source === args[2]);

			return await client.send(
				from,
				{
					image: { url: data[index].thumbnail },
					caption:
						Ls.titles.lk21.formatHeaders() +
						`\n\n${data[index].title}
${Ls.labels.quality} : ${data[index].quality}
${Ls.labels.country} : ${data[index].country}
${Ls.labels.cast} : ${data[index].castArr.join(', ')}
${Ls.labels.director} : ${data[index].director}
${Ls.labels.genres} : ${data[index].genreArr.join(', ')}
IMDb : ${data[index].ratings}
${Ls.labels.releaseDate} : ${data[index].released}
${Ls.labels.translateBy} : ${data[index].translateBy}
					
Powered by Hidden Finder`.formatForm(),
					templateButtons: [
						index + 1 !== data.length
							? {
									quickReplyButton: {
										displayText: Ls.buttons.nextMovie,
										id: cmdId('layarkaca21', `next ${data[index + 1].source} ${JSON.stringify(data)}`)
									}
								}
							: {},
						index !== 0
							? {
									quickReplyButton: {
										displayText: Ls.buttons.previousMovie,
										id: cmdId('layarkaca21', `prev ${data[index - 1].source} ${JSON.stringify(data)}`)
									}
								}
							: {}
					]
				},
				{ quoted: message }
			);
		}

		const result = await layarkaca21(query);

		if (result?.error) {
			client.reply(from, result.error, message);
		}

		await client.send(
			from,
			{
				image: { url: result[0].thumbnail },
				caption: Ls.titles.lk21.formatHeaders(),
				footer: `${result[0].title}
${Ls.labels.quality} : ${result[0].quality}
${Ls.labels.country} : ${result[0].country}
${Ls.labels.cast} : ${result[0].castStr(', ')}
${Ls.labels.director} : ${result[0].director}
${Ls.labels.genres} : ${result[0].genreStr(', ')}
IMDb : ${result[0].ratings}
${Ls.labels.releaseDate} : ${result[0].released}
${Ls.labels.translateBy} : ${result[0].translateBy}

1/${result.length}\nPowered by Hidden Finder`,
				templateButtons: [
					result.length !== 1
						? {
								quickReplyButton: {
									displayText: Ls.buttons.nextMovie,
									id: cmdId('layarkaca21', `next ${result[1].source} ${JSON.stringify(result)}`)
								}
							}
						: {}
				]
			},
			{ quoted: message }
		);
	}
});
