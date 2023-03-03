/* global botNum */
import dayjs from 'dayjs';
import path from 'path';
import parser from 'yargs-parser';

import { __dirname } from '../../index.js';
import { color, delay, ERRLOG, INFOLOG, isURL, removeDuplicatesArray } from '../../helper/modules/index.js';
import { toOpus } from '../../utils/converter/index.js';
import { mime } from '../../utils/misc/index.js';
import { tiktokAPI } from '../../utils/tiktok/index.js';

const regex = (input) => /(?:https:?\/{2})?(?:w{3}|vm|vt|t)?\.?tiktok.com\/([^\s&]+)/gi.test(input);

export default {
	name: 'tiktokmusic',
	description: 'Downloads TikTok music that used in the video.',
	usage:
		'!tiktokmusic <url> (you can send multiple link using space in between) [options]\nOptions:\n-wm, --watermark: Download with watermark\n-nowm, --nowatermark: Download without watermark',
	aliases: ['tiktokmusics', 'tiktokmusik', 'ttmusic', 'ttmusik', 'ttm'],
	category: 'Downloader',
	cooldown: 7,
	limit: 6,
	status: 'enable',
	async run({ from, query, prettyNumber, message, filename }, client) {
		const time = dayjs().format('HH:mm:ss DD/MM');

		if (!query) {
			return await client[botNum].reply({ from, quoted: message }, 'Please provide a URL');
		}

		let { _: urls } = parser(query);

		if (urls.length === 1 && !isURL(urls[0])) {
			return await client[botNum].reply({ from, quoted: message }, 'Please specify a valid url');
		}

		if (urls.length === 1 && !regex(urls[0])) {
			return await client[botNum].reply({ from, quoted: message }, 'Please specify a valid TikTok url');
		}

		urls = removeDuplicatesArray(urls.map((v) => v.trim()));

		for (const url of urls) {
			if (!isURL(url)) {
				await client[botNum].reply({ from, quoted: message }, 'Please specify a valid url');

				continue;
			} else if (!regex(url)) {
				await client[botNum].reply({ from, quoted: message }, 'Please specify a valid TikTok url');

				continue;
			}

			const music = await tiktokAPI(url);

			INFOLOG(
				`[${color(time, 'cyan')}]`,
				`${color('Downloading TikTok Music', '#01cdfe')} for ${color(prettyNumber, '#ff71ce')}`,
			);

			if ('error' in music) {
				ERRLOG(
					`[${color(time, 'cyan')}]`,
					`⚠️ ${color('Error while downloading TikTok Music', '#ff0000')} for ${color(prettyNumber, '#ff71ce')}`,
				);
				await client[botNum].reply({ from, quoted: message }, `Error while downloading TikTok Music\n\n${url.split(' ')[0]}`);

				continue;
			}

			await client[botNum].sendMessage(
				from,
				{
					document: await toOpus('opus', {
						input: path.join(__dirname, `temporary_files/${filename}`),
						output: path.join(__dirname, `temporary_files/${filename}-done`),
						media: music.url.music.replace('https', 'http'),
					}),
					fileName: `${music.authorMusic} - ${music.musicTitle}.mp3`,
					mimetype: mime('mp3'),
					templateButtons: [
						{ urlButton: { displayText: 'User Profile Link', url: `https://www.tiktok.com/@${music.author}` } },
					],
					footer: '\t',
				},
				{ quoted: message },
			);

			await delay(300);
			INFOLOG(
				`[${color(time, 'cyan')}]`,
				`${color('Downloaded TikTok Music', '#01cdfe')} for ${color(prettyNumber, '#ff71ce')}`,
			);
		}
	},
};
