import parser from 'yargs-parser';

import { color, loggers } from '../../utils/modules/index.js';
import { mime } from '../../utils/misc/index.js';
import { tiktok } from '../../utils/tiktok/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'tiktokaudio',
	minifiedDescription: 'Download TikTok Audio',
	description: 'Downloads TikTok audio.',
	usage: '!tiktokaudio <url> (you can send multiple link using space in between)',
	aliases: ['tiktokaudio', 'ttaudio', 'ttaud'],
	category: 'Downloader',
	cooldown: 7,
	limit: 6,
	status: 'enable',
	async run({ from, query, prettyNumber, message, groupMetadata }, client) {
		if (!query) {
			return await client.instance.reply('Please provide a URL', { from, quoted: message, groupMetadata });
		}

		let { _: urls } = parser(query);

		const audios = await tiktok.download.post(urls);

		for (const data in audios) {
			if ('error' in audios[data]) {
				await client.instance.reply(`Error while downloading TikTok audio\n\n${audios[data].error}\n${data}`, {
					from,
					quoted: message,
					groupMetadata
				});

				loggers.ERR(`${color('Failed to Download TikTok Audio', '#FF5555')} for ${color(prettyNumber, '#E4C1F9')}`);
				continue;
			}

			loggers.WRN(`${color('Downloading TikTok Audio', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);

			await client.instance.send(
				from,
				{
					document: { url: audios[data].url.images ? audios[data].urls.music : audios[data].urls.withNoWatermark },
					fileName: `${audios[data].musicTitle}.mp3`,
					mimetype: mime('mp3')
				},
				{ groupMetadata, quotes: message }
			);
		}

		loggers.INF(`${color('Downloaded TikTok Audio', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);
	}
};
