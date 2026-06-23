import dayjs from 'dayjs';
import parser from 'yargs-parser';

import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
import { color, formatNumber, loggers, removeDuplicatesArray } from '../../utils/modules/index.js';
import { tiktok } from '../../utils/tiktok/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'tiktokpost',
	minifiedDescription: 'Download TikTok Post',
	description: 'Downloads TikTok posts.',
	usage:
		'!tiktokpost `<url(s)>` (you can send multiple link using space in between) `[options]`\nOptions:\n-wm, --watermark: Download with watermark\n-nowm, --nowatermark: Download without watermark',
	aliases: ['tiktokposts', 'ttimage', 'ttphoto', 'ttimages', 'ttphotos', 'ttvideo', 'ttvideos', 'ttvid', 'ttv', 'tiktok'],
	category: 'Downloader',
	limit: 2,
	cooldown: 8,
	status: 'enable',
	async run({ from, query, prettyNumber, message, device }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const DL = useLocale(locale, 'downloader');

		if (!query) {
			return await client.reply(from, L.errors.noUrl, message);
		}

		if (!tiktok) {
			tiktok = (await import('../../utils/tiktok/index.js')).tiktok;
		}

		const wait = await client.waitMessage(from, L.success.loading, message);

		let {
			_: urls,
			withNoWatermark,
			withWatermark
		} = parser(query, {
			configuration: {
				'short-option-groups': false
			},
			alias: {
				withNoWatermark: ['nowm', 'no-wm', 'no-watermark', 'no_watermark', 'nowatermark'],
				withWatermark: ['with-watermark', 'with_watermark', 'watermark']
			}
		});

		if (Array.isArray(withNoWatermark)) {
			withNoWatermark = removeDuplicatesArray(withNoWatermark)[0];
		}

		if (Array.isArray(withWatermark)) {
			withWatermark = removeDuplicatesArray(withWatermark)[0];
		}

		let success = 0;
		let error = 0;

		loggers.warning(`${color('Downloading TikTok Media', 'pink')} for ${color(prettyNumber, 'lilac')}`);

		const posts = await tiktok.download.post(urls, wait);

		for (const data in posts) {
			if (posts[data]?.error) {
				await client.reply(from, `Error while downloading TikTok post\n\n${posts[data].error}\n${data}`, message);
				loggers.error(`${color('Failed to Download TikTok Post', 'red')} for ${color(prettyNumber, 'lilac')}`);
				error++;
				continue;
			}

			const date = dayjs(posts[data].published * 1000).format('HH:mm:ss DD/MM/YYYY');
			let caption = t(locale, 'downloader.titles.tiktok', [posts[data].type === 'images' ? 'Slide' : 'Video']).formatHeaders();

			caption += `\n\nAuthor : ${posts[data].author}\n`;
			caption += `Username : ${posts[data].nickname}\n`;
			caption += `${DL.labels.verifies} : ${posts[data].verified ? 'Verified' : 'Not Verified'}\n`;
			caption += `${DL.labels.published} : ${date}\n`;

			if (posts[data].type !== 'images') {
				caption += `${DL.labels.ratio} : ${posts[data].ratioHighest || posts[data].ratio}\n`;
				posts[data].fps && posts[data].ratioHighest && (caption += `${DL.labels.frameRates} : ${posts[data].fps}\n`);
				caption += `${DL.labels.duration} : ${posts[data].videoDuration}\n`;
			}

			caption += `${DL.labels.music} : ${posts[data].musicTitle}\n`;

			caption += `👥 ${formatNumber(posts[data].followers)} 👤 ${formatNumber(posts[data].following)}\n`;
			caption += `👍 ${formatNumber(posts[data].liked)} 🔄 ${formatNumber(posts[data].shared)} 💬 ${formatNumber(
				posts[data].comment
			)} 👀 ${formatNumber(posts[data].view)}\n`;
			caption += `🎞️ ${formatNumber(posts[data].totalVideo)}\n\n`;

			caption += `📝 ${posts[data].videoDescription}\n`;

			if (posts[data].type === 'images') {
				caption += `${DL.labels.totalImages} : ${posts[data].urls.images.length}\n`;

				const images = posts[data].urls.images;

				if (device.isIos) {
					await wait.update(t(locale, 'downloader.labels.sendingImages', [images.length]));

					await client.send(from, { text: caption.trim() }, { quoted: message });

					for (const { buffer } of images) {
						await client.send(from, { image: buffer });
					}
				} else {
					const builder = new client.TemplateBuilder.Carousel();

					await wait.update(t(locale, 'downloader.labels.preparingCarousel', [images.length]));

					await builder
						.destination(from)
						.body(caption)
						.footer(t(locale, 'common.core.footer.poweredBy', ['Hidden Finder']))
						.header(DL.labels.header || 'Header')
						.cards(
							images.map(({ buffer, index, urlWithWatermark }) => ({
								body: t(locale, 'downloader.labels.imageOf', [index, images.length]),
								footer: '',
								title: '',
								header: buffer,
								buttons: [builder.button.url({ display: t(locale, 'downloader.labels.image', [index]), url: urlWithWatermark })]
							}))
						)
						.send();
				}

				success++;
				continue;
			}

			const urls = [
				posts[data].urls['withoutWatermarkHighest'],
				posts[data].urls['withoutWatermark'],
				posts[data].urls['withWatermark']
			];

			const url = (withWatermark ? urls[2] || urls[0] || urls[1] : urls[0] || urls[1] || urls[2]) || null;

			if (!url) {
				await client.reply(from, L.errors.noDownloadUrl, message);
				error++;
			}

			await wait.update('Downloading TikTok Media. Please wait...');

			await client.send(
				from,
				{
					video: {
						url
					},
					caption: caption.trim()
				},
				{ quoted: message }
			);

			success++;
		}

		await wait.update(`Command Finished. With total ${success} success, and ${error} fail.`);

		loggers.info(`${color('Downloaded TikTok Media', 'pink')} for ${color(prettyNumber, 'lilac')}`);
	}
});
