import parser from 'yargs-parser';

import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { color, loggers, removeDuplicatesArray } from '../../utils/modules/index.js';
import { mime } from '../../utils/misc/index.js';
import { tiktok } from '../../utils/tiktok/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'tiktokaudio',
	minifiedDescription: 'Download TikTok Audio',
	description: 'Downloads TikTok audio.',
	usage: '!tiktokaudio `<url(s)>` (you can send multiple link using space in between)',
	aliases: ['tiktokaudio', 'ttaudio', 'ttaud'],
	category: 'Downloader',
	cooldown: 7,
	limit: 6,
	status: 'enable',
	async run({ from, query, prettyNumber, message }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!query) {
			return await client.reply(from, L.errors.noUrl, message);
		}

		const wait = await client.waitMessage(from, L.success.loading, message);

		let { _: urls } = parser(query);

		urls = removeDuplicatesArray(urls);

		let success = 0;
		let error = 0;

		loggers.warning(`${color('Downloading TikTok Audio', 'pink')} for ${color(prettyNumber, 'lilac')}`);

		const audios = await tiktok.download.post(urls);

		for (const data in audios) {
			if (audios[data]?.error) {
				await client.reply(from, `Error while downloading TikTok audio\n\n${audios[data].error}\n${data}`, message);
				loggers.error(`${color('Failed to Download TikTok Audio', 'red')} for ${color(prettyNumber, 'lilac')}`);
				error++;
				continue;
			}

			await client.send(
				from,
				{
					document: { url: audios[data].urls.images ? audios[data].urls.music : audios[data].urls.withNoWatermark },
					fileName: `${audios[data].musicTitle}.mp3`,
					mimetype: mime('mp3')
				},
				{ quotes: message }
			);
			success++;
		}

		await wait.update(`Command Finished. With total ${success} success, and ${error} fail.`);

		loggers.info(`${color('Downloaded TikTok Audio', 'pink')} for ${color(prettyNumber, 'lilac')}`);
	}
});
