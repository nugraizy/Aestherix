import dayjs from 'dayjs';
import parser from 'yargs-parser';

import { color, delay, ERRLOG, INFOLOG, isURL, numberWithCommas, removeDuplicatesArray } from '../../utils/modules/index.js';
import { tiktok } from '../../utils/tiktok/index.js';

const regex = (input) => /(?:https:?\/{2})?(?:w{3}|vm|vt|t)?\.?tiktok.com\/([^\s&]+)/gi.test(input);

/**
 * @type {import('../types.js').Plugins}
 */
export default {
	name: 'tiktokpost',
	description: 'Downloads TikTok posts.',
	usage:
		'!tiktokpost <url(s)> (you can send multiple link using space in between) [options]\nOptions:\n-wm, --watermark: Download with watermark\n-nowm, --nowatermark: Download without watermark',
	aliases: ['tiktokposts', 'ttimage', 'ttphoto', 'ttimages', 'ttphotos', 'ttvideo', 'ttvideos', 'ttvid', 'ttv', 'tiktok'],
	category: 'Downloader',
	limit: 2,
	cooldown: 8,
	status: 'enable',
	async run({ from, query, prettyNumber, message, groupMetadata }, client) {
		if (!query) {
			return await client[botNum].reply('Please provide a URL', { from, quoted: message, groupMetadata });
		}

		let { _: urls } = parser(query);
		let { no_wm: NO_WM, wm: WITH_WM } = parser(query.toLowerCase(), {
			configuration: {
				'short-option-groups': false
			},
			alias: {
				no_wm /* eslint-disable-line*/: ['nowm', 'no-wm', 'no-watermark', 'no_watermark', 'nowatermark'],
				wm: ['with-watermark', 'with_watermark', 'watermark']
			}
		});

		if (Array.isArray(NO_WM)) {
			NO_WM = removeDuplicatesArray(NO_WM)[0];
		}

		if (Array.isArray(WITH_WM)) {
			WITH_WM = removeDuplicatesArray(WITH_WM)[0];
		}

		if (urls.length === 1 && !isURL(urls[0])) {
			return await client[botNum].reply('Please specify a valid url', { from, quoted: message, groupMetadata });
		}

		if (urls.length === 1 && !regex(urls[0])) {
			return await client[botNum].reply('Please specify a valid TikTok url', { from, quoted: message, groupMetadata });
		}

		for (const url of removeDuplicatesArray(urls.map((v) => v.trim()))) {
			if (!isURL(url)) {
				await client[botNum].reply('Please specify a valid url', { from, quoted: message, groupMetadata });

				continue;
			} else if (!regex(url)) {
				await client[botNum].reply('Please specify a valid TikTok url', { from, quoted: message, groupMetadata });

				continue;
			}

			const container = await tiktok.downloadMedia(url);

			INFOLOG(`${color('Downloading TikTok Media', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`);

			if ('error' in container) {
				ERRLOG(`⚠️ ${color('Error while downloading TikTok Video', '#ff0000')} for ${color(prettyNumber, '#ff71ce')}`);
				await client[botNum].reply(
					`Error while downloading TikTok Video\n\n${url.split(' ')[0]}\nMSG: ${container.error || ''}`,
					{
						from,
						quoted: message,
						groupMetadata
					}
				);

				continue;
			}

			const date = dayjs(container.published * 1000).format('HH:mm:ss DD/MM/YYYY');
			let capt = `TikTok ${container.type === 'images' ? 'Slide' : 'Video'}`.formatHeaders();

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
				capt += `Tot. Image : ${container.urls.images.length}\n`;

				const images = container.urls.images;

				let data;

				for (const { url, index } of images) {
					if (index === 1) {
						data = await client[botNum].send(
							from,
							{
								image: { url },
								caption: capt.trim()
							},
							{ groupMetadata, quoted: message }
						);
						continue;
					}

					client[botNum].send(
						from,
						{
							image: { url }
						},
						{ groupMetadata, quoted: data }
					);

					await delay(100);
				}

				await delay(100);
				INFOLOG(`${color('Downloaded TikTok Media', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`);

				continue;
			}

			await client[botNum].send(
				from,
				{
					video: {
						url: container.urls[!NO_WM && !WITH_WM ? 'withNoWatermark' : WITH_WM ? 'withWatermark' : 'withNoWatermark']
					},
					caption: capt.trim()
				},
				{ groupMetadata, quoted: message }
			);

			await delay(100);
			INFOLOG(`${color('Downloaded TikTok Media', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`);
		}
	}
};
