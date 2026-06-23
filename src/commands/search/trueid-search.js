import { BOT_NAME } from '../../core/constants.js';

import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { numberWithCommas, removeDuplicatesArray } from '../../utils/modules/index.js';
import { trueidSearch } from '../../utils/movies/true-id-search.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'trueid',
	minifiedDescription: 'Search TrueID',
	description: 'Search movie on TrueID.',
	category: 'Search',
	usage: '!trueid `<query>`',
	aliases: ['tid'],
	cooldown: 6,
	limit: 5,
	status: 'enable',
	async run({ query, from, message, args, cmd, type }, client, store, ctx) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const Ls = useLocale(locale, 'search');

		if (!query) {
			return await client.reply(from, L.errors.noQuery, message);
		}

		if ((args[1] === 'next' || args[1] === 'prev') && type === 'templateButtonReplyMessage') {
			const data = JSON.parse(JSON.parse(JSON.stringify(args.slice(3).join(' '))));
			const index = data.findIndex((v) => v.thumbnail === args[2]);

			let caption = Ls.titles.trueIdSearch.formatHeaders();

			caption += `\n\nTitle : ${data[index].title}\n`;
			caption += `${Ls.labels.actress} : ${data[index].detailed.actressStr}\n`;
			caption += `${Ls.labels.director} : ${data[index].detailed.director}\n`;
			caption += `${Ls.labels.release} : ${data[index].releaseDate}\n`;
			caption += `${Ls.labels.published} : ${data[index].detailed.published}\n`;
			caption += `${Ls.labels.views} : ${numberWithCommas(data[index].detailed.views)}\n`;
			caption += `${Ls.labels.category} : ${data[index].detailed.category.join(', ')}\n`;
			caption += `${Ls.labels.genres} : ${data[index].detailed.genre}\n`;
			caption += `${Ls.labels.totEps} : ${data[index].detailed.totEpisode}\n`;
			const rows =
				data[index].detailed.episodes.length !== 0
					? data[index].detailed.episodes.map((v, i) => {
							return {
								rows: [
									{
										title: `${i + 1}. Episode ${i + 1} - ${data[index].title}`,
										rowId: cmdId(cmd, `get ${v}`, ctx)
									}
								],
								title: t(locale, 'search.labels.poweredByTrueId', [BOT_NAME])
							};
						})
					: false;

			await client.send(
				from,
				{
					image: { url: data[index].thumbnail },
					caption: caption.formatForm(),
					templateButtons: [
						{
							urlButton: {
								displayText: Ls.buttons.imageSource,
								url: args[1] === 'next' ? data[index].thumbnail : data[index].thumbnail
							}
						},
						{ urlButton: { displayText: Ls.labels.seriesSource, url: data[index].sourceMovie } },
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

			if (rows) {
				await client.send(
					from,
					{
						buttonText: Ls.buttons.openList,
						text: '\t',
						footer: Ls.labels.lookingForStreaming,
						title: Ls.titles.trueId.formatHeaders(),
						sections: rows
					},
					{}
				);
			}

			return;
		} else if (args[1] === 'get') {
			return await client.reply(from, `${Ls.titles.trueIdSearch.formatHeaders()}\n\nURL : ${args[2]}`, message);
		}

		query = query.split(',');
		query = removeDuplicatesArray(query);

		for (const querie of query) {
			const data = await trueidSearch(querie);

			if (data?.error) {
				return await client.reply(from, data.error, message);
			}

			let caption = Ls.titles.trueIdSearch.formatHeaders();

			caption += `\n\nTitle : ${data[0].title}\n`;
			caption += `${Ls.labels.actress} : ${data[0].detailed.actressStr}\n`;
			caption += `${Ls.labels.director} : ${data[0].detailed.director}\n`;
			caption += `${Ls.labels.release} : ${data[0].releaseDate}\n`;
			caption += `${Ls.labels.published} : ${data[0].detailed.published}\n`;
			caption += `${Ls.labels.views} : ${numberWithCommas(data[0].detailed.views)}\n`;
			caption += `${Ls.labels.category} : ${data[0].detailed.category.join(', ')}\n`;
			caption += `${Ls.labels.genres} : ${data[0].detailed.genre}\n`;
			caption += `${Ls.labels.totEps} : ${data[0].detailed.totEpisode}\n`;
			const rows =
				data[0].detailed.episodes.length !== 0
					? data[0].detailed.episodes.map((v, i) => {
							return {
								rows: [
									{
										title: `Episode ${i + 1} - ${data[0].title}`,
										rowId: cmdId(cmd, `get ${v}`, ctx)
									}
								],
								title: t(locale, 'search.labels.poweredByTrueId', [BOT_NAME])
							};
						})
					: false;

			await client.send(
				from,
				{
					image: { url: data[0].thumbnail },
					caption,
					templateButtons: [
						{ urlButton: { displayText: Ls.buttons.imageSource, url: data[0].thumbnail } },
						{ urlButton: { displayText: Ls.labels.seriesSource, url: data[0].sourceMovie } },
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

			if (rows) {
				await client.send(
					from,
					{
						buttonText: Ls.buttons.openList,
						text: '\t',
						footer: Ls.labels.lookingForStreaming,
						title: Ls.titles.trueId.formatHeaders(),
						sections: rows
					},
					{}
				);
			}
		}
	}
});
