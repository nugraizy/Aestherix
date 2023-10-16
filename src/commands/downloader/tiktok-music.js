import dayjs from 'dayjs';
import parser from 'yargs-parser';

import { color, delay, ERRLOG, INFOLOG, isURL, removeDuplicatesArray } from '../../utils/modules/index.js';
import { mime } from '../../utils/misc/index.js';
import { tiktok } from '../../utils/tiktok/index.js';

const regex = (input) => /(?:https:?\/{2})?(?:w{3}|vm|vt|t)?\.?tiktok.com\/([^\s&]+)/gi.test(input);

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
		const time = dayjs().format('HH:mm:ss DD/MM');

		if (!query) {
			return await client[botNum].reply('Please provide a URL', { from, quoted: message, groupMetadata });
		}

		let { _: urls } = parser(query);

		if (urls.length === 1 && !isURL(urls[0])) {
			return await client[botNum].reply('Please specify a valid url', { from, quoted: message, groupMetadata });
		}

		if (urls.length === 1 && !regex(urls[0])) {
			return await client[botNum].reply('Please specify a valid TikTok url', { from, quoted: message, groupMetadata });
		}

		urls = removeDuplicatesArray(urls.map((v) => v.trim()));

		for (const url of urls) {
			if (!isURL(url)) {
				await client[botNum].reply('Please specify a valid url', { from, quoted: message, groupMetadata });

				continue;
			} else if (!regex(url)) {
				await client[botNum].reply('Please specify a valid TikTok url', { from, quoted: message, groupMetadata });

				continue;
			}

			const music = await tiktok.downloadMedia(url);

			INFOLOG(
				`[${color(time, 'cyan')}]`,
				`${color('Downloading TikTok Music', '#01cdfe')} for ${color(prettyNumber, '#ff71ce')}`
			);

			if ('error' in music) {
				ERRLOG(
					`[${color(time, 'cyan')}]`,
					`⚠️ ${color('Error while downloading TikTok Music', '#ff0000')} for ${color(prettyNumber, '#ff71ce')}`
				);
				await client[botNum].reply(`${music.error}\n\n${url.split(' ')[0]}`, {
					from,
					quoted: message,
					groupMetadata
				});

				continue;
			}

			await client[botNum].send(
				from,
				{
					document: { url: music.url.music },
					fileName: `${music.authorMusic} - ${music.musicTitle}.mp3`,
					mimetype: mime('mp3')
				},
				{ groupMetadata, quoted: message }
			);

			await delay(300);
			INFOLOG(
				`[${color(time, 'cyan')}]`,
				`${color('Downloaded TikTok Music', '#01cdfe')} for ${color(prettyNumber, '#ff71ce')}`
			);
		}
	}
};
