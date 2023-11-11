import parser from 'yargs-parser';

import { color, ERRLOG, INFOLOG } from '../../utils/modules/index.js';
import { mime } from '../../utils/misc/index.js';
import { tiktok } from '../../utils/tiktok/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
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
	async run({ from, query, prettyNumber, message, groupMetadata }, client) {
		if (!query) {
			return await client[botNum].reply('Please provide a URL', { from, quoted: message, groupMetadata });
		}

		let { _: urls } = parser(query);

		const musics = await tiktok.download.post(urls);

		for (const data in musics) {
			if ('error' in musics[data]) {
				await client[botNum].reply(`Error while downloading TikTok music\n\n${musics[data].error}\n${data}`, {
					from,
					quoted: message,
					groupMetadata
				});

				ERRLOG(`⚠️ ${color('Failed to Download TikTok Music', '#FF5555')} for ${color(prettyNumber, '#ff71ce')}`);
				continue;
			}

			INFOLOG(`${color('Downloading TikTok Music', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`);

			await client[botNum].send(
				from,
				{
					document: { url: musics[data].urls.music },
					fileName: `${musics[data].authorMusic} - ${musics[data].musicTitle}.mp3`,
					mimetype: mime('mp3')
				},
				{ groupMetadata, quoted: message }
			);

			INFOLOG(`${color('Downloaded TikTok Music', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`);
		}
	}
};
