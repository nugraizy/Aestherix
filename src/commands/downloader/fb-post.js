import parser from 'yargs-parser';

import { color, fetchBUFFER, loggers, isURL, delay } from '../../utils/modules/index.js';
import { facebook } from '../../utils/facebook/index.js';

const regex = (input) => /^(https?:\/\/)?((w{3}\.)|(m\.)?)?(facebook|fb)\.(com|watch)\/.*/.test(input);

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'fbpost',
	minifiedDescription: 'Download Facebook Post',
	description: 'Downloads a Facebook post',
	usage: '!fbpost <url>',
	aliases: ['fbpost', 'fbp', 'fb', 'fbdl'],
	category: 'Downloader',
	cooldown: 8,
	limit: 6,
	status: 'enable',
	async run({ from, query, prettyNumber, message }, client) {
		if (!query) {
			return await client.instance.reply('Please provide a URL', { from, quoted: message });
		}

		const { _: urls } = parser(query);

		if (urls.length === 1 && !isURL(urls[0])) {
			return await client.instance.reply('Please specify a valid url', { from, quoted: message });
		}

		if (urls.length === 1 && !regex(urls[0])) {
			return await client.instance.reply('Please specify a valid Facebook url', { from, quoted: message });
		}

		for (const url of urls) {
			if (!isURL(url.trim())) {
				await client.instance.reply('Please specify a valid url', { from, quoted: message });

				continue;
			} else if (!regex(url.trim())) {
				await client.instance.reply('Please specify a valid Facebook url', { from, quoted: message });

				continue;
			}

			const post = await facebook(url.trim());

			loggers.warning(`${color('Downloading Facebook Post', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);

			if ('error' in post) {
				await client.instance.reply(`Failed while downloading Facebook post\n\n${post.error}\n${url}`, {
					from,
					quoted: message
				});
				loggers.error(`${color('Failed to Download Facebook Post', '#FF5555')} for ${color(prettyNumber, '#E4C1F9')}`);

				continue;
			}

			const urlFilter = post.links.find(
				(v) => v.quality.includes('1080p') || v.quality.includes('720p') || v.quality.includes('480p')
			);

			await client.instance.send(
				from,
				{
					video: new Buffer.from(await fetchBUFFER(urlFilter.url)),
					caption: `${'Facebook Video Downloader'.formatHeaders()}\n\nResolution : ${urlFilter.quality}`.formatForm()
				},
				{}
			);
			await delay(300);
		}

		loggers.info(`${color('Downloaded Facebook Post', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);
	}
};
