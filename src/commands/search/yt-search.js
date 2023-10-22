import configuration from '../../helper/config/connect.js';
import { searchYoutube } from '../../utils/youtube/index.js';
import { numberWithCommas } from '../../utils/modules/index.js';

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
	name: 'ytsearch',
	description: 'Search YouTube',
	usage: '!ytsearch',
	aliases: ['yts', 'ytsr'],
	category: 'Search',
	cooldown: 10,
	limit: 5,
	status: 'enable',
	async run({ from, query, message, groupMetadata }, client) {
		if (!query) {
			return client[botNum].reply('Please specify a query.', { from, quoted: message, groupMetadata });
		}

		let result = await searchYoutube(query, null, true);

		result = result.filter((v) => v.type === 'video');

		let capt = '';

		let i = 0;

		for (const { videoId, title, timestamp, views, author } of result) {
			const caption = boxen(`NO. ${i + 1}
✦ Video ID : ${videoId}
📕 Title : ${title}
👀 Views : ${numberWithCommas(views)}
📡 Author Channel : ${author.name}
⏳ Duration : ${timestamp ?? 'No Data'}`);

			capt += `${caption}\n\n`;

			i++;
		}

		await client[botNum].send(
			from,
			{
				image: {
					url: result[0].image
				},
				caption: capt.trim()
				// caption: capt,
				// footer: 'Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪',
				// templateButtons: [
				// 	{ urlButton: { displayText: 'Stream Here', url } },
				// 	{ quickReplyButton: { displayText: 'Download MP3', id: `.yta ${url}` } },
				// 	{ quickReplyButton: { displayText: 'Download MP4', id: `.ytv ${url}` } },
				// 	{ quickReplyButton: { displayText: 'Download MP3 & MP4', id: `.yta ${url}|.ytv ${url}` } }
				// ],
				// headerType: 1
			},
			{ groupMetadata }
		);

		const row = [];

		result.forEach(({ url, title, timestamp, views, author }) => {
			row.push(
				{
					rows: [{ title: `MP4 | ${title}`, rowId: `.ytv ${url}` }],
					title: `${author.name} | 👁️‍🗨️ ${numberWithCommas(views)} | ${timestamp}`
				},
				{
					rows: [{ title: `MP3 | ${title}`, rowId: `.yta ${url}` }],
					title: `${author.name} | 👁️‍🗨️ ${numberWithCommas(views)} | ${timestamp}`
				}
			);

			if (configuration.OPTIONS.multiCmd) {
				row.push({
					rows: [{ title: `MP3 & MP4 | ${title}`, rowId: `.yta ${url}|.ytv ${url}` }],
					title: `${author.name} | 👁️‍🗨️ ${numberWithCommas(views)} | ${timestamp}`
				});
			}
		});

		await client[botNum].send(
			from,
			{
				buttonText: 'Open list',
				title: 'See other result',
				footer: 'Made by Void Bot. Powered by Hidden Finder',
				text: '\t',
				sections: row
			},
			{ groupMetadata }
		);
	}
};
