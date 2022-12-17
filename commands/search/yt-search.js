/* global botNum */
import sharp from 'sharp';

import configuration from '../../connect.js';
import { ytsr } from '../../utils/youtube/index.js';
import { fetchBUFFER, numberWithCommas } from '../../helper/index.js';

export default {
	name: 'ytsearch',
	description: 'Search YouTube',
	usage: '!ytsearch',
	aliases: ['yts', 'ytsr'],
	category: 'Search',
	cooldown: 10,
	limit: 5,
	status: 'enable',
	async run({ from, query, message }, client) {
		if (!query) {
			return client[botNum].reply({ from, quoted: message }, 'Please specify a query.');
		}

		let result = await ytsr(query);

		result = result.filter((v) => v.type == 'video');
		const { url, title, description, image, timestamp, views, author } = result[0];

		result = result.slice(1);
		let capt = 'YouTube Search'.formatHeaders();

		capt += `\n\nTitle : ${title}\n`;
		capt += `Views : ${numberWithCommas(views)}\n`;
		capt += `Author : ${author.name}\n`;
		capt += `Author Channel : ${author.url}\n`;
		capt += `Duration : ${timestamp ?? 'No Data'}\n`;
		capt += `Description : ${description ?? 'No Data'}`;

		let jpegThumbnail = sharp(new Buffer.from(await fetchBUFFER(image), 'base64'));

		jpegThumbnail = await jpegThumbnail.resize(300, 300).toBuffer();

		await client[botNum].sendMessage(from, {
			location: {
				degreesLatitude: 0,
				degreesLongitude: 0,
				jpegThumbnail,
			},
			caption: capt,
			footer: 'Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪',
			templateButtons: [
				{ urlButton: { displayText: 'Stream Here', url } },
				{ quickReplyButton: { displayText: 'Download MP3', id: `.yta ${url}` } },
				{ quickReplyButton: { displayText: 'Download MP4', id: `.ytv ${url}` } },
				{ quickReplyButton: { displayText: 'Download MP3 & MP4', id: `.yta ${url}|.ytv ${url}` } },
			],
			headerType: 1,
		});

		const row = [];

		result.forEach(({ url, title, timestamp, views, author }) => {
			row.push(
				{
					rows: [{ title: `MP4 | ${title}`, rowId: `.ytv ${url}` }],
					title: `${author.name} | 👁️‍🗨️ ${numberWithCommas(views)} | ${timestamp}`,
				},
				{
					rows: [{ title: `MP3 | ${title}`, rowId: `.yta ${url}` }],
					title: `${author.name} | 👁️‍🗨️ ${numberWithCommas(views)} | ${timestamp}`,
				},
			);

			if (configuration.OPTIONS.multiCmd) {
				row.push({
					rows: [{ title: `MP3 & MP4 | ${title}`, rowId: `.yta ${url}|.ytv ${url}` }],
					title: `${author.name} | 👁️‍🗨️ ${numberWithCommas(views)} | ${timestamp}`,
				});
			}
		});

		await client[botNum].sendMessage(from, {
			buttonText: 'Open list',
			title: 'See other result',
			footer: 'Made by Void Bot. Powered by Hidden Finder',
			text: '\t',
			sections: row,
		});
	},
};
