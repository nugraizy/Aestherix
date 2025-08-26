import parser from 'yargs-parser';

import { bluesky, isURL, removeDuplicatesArray, loggers, color } from '../../utils/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'bluesky',
	description: 'Download media from Bluesky',
	usage: '!bluesky `<url(s)>` (you can send multiple link using space in between)',
	aliases: ['bsky'],
	category: 'Downloader',
	cooldown: 8,
	limit: 4,
	status: 'enable',
	run: async ({ from, query, message, prettyNumber }, client) => {
		if (!query) {
			return await client.instance.reply('You must provide a query.', { from, quoted: message });
		}

		await client.instance.reply('Please wait...', { from, quoted: message });

		let { _: urls } = parser(query);

		urls = removeDuplicatesArray(urls);

		if (urls.length === 1 && !isURL(urls[0])) {
			return await client.instance.reply('Please specify a valid url', { from, quoted: message });
		}

		loggers.warning(`${color('Downloading Bluesky Post', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);

		for (const url of urls) {
			if (!isURL(url.trim())) {
				await client.instance.reply('Please Use a Valid URL.\nInvalid : ' + url, { from, quoted: message });
				continue;
			}

			const media = await bluesky.getPost(url);

			let caption = 'Bluesky Downloader'.formatHeaders() + '\n\n';

			caption += `Fullname : ${media.author.displayName}\n`;
			caption += `Username : ${media.author.username}`;

			const mediaType = media.images ? 'images' : media.videos ? 'videos' : null;

			if (mediaType) {
				for (const item of media[mediaType]) {
					if (item.error) {
						await client.instance.send(from, { text: item.error }, { quoted: message });
						loggers.error(`${color('Failed to Download Bluesky Post', '#FF5555')} for ${color(prettyNumber, '#E4C1F9')}`);
						break;
					}

					await client.instance.send(from, { [mediaType.slice(0, -1)]: { url: item }, caption }, { quoted: message });
					caption = '';
				}
			}
		}

		loggers.info(`${color('Downloaded Bluesky Post', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);
	}
};
