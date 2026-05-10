import { cmdId } from '../../helper/modules/prefix.js';
import { numberWithCommas, removeDuplicatesArray } from '../../utils/modules/index.js';
import { getNovelContent, searchNovel } from '../../utils/pixiv/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'pixivnovel',
	minifiedDescription: 'Search Novel',
	description: 'Search novel from Pixiv.',
	usage: '!pixivnovel `<query>`',
	aliases: ['pixnovel'],
	category: 'Search',
	limit: 4,
	cooldown: 8,
	status: 'enable',
	async run({ from, query, message, cmd }, client) {
		if (!query) {
			return await client.instance.reply(from, 'You must provide a query.', message);
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			const data = await searchNovel(querie.trim());

			if (data?.error) {
				await client.instance.reply(from, `Failed while searching Pixiv novel\n\n${data.error}\n${querie}`, message);
				continue;
			}

			const container = [];
			const { userName, id, userId, likeCount, viewCount, content } = await getNovelContent(data[0].id);

			await client.instance.send(
				from,
				{
					text: `Title : ${data[0].title.capitalize()}
Author : ${userName}
ID Artwork : ${id}
ID Author : ${userId}
Tot. Like : ${numberWithCommas(likeCount)}
Tot. View : ${numberWithCommas(viewCount)}
						
${content}`.formatForm(),
					templateButtons: [
						{ urlButton: { displayText: 'Novel Source', url: `https://www.pixiv.net/novel/show.php?id=${data[0].id}` } }
					],
					footer: ' • Pixiv Novel Content'
				},
				{ quoted: message }
			);

			for (const { id, title, pageCount, userName, type } of data.slice(1)) {
				container.push({
					rows: [
						{
							title: `Read ${title}`,
							rowId: cmdId(cmd, `get https://www.pixiv.net/novel/show.php?id=${id}`)
						}
					],
					title: `PIXIV | ${title.capitalize()} | by ${userName} | ${pageCount} | ${type.capitalize()}`
				});
			}

			await client.instance.send(
				from,
				{
					title: 'Pixiv Novel Search'.formatHeaders(),
					text: '\t',
					footer: 'choose one of the novel inside of the list to read.',
					buttonText: 'Open List',
					sections: container
				},
				{}
			);
		}
	}
};
