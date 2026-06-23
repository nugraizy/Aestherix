import { BOT_NAME } from '../../core/constants.js';

import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { iflixSearch, removeDuplicatesArray } from '../../utils/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'iflix',
	minifiedDescription: 'Search Iflix',
	description: 'Search movie on iflix.',
	category: 'Search',
	usage: '!iflix `<query>`',
	aliases: ['iflx'],
	cooldown: 7,
	limit: 4,
	status: 'enable',
	async run({ query, from, message, args, cmd, type }, client, store, ctx) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const Ls = useLocale(locale, 'search');

		if ((args[1] === 'next' || args[1] === 'prev') && type === 'templateButtonReplyMessage') {
			const data = JSON.parse(JSON.parse(JSON.stringify(args.slice(3).join(' '))));
			const index = data.findIndex((v) => v.thumbnail === args[2]);
			let caption = Ls.titles.iflixSearch.formatHeaders();

			caption += `\n\nTitle : ${data[index].title}\n`;
			caption += `${Ls.labels.actress} : ${data[index].actressStr}\n`;
			caption += `${Ls.labels.director} : ${data[index].director}\n`;
			caption += `${Ls.labels.status} : ${data[index].status}\n`;
			caption += `${Ls.labels.totEps} : ${data[index].totEpisode}`;
			let count = 0;
			const rows = data[index].episodes.map((v) => {
				count += 1;
				return {
					rows: [
						{
							title: `${count}. Episode ${count} - ${data[index].title}`,
							rowId: cmdId(cmd, `get ${v}`, ctx)
						}
					],
					title: t(locale, 'search.labels.poweredByTrueId', [BOT_NAME])
				};
			});

			await client.send(
				from,
				{
					image: { url: data[index].thumbnail },
					caption,
					templateButtons: [
						{
							urlButton: { displayText: Ls.buttons.imageSource, url: args[1] === 'next' ? data[index].image : data[index].thumbnail }
						},
						index + 1 !== data.length
							? {
									quickReplyButton: {
										displayText: Ls.buttons.nextSeries,
										id: cmdId(cmd, `next ${data[index + 1].thumbnail} ${JSON.stringify(data)}`, ctx)
									}
								}
							: {},
						index !== 0
							? {
									quickReplyButton: {
										displayText: Ls.buttons.previousSeries,
										id: cmdId(cmd, `prev ${data[index - 1].thumbnail} ${JSON.stringify(data)}`, ctx)
									}
								}
							: {}
					],
					footer: `${index + 1}/${data.length}\nPowered by Hidden Finder`
				},
				{ quoted: message }
			);
			return await client.send(
				from,
				{
					buttonText: Ls.buttons.openList,
					text: '\t',
					footer: Ls.labels.lookingForStreaming,
					title: Ls.titles.iflix.formatHeaders(),
					sections: rows
				},
				{}
			);
		} else if (args[1] === 'get') {
			return await client.reply(from, `${Ls.titles.iflixSearch.formatHeaders()}\n\nURL : ${args[2]}`, message);
		}

		query = query.split(',');
		query = removeDuplicatesArray(query);

		for (const querie of query) {
			const data = await iflixSearch(querie);

			if (data?.error) {
				return await client.reply(from, data.error, message);
			}

			let caption = Ls.titles.iflixSearch.formatHeaders();

			caption += `\n\nTitle : ${data[0].title}\n`;
			caption += `${Ls.labels.actress} : ${data[0].actressStr}\n`;
			caption += `${Ls.labels.director} : ${data[0].director}\n`;
			caption += `${Ls.labels.status} : ${data[0].status}\n`;
			caption += `${Ls.labels.totEps} : ${data[0].totEpisode}`;
			const rows = data[0].episodes.map((v, i) => {
				return {
					rows: [
						{
							title: `Episode ${i + 1} - ${data[0].title}`,
							rowId: cmdId(cmd, `get ${v}`, ctx)
						}
					],
					title: t(locale, 'search.labels.poweredByTrueId', [BOT_NAME])
				};
			});

			await client.send(
				from,
				{
					image: { url: data[0].thumbnail },
					caption: caption.formatForm(),
					templateButtons: [
						{ urlButton: { displayText: Ls.buttons.imageSource, url: data[0].thumbnail } },
						data.length !== 1
							? {
									quickReplyButton: {
										displayText: Ls.buttons.nextSeries,
										id: cmdId(cmd, `next ${data[1].thumbnail} ${JSON.stringify(data)}`, ctx)
									}
								}
							: {}
					],
					footer: `1/${data.length}\nPowered by Hidden Finder`
				},
				{ quoted: message }
			);
			await client.send(
				from,
				{
					buttonText: Ls.buttons.openList,
					text: '\t',
					footer: Ls.labels.lookingForStreaming,
					title: Ls.titles.iflix.formatHeaders(),
					sections: rows
				},
				{}
			);
		}
	}
});
