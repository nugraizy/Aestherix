import path from 'path';
import parser from 'yargs-parser';

import { removeDuplicatesArray, isURL, toOpus, downloadBandcamp, color, loggers } from '../../utils/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
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
		if (!query) {
			return await client.instance.reply('You must provide a query.', { from, quoted: message });
		}

		await client.instance.reply('Please wait...', { from, quoted: message });

		let { _: urls } = parser(query);

		urls = removeDuplicatesArray(urls);

		if (urls.length === 1 && !isURL(urls[0])) {
			return await client.instance.reply('Please specify a valid url', { from, quoted: message });
		}

		loggers.warning(`${color('Downloading Bandcamp File', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);

		for (const url of urls) {
			if (!isURL(url.trim())) {
				await client.instance.reply('Please Use a Valid URL.\nInvalid : ' + url, { from, quoted: message });
				continue;
			}

			const result = await downloadBandcamp(url);

			if (result?.error) {
				await client.instance.reply(result.error, { from, quoted: message });
				loggers.error(`${color('Failed to Download Bandcamp File', '#FF5555')} for ${color(prettyNumber, '#E4C1F9')}`);
				continue;
			}

			await client.instance.send(
				from,
				{
					document: await toOpus('opus', {
						input: path.join(__dirname, `src/media/temporary_files/${filename}`),
						output: path.join(__dirname, `src/media/temporary_files/${filename}-done`),
						media: result.mp3.replace('https', 'http')
					}),
					fileName: `${result.title}.opus`,
					mimetype: 'audio/opus',
					caption: `${'Bandcamp'.formatHeaders()}

Title : ${result.title}`.formatForm()
				},
				{ quoted: message }
			);
		}

		loggers.info(`${color('Downloaded Bandcamp File', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);
	}
};
