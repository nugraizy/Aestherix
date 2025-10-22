import parser from 'yargs-parser';

import { color, loggers } from '../../utils/modules/index.js';
import { mime } from '../../utils/misc/index.js';
import { tiktok } from '../../utils/tiktok/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'tiktokmusic',
	minifiedDescription: 'Download TikTok Music',
	description: 'Downloads TikTok music that used in the video.',
	usage:
		'!tiktokmusic `<url(s)>` (you can send multiple link using space in between) [options]\nOptions:\n-wm, --watermark: Download with watermark\n-nowm, --nowatermark: Download without watermark',
	aliases: ['tiktokmusics', 'tiktokmusik', 'ttmusic', 'ttmusik', 'ttm'],
	category: 'Downloader',
	cooldown: 7,
	limit: 6,
	status: 'enable',
	async run({ from, query, prettyNumber, message }, client) {
		if (!query) {
			return await client.instance.reply(from, 'Please provide a URL', message);
		}

		const wait = await client.instance.waitMessage(from, 'Please wait...', message);

		let { _: urls } = parser(query);

		let success = 0;
		let error = 0;

		loggers.warning(`${color('Downloading TikTok Music', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);

		const musics = await tiktok.download.post(urls);

		for (const data in musics) {
			if (musics[data]?.error) {
				await client.instance.reply(from, `Error while downloading TikTok music\n\n${musics[data].error}\n${data}`, message);
				loggers.error(`${color('Failed to Download TikTok Music', '#FF5555')} for ${color(prettyNumber, '#E4C1F9')}`);
				error++;
				continue;
			}

			await client.instance.send(
				from,
				{
					document: { url: musics[data].urls.music },
					fileName: `${musics[data].authorMusic} - ${musics[data].musicTitle}.mp3`,
					mimetype: mime('mp3')
				},
				{ quoted: message }
			);
			success++;
		}

		await wait.update(`Command Finished. With total ${success} success, and ${error} fail.`);

		loggers.info(`${color('Downloaded TikTok Music', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);
	}
};
