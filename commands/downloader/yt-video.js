/* global botNum */
import dayjs from 'dayjs';
import sharp from 'sharp';

import {
	color,
	delay,
	ERRLOG,
	fetchBUFFER,
	INFOLOG,
	isURL,
	numberWithCommas,
	removeDuplicatesArray,
} from '../../helper/modules/index.js';
import { youtubeMainDownload as ytv } from '../../utils/youtube/index.js';

const regex = (input) =>
	/(?:http(?:s|):\/\/|)(?:(?:www\.|)youtube(?:-nocookie|)\.com\/(?:shorts\/)?(?:watch\?.*(?:|&)v=|embed\/|v\/)|youtu\.be\/)?\/.+/.test(
		input,
	);

export default {
	name: 'ytvideo',
	description: 'Downloads a YouTube video',
	usage: '!ytvideo <url>',
	aliases: ['ytv', 'ytmp4'],
	category: 'Downloader',
	cooldown: 12,
	limit: 8,
	status: 'enable',
	async run({ from, query, prettyNumber, message, type, args }, client) {
		const time = dayjs().format('HH:mm:ss DD/MM');

		if (type === 'listResponseMessage' && args[1] === 'download') {
			await client[botNum].sendMessage(from, { video: { url: args[2].replace('https', 'http') } }, { quoted: message });
			return;
		} else if (type === 'listResponseMessage' && args[1] === 'get') {
			const video = await ytv(args[2], 'mp4');
			const { mp4 } = video;
			await client[botNum].sendMessage(from, {
				title: 'YouTube MP4'.formatHeaders(),
				footer: 'Made by Void Bot. Powered by Hidden Finder',
				text: '\t',
				buttonText: 'Open List',
				sections: mp4.map((v, i) => ({
					rows: [{ title: `${i + 1}. ${v.quality} ${v.filesizeF}`, rowId: `.ytmp4 download ${v.dlUrl}` }],
					title: `\t`,
				})),
			});
			return;
		}

		if (!query) {
			return await client[botNum].reply({ from, quoted: message }, 'Please provide a URL');
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		if (queries.length === 1 && isURL(queries) && !regex(queries)) {
			return await client[botNum].reply({ from, quoted: message }, 'This is not a valid YouTube URL.');
		}

		for (const Query of queries) {
			if (isURL(Query) && !regex(Query)) {
				return await client[botNum].reply({ from, quoted: message }, `[ ${Query} ] This isn't a valid YouTube URL.`);
			}

			const video = await ytv(Query, 'mp4');

			INFOLOG(
				`[${color(time, 'cyan')}]`,
				`${color('Downloading YouTube Video', '#01cdfe')} for ${color(prettyNumber, '#ff71ce')}`,
			);

			if ('error' in video) {
				client[botNum].reply({ from, quoted: message }, `Error while downloading YouTube Video\n\b${video.error}\n${Query}`);
				ERRLOG(
					`[${color(time, 'cyan')}]`,
					`⚠️ ${color('Failed to Download YouTube Video', 'red')} for ${color(prettyNumber, '#ff71ce')}`,
				);

				continue;
			} else {
				const {
					title,
					description,
					timestamp,
					uploaded,
					views,
					author,
					urlChannel,
					mp4,
					filesize,
					filesizeF,
					thumbnail: image,
					url,
				} = video;

				if (!mp4) {
					await client[botNum].reply({ from, quoted: message }, `Error while downloading YouTube Video\n\n${Query}`);
					ERRLOG(
						`[${color(time, 'cyan')}]`,
						`⚠️ ${color('Failed to Download YouTube Video', 'red')} for ${color(prettyNumber, '#ff71ce')}`,
					);

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

				await client[botNum].sendMessage(from, {
					location: {
						degreesLatitude: 0,
						degreesLongitude: 0,
						jpegThumbnail,
					},
					caption: capt,
					footer: 'Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪',
					templateButtons: [
						{
							quickReplyButton: {
								displayText: 'Audio',
								id: `.ytmp3 get ${url}`,
							},
						},
					],
					headerType: 1,
				});

				await client[botNum].sendMessage(from, {
					title: 'YouTube MP4'.formatHeaders(),
					footer: 'Made by Void Bot. Powered by Hidden Finder',
					text: '\t',
					buttonText: 'Open List',
					sections: mp4.map((v, i) => ({
						rows: [{ title: `${i + 1}. 📼 ${v.quality} 💾 ${v.filesizeF}`, rowId: `.ytmp4 download ${v.dlUrl}` }],
						title: `\t`,
					})),
				});
				await delay(300);
			}
		}

		INFOLOG(
			`[${color(time, 'cyan')}]`,
			`${color('Downloaded YouTube Video', '#01cdfe')} for ${color(prettyNumber, '#ff71ce')}`,
		);
	},
};
