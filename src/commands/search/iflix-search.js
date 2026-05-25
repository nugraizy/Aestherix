import { BOT_NAME } from '../../core/constants.js';

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
		if ((args[1] === 'next' || args[1] === 'prev') && type === 'templateButtonReplyMessage') {
			const data = JSON.parse(JSON.parse(JSON.stringify(args.slice(3).join(' '))));
			const index = data.findIndex((v) => v.thumbnail === args[2]);
			let caption = 'Iflix Search'.formatHeaders();

			caption += `\n\nTitle : ${data[index].title}\n`;
			caption += `Actress : ${data[index].actressStr}\n`;
			caption += `Director : ${data[index].director}\n`;
			caption += `Status : ${data[index].status}\n`;
			caption += `Tot. Eps : ${data[index].totEpisode}`;
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
					title: `${BOT_NAME} | Powered by Iflix`
				};
			});

			await client.send(
				from,
				{
					image: { url: data[index].thumbnail },
					caption,
					templateButtons: [
						{
							urlButton: { displayText: 'Image Source', url: args[1] === 'next' ? data[index].image : data[index].thumbnail }
						},
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
			return await client.send(
				from,
				{
					buttonText: 'Open List',
					text: '\t',
					footer: '```Looking for the streaming URL? Choose between these options.```',
					title: 'Iflix'.formatHeaders(),
					sections: rows
				},
				{}
			);
		} else if (args[1] === 'get') {
			return await client.reply(from, `${'Iflix Search'.formatHeaders()}\n\nURL : ${args[2]}`, message);
		}

		query = query.split(',');
		query = removeDuplicatesArray(query);

		for (const querie of query) {
			const data = await iflixSearch(querie);

			if (data?.error) {
				return await client.reply(from, data.error, message);
			}

			let caption = 'Iflix Search'.formatHeaders();

			caption += `\n\nTitle : ${data[0].title}\n`;
			caption += `Actress : ${data[0].actressStr}\n`;
			caption += `Director : ${data[0].director}\n`;
			caption += `Status : ${data[0].status}\n`;
			caption += `Tot. Eps : ${data[0].totEpisode}`;
			const rows = data[0].episodes.map((v, i) => {
				return {
					rows: [
						{
							title: `Episode ${i + 1} - ${data[0].title}`,
							rowId: cmdId(cmd, `get ${v}`, ctx)
						}
					],
					title: `${BOT_NAME} | Powered by Iflix`
				};
			});

			await client.send(
				from,
				{
					image: { url: data[0].thumbnail },
					caption: caption.formatForm(),
					templateButtons: [
						{ urlButton: { displayText: 'Image Source', url: data[0].thumbnail } },
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
			await client.send(
				from,
				{
					buttonText: 'Open List',
					text: '\t',
					footer: '```Looking for the streaming URL? Choose between these options.```',
					title: 'Iflix'.formatHeaders(),
					sections: rows
				},
				{}
			);
		}
	}
});
