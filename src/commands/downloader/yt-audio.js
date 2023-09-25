import dayjs from 'dayjs';
import sharp from 'sharp';

import {
	color,
	ERRLOG,
	fetchBUFFER,
	INFOLOG,
	isURL,
	numberWithCommas,
	removeDuplicatesArray
} from '../../utils/modules/index.js';
import { youtubeMainDownload as yta } from '../../utils/youtube/index.js';

const regex = (input) =>
	/(?:http(?:s|):\/\/|)(?:(?:www\.|)youtube(?:-nocookie|)\.com\/(?:shorts\/)?(?:watch\?.*(?:|&)v=|embed\/|v\/)|youtu\.be\/)?\/.+/.test(
		input
	);

/**
 * @type {import('../types.js').Plugins}
 */
export default {
	name: 'ytaudio',
	description: 'Downloads a YouTube audio',
	usage: '!ytaudio <url>',
	aliases: ['yta', 'ytmp3'],
	category: 'Downloader',
	cooldown: 7,
	limit: 8,
	status: 'enable',
	async run({ from, query, prettyNumber, message, type, args, groupMetadata, isGroup }, client) {
		const time = dayjs().format('HH:mm:ss DD/MM');

		if (type === 'listResponseMessage' && args[1] === 'download') {
			await client[botNum].send(
				from,
				{
					document: { url: args[2] },
					fileName: `${args.slice(3).join(' ')}.opus`,
					mimetype: 'audio/opus',
					caption: ''
				},
				{ groupMetadata, quoted: message }
			);
			return;
		} else if (type === 'templateButtonReplyMessage' && args[1] === 'get') {
			const video = await yta(args[2], 'mp4');
			const { title, mp4 } = video;

			await client[botNum].send(from, {
				title: 'YouTube MP4'.formatHeaders(),
				footer: 'Made by Void Bot. Powered by Hidden Finder',
				text: '\t',
				buttonText: 'Open List',
				sections: mp4.map((v, i) => ({
					rows: [{ title: `${i + 1}. ${v.quality} ${v.filesizeF}`, rowId: `.ytmp4 download ${v.dlUrl} ${title}` }],
					title: '\t'
				}))
			});
			return;
		}

		if (!query) {
			return await client[botNum].reply({ groupMetadata, from, quoted: message }, 'Please provide a URL');
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		if (queries.length === 1 && isURL(queries) && !regex(queries)) {
			return await client[botNum].reply({ groupMetadata, from, quoted: message }, 'This is not a valid YouTube URL.');
		}

		for (const Query of queries) {
			if (isURL(Query) && !regex(Query)) {
				return await client[botNum].reply(
					{ groupMetadata, from, quoted: message },
					`[ ${Query} ] This isn't a valid YouTube URL.`
				);
			}

			const audio = await yta(Query, 'mp3');

			INFOLOG(
				`[${color(time, 'cyan')}]`,
				`${color('Downloading YouTube Audio', '#01cdfe')} for ${color(prettyNumber, '#ff71ce')}`
			);

			if ('error' in audio) {
				client[botNum].reply({ groupMetadata, from, quoted: message }, audio.error);
				ERRLOG(
					`[${color(time, 'cyan')}]`,
					`⚠️ ${color('Failed to Download YouTube Audio', 'red')} for ${color(prettyNumber, '#ff71ce')}`
				);
			} else {
				const { title, description, timestamp, uploaded, views, author, urlChannel, mp3, thumbnail: image, url } = audio;

				if (!mp3) {
					client[botNum].reply({ groupMetadata, from, quoted: message }, `Error while downloading YouTube Video\n\n${Query}`);
					ERRLOG(
						`[${color(time, 'cyan')}]`,
						`⚠️ ${color('Failed to Download YouTube Video', 'red')} for ${color(prettyNumber, '#ff71ce')}`
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

				await client[botNum].send(
					from,
					{
						location: {
							degreesLatitude: 0,
							degreesLongitude: 0,
							jpegThumbnail
						},
						caption: capt,
						footer: 'Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪',
						buttons: [
							{
								buttonId: `.ytmp4 get ${url}`,
								buttonText: { displayText: 'Video' },
								type: 1
							}
						]
					},
					{ groupMetadata }
				);

				if (isGroup) {
					await client[botNum].send(
						from,
						{
							document: { url: mp3[0].dlUrl },
							fileName: `${title}.mp3`,
							mimetype: 'audio/mp3',
							caption: ''
						},
						{ groupMetadata, quoted: message }
					);
					continue;
				}

				await client[botNum].send(
					from,
					{
						title: 'YouTube MP3'.formatHeaders(),
						footer: 'Made by Void Bot. Powered by Hidden Finder',
						text: '\t',
						buttonText: 'Open List',
						sections: mp3.map((v, i) => ({
							rows: [{ title: `${i + 1}. 📼 ${v.quality} 💾 ${v.filesizeF}`, rowId: `.ytmp3 download ${v.dlUrl} ${title}` }],
							title: '\t'
						}))
					},
					{ groupMetadata }
				);
			}
		}

		INFOLOG(
			`[${color(time, 'cyan')}]`,
			`${color('Downloaded YouTube Audio', '#01cdfe')} for ${color(prettyNumber, '#ff71ce')}`
		);
	}
};
