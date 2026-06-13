import { BOT_NAME } from '../../core/constants.js';

import { getLocale, useLocale } from '../../helper/i18n/index.js';
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

		if (!query) {
			return await client.reply(from, L.errors.noQuery, message);
		}

		if ((args[1] === 'next' || args[1] === 'prev') && type === 'templateButtonReplyMessage') {
			const data = JSON.parse(JSON.parse(JSON.stringify(args.slice(3).join(' '))));
			const index = data.findIndex((v) => v.thumbnail === args[2]);

			let caption = 'TrueID Search'.formatHeaders();

			caption += `\n\nTitle : ${data[index].title}\n`;
			caption += `Actress : ${data[index].detailed.actressStr}\n`;
			caption += `Director : ${data[index].detailed.director}\n`;
			caption += `Release : ${data[index].releaseDate}\n`;
			caption += `Published : ${data[index].detailed.published}\n`;
			caption += `Views : ${numberWithCommas(data[index].detailed.views)}\n`;
			caption += `Category : ${data[index].detailed.category.join(', ')}\n`;
			caption += `Genre : ${data[index].detailed.genre}\n`;
			caption += `Tot. Eps : ${data[index].detailed.totEpisode}\n`;
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
								title: `${BOT_NAME} | Powered by TrueID`
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
								displayText: 'Image Source',
								url: args[1] === 'next' ? data[index].thumbnail : data[index].thumbnail
							}
						},
						{ urlButton: { displayText: 'Series Source', url: data[index].sourceMovie } },
						index + 1 !== data.length
							? {
									quickReplyButton: {
										displayText: 'Next Series',
										id: cmdId(cmd, `next ${data[index + 1].thumbnail} ${JSON.stringify(data)}`, ctx)
									}
								}
							: {},
						index !== 0
							? {
									quickReplyButton: {
										displayText: 'Previous Series',
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
						buttonText: 'Open List',
						text: '\t',
						footer: '```Looking for the streaming URL? Choose between these options.```',
						title: 'True ID'.formatHeaders(),
						sections: rows
					},
					{}
				);
			}

			return;
		} else if (args[1] === 'get') {
			return await client.reply(from, `${'TrueID Search'.formatHeaders()}\n\nURL : ${args[2]}`, message);
		}

		query = query.split(',');
		query = removeDuplicatesArray(query);

		for (const querie of query) {
			const data = await trueidSearch(querie);

			if (data?.error) {
				return await client.reply(from, data.error, message);
			}

			let caption = 'TrueID Search'.formatHeaders();

			caption += `\n\nTitle : ${data[0].title}\n`;
			caption += `Actress : ${data[0].detailed.actressStr}\n`;
			caption += `Director : ${data[0].detailed.director}\n`;
			caption += `Release : ${data[0].releaseDate}\n`;
			caption += `Published : ${data[0].detailed.published}\n`;
			caption += `Views : ${numberWithCommas(data[0].detailed.views)}\n`;
			caption += `Category : ${data[0].detailed.category.join(', ')}\n`;
			caption += `Genre : ${data[0].detailed.genre}\n`;
			caption += `Tot. Eps : ${data[0].detailed.totEpisode}\n`;
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
								title: `${BOT_NAME} | Powered by TrueID`
							};
						})
					: false;

			await client.send(
				from,
				{
					image: { url: data[0].thumbnail },
					caption,
					templateButtons: [
						{ urlButton: { displayText: 'Image Source', url: data[0].thumbnail } },
						{ urlButton: { displayText: 'Series Source', url: data[0].sourceMovie } },
						data.length !== 1
							? {
									quickReplyButton: {
										displayText: 'Next Series',
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
						buttonText: 'Open List',
						text: '\t',
						footer: '```Looking for the streaming URL? Choose between these options.```',
						title: 'True ID'.formatHeaders(),
						sections: rows
					},
					{}
				);
			}
		}
	}
});
