import { removeDuplicatesArray, numberWithCommas } from '../../utils/modules/index.js';
import { bilibiliSearchTv } from '../../utils/bilibili/index.js';

const boxen = (text) => {
	const texts = text.split('\n');
	let box = `╭───╌┄ ${texts[0]} ┄┄╌────\n`;

	box += texts
		.slice(1)
		.map((v) => `│ ${v}`)
		.join('\n');
	box += '\n╰────┄┄';

	return box;
};

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'bstation',
	minifiedDescription: 'Search Bilibili/Bstation',
	description: 'Search videos from Bilibili/Bstation ID Server.',
	usage: '!bstation <query>',
	category: 'Search',
	aliases: ['bstat', 'blindo'],
	limit: 4,
	cooldown: 7,
	status: 'enable',
	async run({ query, from, message, groupMetadata }, client) {
		if (!query) {
			return await client.instance.reply('You must provide a query.', { from, quoted: message, groupMetadata });
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			const videos = await bilibiliSearchTv(querie.trim());

			let capt = 'Bstation Search'.formatHeaders() + '\n\n';
			let i = 0;

			for (const { title, aid, author, views, duration } of videos) {
				const caption = boxen(`NO. ${i + 1}
✦ Video ID : ${aid}
📕 Title : ${title}
👀 Views : ${numberWithCommas(views)}
📡 Author Channel : ${author}
⏳ Duration : ${duration ?? 'No Data'}`);

				capt += `${caption}\n\n`;

				i++;
			}

			await client.instance.send(
				from,
				{
					image: {
						url: videos[0].cover
					},
					caption: capt.trim()
				},
				{
					groupMetadata,
					quoted: message
				}
			);
		}
	}
};
