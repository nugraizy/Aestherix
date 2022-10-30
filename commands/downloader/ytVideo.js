/* global botNum */
import dayjs from 'dayjs';
import sharp from 'sharp';

import { color, delay, ERRLOG, fetchBUFFER, INFOLOG, isURL, numberWithCommas, removeDuplicatesArray } from '../../helper/modules/index.js';
import { ytv2 as ytv } from '../../utils/youtube/index.js';

const regex = (input) => /(?:http(?:s|):\/\/|)(?:(?:www\.|)youtube(?:-nocookie|)\.com\/(?:shorts\/)?(?:watch\?.*(?:|&)v=|embed\/|v\/)|youtu\.be\/)?\/.+/.test(input);

export default {
	name: 'ytvideo',
	description: 'Downloads a YouTube video',
	usage: '!ytvideo <url>',
	aliases: ['ytv', 'ytmp4'],
	category: 'Downloader',
	cooldown: 12,
	limit: 8,
	status: 'enable',
	async run({ from, query, prettyNumber, message }, client) {
		const time = dayjs().format('HH:mm:ss DD/MM');

		if (!query) {
			return await client[botNum].reply({ from, quoted: message }, 'Please provide a URL');
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		if (queries.length == 1 && isURL(queries) && !regex(queries)) {
			return await client[botNum].reply({ from, quoted: message }, 'This is not a valid YouTube URL.');
		}

		for (const Query of queries) {
			if (isURL(Query) && !regex(Query)) {
				return await client[botNum].reply({ from, quoted: message }, `[ ${Query} ] This isn't a valid YouTube URL.`);
			}

			const video = await ytv(Query);

			INFOLOG(`[${color(time, 'cyan')}]`, `${color('Downloading YouTube Video', '#01cdfe')} for ${color(prettyNumber, '#ff71ce')}`);

			if ('error' in video) {
				client[botNum].reply({ from, quoted: message }, `Error while downloading YouTube Video\n\b${video.error}\n${Query}`);
				ERRLOG(`[${color(time, 'cyan')}]`, `⚠️ ${color('Failed to Download YouTube Video', 'red')} for ${color(prettyNumber, '#ff71ce')}`);

				continue;
			} else {
				const { title, description, timestamp, uploaded, views, author, urlChannel, dlLink, filesize, filesizeF, thumbnail: image } = video;

				if (!dlLink) {
					await client[botNum].reply({ from, quoted: message }, `Error while downloading YouTube Video\n\n${Query}`);
					ERRLOG(`[${color(time, 'cyan')}]`, `⚠️ ${color('Failed to Download YouTube Video', 'red')} for ${color(prettyNumber, '#ff71ce')}`);

					continue;
				}

				let capt = '``` • YouTube Video```\n\n';

				capt += `Title : ${title}\n`;
				capt += `Uploaded : ${uploaded}\n`;
				capt += `Views : ${numberWithCommas(views)}\n`;
				capt += `Author : ${author}\n`;
				capt += `Channel : ${urlChannel}\n`;
				capt += `File Size : ${filesize} (${filesizeF})\n`;
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
					templateButtons: [],
					headerType: 1,
				});
				await client[botNum].sendMessage(from, { video: { url: dlLink.replace('https', 'http') }, caption: capt.trim() });
				await delay(300);
			}
		}

		INFOLOG(`[${color(time, 'cyan')}]`, `${color('Downloaded YouTube Video', '#01cdfe')} for ${color(prettyNumber, '#ff71ce')}`);
	},
};
