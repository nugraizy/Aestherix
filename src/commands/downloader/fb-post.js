import parser from 'yargs-parser';

import { facebook } from '../../utils/facebook/index.js';
import { color, delay, fetchBUFFER, isURL, loggers, removeDuplicatesArray } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';

const regex = (input) => /^(https?:\/\/)?((w{3}\.)|(m\.)?)?(facebook|fb)\.(com|watch)\/.*/.test(input);

export default defineCommand({
	name: 'fbpost',
	minifiedDescription: 'Download Facebook Post',
	description: 'Downloads a Facebook post',
	usage: '!fbpost `<url(s)>` (you can send multiple link using space in between)',
	aliases: ['fbpost', 'fbp', 'fb', 'fbdl'],
	category: 'Downloader',
	cooldown: 8,
	limit: 6,
	status: 'enable',
	async run({ from, query, prettyNumber, message }, client) {
		if (!query) {
			return await client.reply(from, 'Please provide a URL', message);
		}

		const wait = await client.waitMessage(from, 'Please wait...', message);

		const { _: urls } = parser(query);

		urls = removeDuplicatesArray(urls);

		if (urls.length === 1 && !isURL(urls[0])) {
			return await wait.update('Please specify a valid url');
		}

		if (urls.length === 1 && !regex(urls[0])) {
			return await wait.update('Please specify a valid Facebook url');
		}

		let success = 0;
		let error = 0;

		loggers.warning(`${color('Downloading Facebook Post', 'pink')} for ${color(prettyNumber, 'lilac')}`);

		for (const url of urls) {
			if (!isURL(url.trim())) {
				await client.reply(from, 'Please specify a valid url\nInvalid : ' + url, message);
				error++;
				continue;
			} else if (!regex(url.trim())) {
				await client.reply(from, 'Please specify a valid Facebook url\nInvalid : ' + url, message);
				error++;
				continue;
			}

			const post = await facebook(url.trim());

			if (post?.error) {
				await client.reply(from, `Failed while downloading Facebook post\n\n${post.error}\n${url}`, message);
				loggers.error(`${color('Failed to Download Facebook Post', 'red')} for ${color(prettyNumber, 'lilac')}`);
				error++;
				continue;
			}

			const urlFilter = post.links.find(
				(v) => v.quality.includes('1080p') || v.quality.includes('720p') || v.quality.includes('480p')
			);

			await client.send(
				from,
				{
					video: await fetchBUFFER(urlFilter.url),
					caption: `${'Facebook Video Downloader'.formatHeaders()}\n\nResolution : ${urlFilter.quality}`.formatForm()
				},
				{}
			);
			await delay(300);
			success++;
		}

		await wait.update(`Command Finished. With total ${success} success, and ${error} fail.`);

		loggers.info(`${color('Downloaded Facebook Post', 'pink')} for ${color(prettyNumber, 'lilac')}`);
	}
});
