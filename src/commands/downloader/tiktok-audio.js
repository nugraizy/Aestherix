import dayjs from 'dayjs';
import parser from 'yargs-parser';

import { color, ERRLOG, INFOLOG, isURL, removeDuplicatesArray } from '../../utils/modules/index.js';
import { mime } from '../../utils/misc/index.js';
import { tiktokAPI } from '../../utils/tiktok/index.js';

const regex = (input) => /(?:https:?\/{2})?(?:w{3}|vm|vt|t)?\.?tiktok.com\/([^\s&]+)/gi.test(input);

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'tiktokaudio',
	description: 'Downloads TikTok audio.',
	usage: '!tiktokaudio <url> (you can send multiple link using space in between)',
	aliases: ['tiktokaudio', 'ttaudio', 'ttaud'],
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

			const audio = await tiktokAPI(url);

			INFOLOG(
				`[${color(time, 'cyan')}]`,
				`${color('Downloading TikTok Audio', '#01cdfe')} for ${color(prettyNumber, '#ff71ce')}`
			);

			if ('error' in audio || audio.status === 'error') {
				await client[botNum].reply(audio.error || audio.message, { from, quoted: message, groupMetadata });

				ERRLOG(
					`[${color(time, 'cyan')}]`,
					`⚠️ ${color('Failed to Download TikTok Audio', 'red')} for ${color(prettyNumber, '#ff71ce')}`
				);

				continue;
			}

			await client[botNum].send(
				from,
				{
					document: { url: audio.url.withNoWatermark },
					fileName: `${audio.musicTitle}.mp3`,
					mimetype: mime('mp3')
				},
				{ groupMetadata, quotes: message }
			);
		}

		INFOLOG(
			`[${color(time, 'cyan')}]`,
			`${color('Downloaded TikTok Audio', '#01cdfe')} for ${color(prettyNumber, '#ff71ce')}`
		);
	}
};
