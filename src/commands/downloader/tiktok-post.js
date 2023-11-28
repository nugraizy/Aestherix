import dayjs from 'dayjs';
import parser from 'yargs-parser';

import { color, delay, ERRLOG, INFOLOG, numberWithCommas, removeDuplicatesArray } from '../../utils/modules/index.js';
import { tiktok } from '../../utils/tiktok/index.js';

/**
 * @type {import('../types.js').Plugins}
 */
export default {
	name: 'tiktokpost',
	minifiedDescription: 'Download TikTok Post',
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
			return await client.instance.reply('Please provide a URL', { from, quoted: message, groupMetadata });
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

		const posts = await tiktok.download.post(urls);

		for (const data in posts) {
			if ('error' in posts[data]) {
				await client.instance.reply(`Error while downloading TikTok post\n\n${posts[data].error}\n${data}`, {
					from,
					quoted: message,
					groupMetadata
				});

				ERRLOG(`⚠️ ${color('Failed to Download TikTok Post', '#FF5555')} for ${color(prettyNumber, '#ff71ce')}`);
				continue;
			}

			INFOLOG(`${color('Downloading TikTok Media', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`);

			const date = dayjs(posts[data].published * 1000).format('HH:mm:ss DD/MM/YYYY');
			let capt = `TikTok ${posts[data].type === 'images' ? 'Slide' : 'Video'}`.formatHeaders();

			capt += `\n\nAuthor : ${posts[data].author}\n`;
			capt += `Username : ${posts[data].nickname}\n`;
			capt += `Verifies : ${posts[data].verified ? 'Verified' : 'Not Verified'}\n`;
			capt += `Followers : ${numberWithCommas(posts[data].followers)}\n`;
			capt += `Following : ${numberWithCommas(posts[data].following)}\n`;
			capt += `Tot. Video : ${numberWithCommas(posts[data].totalVideo)}\n`;
			capt += `Liked : ${numberWithCommas(posts[data].liked)}\n`;
			capt += `Shared : ${numberWithCommas(posts[data].shared)}\n`;
			capt += `Comment : ${numberWithCommas(posts[data].comment)}\n`;
			capt += `Published : ${date}\n`;
			capt += `View : ${numberWithCommas(posts[data].view)}\n`;

			if (posts[data].type !== 'images') {
				capt += `Duration : ${posts[data].videoDuration}\n`;
			}

			capt += `Music : ${posts[data].musicTitle}\n`;
			capt += `Description : ${posts[data].videoDescription}\n`;

			if (posts[data].type === 'images') {
				capt += `Tot. Image : ${posts[data].urls.images.length}\n`;

				const images = posts[data].urls.images;

				let dataMessage;

				for (const { url, index } of images) {
					if (index === 1) {
						dataMessage = await client.instance.send(
							from,
							{
								image: { url },
								caption: capt.trim()
							},
							{ groupMetadata, quoted: message }
						);
						continue;
					}

					client.instance.send(
						from,
						{
							image: { url }
						},
						{ groupMetadata, quoted: dataMessage }
					);

					await delay(100);
				}

				await delay(100);
				INFOLOG(`${color('Downloaded TikTok Media', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`);

				continue;
			}

			await client.instance.send(
				from,
				{
					video: {
						url: posts[data].urls[!NO_WM && !WITH_WM ? 'withNoWatermark' : WITH_WM ? 'withWatermark' : 'withNoWatermark']
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
