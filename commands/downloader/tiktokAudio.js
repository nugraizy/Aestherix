/* global botNum */
import dayjs from 'dayjs';
import path from 'path';
import parser from 'yargs-parser';

import { __dirname } from '../../index.js';
import { color, ERRLOG, INFOLOG, isOne, isURL, removeDuplicatesArray } from '../../helper/modules/index.js';
import { toOpus } from '../../utils/converter/index.js';
import { mime } from '../../utils/misc/index.js';
import { tiktokAPI } from '../../utils/tiktok/index.js';

const regex = (input) => /(?:https:?\/{2})?(?:w{3}|vm|vt|t)?\.?tiktok.com\/([^\s&]+)/gi.test(input);

export default {
	name: 'tiktokaudio',
	description: 'Downloads TikTok audio.',
	usage: '!tiktokaudio <url> (you can send multiple link using space in between)',
	aliases: ['tiktokaudio', 'ttaudio', 'ttaud'],
	category: 'Downloader',
	cooldown: 7,
	limit: 6,
	status: 'enable',
	async run({ from, query, prettyNumber, filename, message }, client) {
		const time = dayjs().format('HH:mm:ss DD/MM');

		if (!query) {
			return await client[botNum].reply({ from, quoted: message }, 'Please provide a URL');
		}

		let { _: urls } = parser(query);

		if (isOne(urls.length) && !isURL(urls[0])) {
			return await client[botNum].reply({ from, quoted: message }, 'Please specify a valid url');
		}

		if (isOne(urls.length) && !regex(urls[0])) {
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

			const audio = await tiktokAPI(url);

			INFOLOG(`[${color(time, 'cyan')}]`, `${color('Downloading TikTok Audio', '#01cdfe')} for ${color(prettyNumber, '#ff71ce')}`);

			if ('error' in audio || audio.status === 'error') {
				await client[botNum].reply({ from, quoted: message }, audio.error || audio.message);

				ERRLOG(`[${color(time, 'cyan')}]`, `⚠️ ${color('Failed to Download TikTok Audio', 'red')} for ${color(prettyNumber, '#ff71ce')}`);

				continue;
			}

			await client[botNum].sendMessage(
				from,
				{
					document: await toOpus('opus', {
						input: path.join(__dirname, `temporary_files/${filename}`),
						output: path.join(__dirname, `temporary_files/${filename}-done`),
						media: audio.url.withNoWatermark,
					}),
					fileName: `${audio.musicTitle}.mp3`,
					mimetype: mime('mp3'),
				},
				{ quotes: message },
			);
		}

		INFOLOG(`[${color(time, 'cyan')}]`, `${color('Downloaded TikTok Audio', '#01cdfe')} for ${color(prettyNumber, '#ff71ce')}`);
	},
};
