/* global botNum */
import moment from 'moment-timezone';
import path from 'path';
import sharp from 'sharp';

import { __dirname } from '../../index.js';
import { color, delay, ERRLOG, fetchBUFFER, INFOLOG, isURL, numberWithCommas, removeDuplicatesArray } from '../../helper/modules/index.js';
import { toOpus } from '../../utils/converter/index.js';
import { yta2 as yta } from '../../utils/youtube/index.js';

const regex = (input) => /(?:http(?:s|):\/\/|)(?:(?:www\.|)youtube(?:-nocookie|)\.com\/(?:shorts\/)?(?:watch\?.*(?:|&)v=|embed\/|v\/)|youtu\.be\/)?\/.+/.test(input);

export default {
	name: 'ytaudio',
	description: 'Downloads a YouTube audio',
	usage: '!ytaudio <url>',
	aliases: ['yta', 'ytmp3'],
	category: 'Downloader',
	cooldown: 7,
	limit: 8,
	status: 'enable',
	async run({ from, query, prettyNumber, filename, message }, client) {
		const time = moment().format('HH:mm:ss DD/MM');

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

			const audio = await yta(Query);

			INFOLOG(`[${color(time, 'cyan')}]`, `${color('Downloading YouTube Audio', '#01cdfe')} for ${color(prettyNumber, '#ff71ce')}`);

			if ('error' in audio) {
				client[botNum].reply({ from, quoted: message }, audio.error);
				ERRLOG(`[${color(time, 'cyan')}]`, `${color('Failed to Download YouTube Audio', 'red')} for ${color(prettyNumber, '#ff71ce')}`);
			} else {
				const { title, description, timestamp, uploaded, views, author, urlChannel, dlLink, filesize, filesizeF, thumbnail: image } = audio;

				if (!dlLink) {
					client[botNum].reply({ from, quoted: message }, `Error while downloading YouTube Video\n\n${Query}`);
					ERRLOG(`[${color(time, 'cyan')}]`, `${color('Failed to Download YouTube Video', 'red')} for ${color(prettyNumber, '#ff71ce')}`);

					continue;
				}

				let capt = '``` • YouTube Audio```\n\n';

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
				await client[botNum].sendMessage(
					from,
					{
						document: await toOpus('opus', {
							input: path.join(__dirname, `temporary_files/${filename}`),
							output: path.join(__dirname, `temporary_files/${filename}-done`),
							media: dlLink.replace('https', 'http'),
						}),
						fileName: `${title}.opus`,
						mimetype: 'audio/opus',
						caption: capt.trim(),
					},
					{ quoted: message },
				);
				await delay(300);
			}
		}

		INFOLOG(`[${color(time, 'cyan')}]`, `${color('Downloaded YouTube Audio', '#01cdfe')} for ${color(prettyNumber, '#ff71ce')}`);
	},
};
