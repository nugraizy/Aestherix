/* global botNum */
import dayjs from 'dayjs';
import path from 'path';
import sharp from 'sharp';

import { __dirname } from '../../index.js';
import {
	color,
	ERRLOG,
	fetchBUFFER,
	INFOLOG,
	isURL,
	numberWithCommas,
	removeDuplicatesArray,
} from '../../helper/modules/index.js';
import { toOpus } from '../../utils/converter/index.js';
import { youtubeMainDownload as yta } from '../../utils/youtube/index.js';

const regex = (input) =>
	/(?:http(?:s|):\/\/|)(?:(?:www\.|)youtube(?:-nocookie|)\.com\/(?:shorts\/)?(?:watch\?.*(?:|&)v=|embed\/|v\/)|youtu\.be\/)?\/.+/.test(
		input,
	);

export default {
	name: 'ytaudio',
	description: 'Downloads a YouTube audio',
	usage: '!ytaudio <url>',
	aliases: ['yta', 'ytmp3'],
	category: 'Downloader',
	cooldown: 7,
	limit: 8,
	status: 'enable',
	async run({ from, query, prettyNumber, filename, message, type, args }, client) {
		const time = dayjs().format('HH:mm:ss DD/MM');

		if (type === 'listResponseMessage' && args[1] === 'download') {
			const audioBuffer = await toOpus('opus', {
				input: path.join(__dirname, `temporary_files/${filename}`),
				output: path.join(__dirname, `temporary_files/${filename}-done`),
				media: args[2].replace('https', 'http'),
			});

			await client[botNum].sendMessage(
				from,
				{
					document: audioBuffer,
					fileName: `${args.slice(3).join(' ')}.opus`,
					mimetype: 'audio/opus',
					caption: '',
				},
				{ quoted: message },
			);
			await client[botNum].sendMessage(from, {
				audio: audioBuffer,
				ptt: false,
			});
			return;
		} else if (type === 'listResponseMessage' && args[1] === 'get') {
			const video = await ytv(args[2], 'mp4');
			const { title, mp4 } = video;
			await client[botNum].sendMessage(from, {
				title: 'YouTube MP4'.formatHeaders(),
				footer: 'Made by Void Bot. Powered by Hidden Finder',
				text: '\t',
				buttonText: 'Open List',
				sections: mp4.map((v, i) => ({
					rows: [{ title: `${i + 1}. ${v.quality} ${v.filesizeF}`, rowId: `.ytmp4 download ${v.dlUrl} ${title}` }],
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

			const audio = await yta(Query, 'mp3');

			INFOLOG(
				`[${color(time, 'cyan')}]`,
				`${color('Downloading YouTube Audio', '#01cdfe')} for ${color(prettyNumber, '#ff71ce')}`,
			);

			if ('error' in audio) {
				client[botNum].reply({ from, quoted: message }, audio.error);
				ERRLOG(
					`[${color(time, 'cyan')}]`,
					`⚠️ ${color('Failed to Download YouTube Audio', 'red')} for ${color(prettyNumber, '#ff71ce')}`,
				);
			} else {
				const { title, description, timestamp, uploaded, views, author, urlChannel, mp3, thumbnail: image, url } = audio;

				if (!dlLink) {
					client[botNum].reply({ from, quoted: message }, `Error while downloading YouTube Video\n\n${Query}`);
					ERRLOG(
						`[${color(time, 'cyan')}]`,
						`⚠️ ${color('Failed to Download YouTube Video', 'red')} for ${color(prettyNumber, '#ff71ce')}`,
					);

					continue;
				}

				let capt = 'YouTube Audio'.formatHeaders();

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
								displayText: 'Video',
								id: `.ytmp4 get ${url}`,
							},
						},
					],
					headerType: 1,
				});

				await client[botNum].sendMessage(from, {
					title: 'YouTube MP3'.formatHeaders(),
					footer: 'Made by Void Bot. Powered by Hidden Finder',
					text: '\t',
					buttonText: 'Open List',
					sections: mp3.map((v, i) => ({
						rows: [{ title: `${i + 1}. 📼 ${v.quality} 💾 ${v.filesizeF}`, rowId: `.ytmp3 download ${v.dlUrl}` }],
						title: `\t`,
					})),
				});
			}
		}

		INFOLOG(
			`[${color(time, 'cyan')}]`,
			`${color('Downloaded YouTube Audio', '#01cdfe')} for ${color(prettyNumber, '#ff71ce')}`,
		);
	},
};
