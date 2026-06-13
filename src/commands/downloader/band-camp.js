import parser from 'yargs-parser';

import { getLocale, useLocale, t } from '../../helper/i18n/index.js';
import { color, downloadBandcamp, isURL, loggers, removeDuplicatesArray, toOpus } from '../../utils/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'bandcampdl',
	minifiedDescription: 'Download Bandcamp',
	description: 'Download Musics from Bandcamp',
	usage: '!bandcampdl `<url(s)>` (you can send multiple link using space in between)',
	category: 'Downloader',
	aliases: ['bcampdl', 'bandcdl'],
	limit: 4,
	cooldown: 8,
	status: 'enable',
	async run({ query, from, message, filename, prettyNumber }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!query) {
			return await client.reply(from, L.errors.noQuery, message);
		}

		const wait = await client.waitMessage(from, L.success.loading, message);

		let { _: urls } = parser(query);

		urls = removeDuplicatesArray(urls);

		if (urls.length === 1 && !isURL(urls[0])) {
			return await wait.update(L.errors.invalidUrl);
		}

		let success = 0;
		let error = 0;

		loggers.warning(`${color('Downloading Bandcamp File', 'pink')} for ${color(prettyNumber, 'lilac')}`);

		for (const url of urls) {
			if (!isURL(url.trim())) {
				await client.reply(from, t(locale, 'errors.validUrlRequired', [url]), message);
				error++;
				continue;
			}

			const result = await downloadBandcamp(url);

			if (result?.error) {
				await client.reply(from, result.error, message);
				loggers.error(`${color('Failed to Download Bandcamp File', 'red')} for ${color(prettyNumber, 'lilac')}`);
				error++;
				continue;
			}

			await client.send(
				from,
				{
					document: await toOpus('opus', {
						input: `./tmp/${filename}`,
						output: `./tmp/${filename}-done`,
						media: result.mp3.replace('https', 'http')
					}),
					fileName: `${result.title}.opus`,
					mimetype: 'audio/opus',
					caption: `${'Bandcamp'.formatHeaders()}

Title : ${result.title}`.formatForm()
				},
				{ quoted: message }
			);

			success++;
		}

		await wait.update(`Command Finished. With total ${success} success, and ${error} fail.`);

		loggers.info(`${color('Downloaded Bandcamp File', 'pink')} for ${color(prettyNumber, 'lilac')}`);
	}
});
