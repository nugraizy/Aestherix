import dayjs from 'dayjs';
import parser from 'yargs-parser';

import { color, formatNumber, loggers, removeDuplicatesArray } from '../../utils/modules/index.js';
import { tiktok } from '../../utils/tiktok/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
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
	async run({ from, query, prettyNumber, message }, client) {
		if (!query) {
			return await client.instance.reply(from, 'Please provide a URL', message);
		}

		if (!tiktok) {
			tiktok = (await import('../../utils/tiktok/index.js')).tiktok;
		}

		const wait = await client.instance.waitMessage(from, 'Please wait...', message);

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

		loggers.warning(`${color('Downloading TikTok Media', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);

		const posts = await tiktok.download.post(urls, wait);

		for (const data in posts) {
			if (posts[data]?.error) {
				await client.instance.reply(from, `Error while downloading TikTok post\n\n${posts[data].error}\n${data}`, message);
				loggers.error(`${color('Failed to Download TikTok Post', '#FF5555')} for ${color(prettyNumber, '#E4C1F9')}`);
				error++;
				continue;
			}

			const date = dayjs(posts[data].published * 1000).format('HH:mm:ss DD/MM/YYYY');
			let caption = `TikTok ${posts[data].type === 'images' ? 'Slide' : 'Video'}`.formatHeaders();

			caption += `\n\nAuthor : ${posts[data].author}\n`;
			caption += `Username : ${posts[data].nickname}\n`;
			caption += `Verifies : ${posts[data].verified ? 'Verified' : 'Not Verified'}\n`;
			caption += `Published : ${date}\n`;

			if (posts[data].type !== 'images') {
				caption += `Ratio : ${posts[data].ratioHighest || posts[data].ratio}\n`;
				posts[data].fps && posts[data].ratioHighest && (caption += `Frame Rates : ${posts[data].fps}\n`);
				caption += `Duration : ${posts[data].videoDuration}\n`;
			}

			caption += `Music : ${posts[data].musicTitle}\n`;

			caption += `👥 ${formatNumber(posts[data].followers)} 👤 ${formatNumber(posts[data].following)}\n`;
			caption += `👍 ${formatNumber(posts[data].liked)} 🔄 ${formatNumber(posts[data].shared)} 💬 ${formatNumber(
				posts[data].comment
			)} 👀 ${formatNumber(posts[data].view)}\n`;
			caption += `🎞️ ${formatNumber(posts[data].totalVideo)}\n\n`;

			caption += `📝 ${posts[data].videoDescription}\n`;

			if (posts[data].type === 'images') {
				caption += `Total Images : ${posts[data].urls.images.length}\n`;

				const images = posts[data].urls.images;

				const builder = new client.instance.TemplateBuilder.Carousel();

				await wait.update(`Preparing TikTok Carousel Message for ${images.length} Images. Please wait...`);

				await builder
					.destination(from)
					.body(caption)
					.footer('Powered by Hidden Finder')
					.header('Header')
					.cards(
						images.map(({ buffer, index, urlWithWatermark }) => ({
							body: `Image ${index} of ${images.length}`,
							footer: '',
							title: '',
							header: buffer,
							buttons: [builder.button.url({ display: `Image ${index}`, url: urlWithWatermark })]
						}))
					)
					.send();

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
				await client.instance.reply(from, 'No download url found, Might check your url and try again.', message);
				error++;
			}

			await wait.update('Downloading TikTok Media. Please wait...');

			await client.instance.send(
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

		loggers.info(`${color('Downloaded TikTok Media', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);
	}
};
