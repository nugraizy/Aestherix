/* global botNum */
import dayjs from 'dayjs';
import parser from 'yargs-parser';

import {
	color,
	delay,
	ERRLOG,
	INFOLOG,
	isOne,
	isURL,
	numberWithCommas,
	removeDuplicatesArray,
} from '../../helper/modules/index.js';
import { tiktokAPI } from '../../utils/tiktok/index.js';

const regex = (input) => /(?:https:?\/{2})?(?:w{3}|vm|vt|t)?\.?tiktok.com\/([^\s&]+)/gi.test(input);

export default {
	name: 'tiktokvideo',
	description: 'Downloads TikTok video.',
	usage:
		'!tiktokvideo <url> (you can send multiple link using space in between) [options]\nOptions:\n-wm, --watermark: Download with watermark\n-nowm, --nowatermark: Download without watermark',
	aliases: ['tiktokvideos', 'ttvideo', 'ttvid', 'ttv', 'tiktok'],
	category: 'Downloader',
	limit: 2,
	cooldown: 8,
	status: 'enable',
	async run({ from, query, prettyNumber, message }, client) {
		const time = dayjs().format('HH:mm:ss DD/MM');

		if (!query) {
			return await client[botNum].reply({ from, quoted: message }, 'Please provide a URL');
		}

		let { _: urls } = parser(query);
		let { no_wm: NO_WM, wm: WITH_WM } = parser(query.toLowerCase(), {
			configuration: {
				'short-option-groups': false,
			},
			alias: {
				no_wm /* eslint-disable-line*/: ['nowm', 'no-wm', 'no-watermark', 'no_watermark', 'nowatermark'],
				wm: ['with-watermark', 'with_watermark', 'watermark'],
			},
		});

		if (Array.isArray(NO_WM)) {
			NO_WM = removeDuplicatesArray(NO_WM)[0];
		}

		if (Array.isArray(WITH_WM)) {
			WITH_WM = removeDuplicatesArray(WITH_WM)[0];
		}

		if (isOne(urls.length) && !isURL(urls[0])) {
			return await client[botNum].reply({ from, quoted: message }, 'Please specify a valid url');
		}

		if (isOne(urls.length) && !regex(urls[0])) {
			return await client[botNum].reply({ from, quoted: message }, 'Please specify a valid TikTok url');
		}

		for (const url of removeDuplicatesArray(urls.map((v) => v.trim()))) {
			if (!isURL(url)) {
				await client[botNum].reply({ from, quoted: message }, 'Please specify a valid url');

				continue;
			} else if (!regex(url)) {
				await client[botNum].reply({ from, quoted: message }, 'Please specify a valid TikTok url');

				continue;
			}

			const container = await tiktokAPI(url);

			INFOLOG(
				`[${color(time, 'cyan')}]`,
				`${color('Downloading TikTok Media', '#01cdfe')} for ${color(prettyNumber, '#ff71ce')}`,
			);

			if ('error' in container) {
				ERRLOG(
					`[${color(time, 'cyan')}]`,
					`⚠️ ${color('Error while downloading TikTok Video', '#ff0000')} for ${color(prettyNumber, '#ff71ce')}`,
				);
				await client[botNum].reply({ from, quoted: message }, `Error while downloading TikTok Video\n\n${url.split(' ')[0]}`);

				continue;
			}

			const date = dayjs(container.published * 1000).format('HH:mm:ss DD/MM/YYYY');
			let capt = 'TikTok Video'.formatHeaders();

			capt += `\n\nAuthor : ${container.author}\n`;
			capt += `Username : ${container.nickname}\n`;
			capt += `Verifies : ${container.verified ? 'Verified' : 'Not Verified'}\n`;
			capt += `Followers : ${numberWithCommas(container.followers)}\n`;
			capt += `Following : ${numberWithCommas(container.following)}\n`;
			capt += `Tot. Video : ${numberWithCommas(container.totalVideo)}\n`;
			capt += `Liked : ${numberWithCommas(container.liked)}\n`;
			capt += `Shared : ${numberWithCommas(container.shared)}\n`;
			capt += `Comment : ${numberWithCommas(container.comment)}\n`;
			capt += `Published : ${date}\n`;
			capt += `View : ${numberWithCommas(container.view)}\n`;

			if (container.type !== 'images') {
				capt += `Duration : ${container.videoDuration}\n`;
			}

			capt += `Music : ${container.musicTitle}\n`;
			capt += `Description : ${container.videoDescription}\n`;

			if (container.type === 'images') {
				capt += `Tot. Image : ${container.url.images.length}\n`;

				const images = container.url.images;

				for (const { url, index } of images) {
					client[botNum].sendMessage(
						from,
						{
							image: {
								url,
							},
							caption: index === 1 ? capt.trim() : '',
						},
						{ quoted: message },
					);
					await delay(100);
				}

				await delay(100);
				INFOLOG(
					`[${color(time, 'cyan')}]`,
					`${color('Downloaded TikTok Media', '#01cdfe')} for ${color(prettyNumber, '#ff71ce')}`,
				);

				return;
			}

			await client[botNum].sendMessage(
				from,
				{
					video: {
						url: container.url[
							!NO_WM && !WITH_WM ? 'withNoWatermark' : WITH_WM ? 'withWatermark' : NO_WM ? 'withNoWatermark' : 'withWatermark'
						],
					},
					caption: capt.trim(),
				},
				{ quoted: message },
			);

			await delay(100);
			INFOLOG(
				`[${color(time, 'cyan')}]`,
				`${color('Downloaded TikTok Media', '#01cdfe')} for ${color(prettyNumber, '#ff71ce')}`,
			);
		}
	},
};
