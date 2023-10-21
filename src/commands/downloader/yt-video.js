import sharp from 'sharp';

import {
	color,
	delay,
	ERRLOG,
	fetchBUFFER,
	INFOLOG,
	numberWithCommas,
	removeDuplicatesArray
} from '../../utils/modules/index.js';
import { youtubeMainDownload as ytv } from '../../utils/youtube/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'ytvideo',
	description: 'Downloads a YouTube video',
	usage: '!ytvideo <url>',
	aliases: ['ytv', 'ytmp4'],
	category: 'Downloader',
	cooldown: 12,
	limit: 8,
	status: 'enable',
	async run({ from, query, prettyNumber, message, type, args, groupMetadata }, client) {
		if (type === 'listResponseMessage' && args[1] === 'download') {
			await client[botNum].send(
				from,
				{ video: { url: args[2].replace('https', 'http') } },
				{ groupMetadata, quoted: message }
			);
			return;
		} else if (type === 'templateButtonReplyMessage' && args[1] === 'get') {
			const video = await ytv(args[2], 'mp4');
			const { mp4 } = video;

			await client[botNum].send(
				from,
				{
					title: 'YouTube MP4'.formatHeaders(),
					footer: 'Made by Void Bot. Powered by Hidden Finder',
					text: '\t',
					buttonText: 'Open List',
					sections: mp4.map((v, i) => ({
						rows: [{ title: `${i + 1}. ${v.quality} ${v.filesizeF}`, rowId: `.ytmp4 download ${v.dlUrl}` }],
						title: '\t'
					}))
				},
				{ groupMetadata }
			);
			return;
		}

		if (!query) {
			return await client[botNum].reply('Please provide a URL', { from, quoted: message, groupMetadata });
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		for (const Query of queries) {
			const video = await ytv(Query, 'mp4');

			INFOLOG(`${color('Downloading YouTube Video', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`);

			if ('error' in video) {
				client[botNum].reply(`Error while downloading YouTube Video\n\b${video.error}\n${Query}`, {
					from,
					quoted: message,
					groupMetadata
				});
				ERRLOG(`⚠️ ${color('Failed to Download YouTube Video', '#FF5555')} for ${color(prettyNumber, '#ff71ce')}`);

				continue;
			} else {
				const { title, description, timestamp, uploaded, views, author, urlChannel, link, thumbnail: image, url } = video;

				if (!link) {
					await client[botNum].reply(`Error while downloading YouTube Video\n\n${Query}`, {
						from,
						quoted: message,
						groupMetadata
					});
					ERRLOG(`⚠️ ${color('Failed to Download YouTube Video', '#FF5555')} for ${color(prettyNumber, '#ff71ce')}`);

					continue;
				}

				let capt = 'YouTube Video'.formatHeaders();

				capt += `\n\nTitle : ${title}\n`;
				capt += `Uploaded : ${uploaded}\n`;
				capt += `Views : ${numberWithCommas(views)}\n`;
				capt += `Author : ${author}\n`;
				capt += `Channel : ${urlChannel}\n`;
				capt += `Duration : ${timestamp ?? 'No Data'}\n`;
				capt += `Description : ${description ?? 'No Data'}\n`;

				let jpegThumbnail = sharp(new Buffer.from(await fetchBUFFER(image), 'base64'));

				jpegThumbnail = await jpegThumbnail.resize(300, 300).toBuffer();

				await client[botNum].send(from, {
					location: {
						degreesLatitude: 0,
						degreesLongitude: 0,
						jpegThumbnail
					},
					caption: capt,
					footer: 'Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪',
					buttons: [
						{
							buttonId: `.ytmp3 get ${url}`,
							buttonText: { displayText: 'Audio' },
							type: 1
						}
					]
				});

				await client[botNum].send(from, { video: { url: link } }, { groupMetadata, quoted: message });
				await delay(300);
			}
		}

		INFOLOG(`${color('Downloaded YouTube Video', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`);
	}
};
