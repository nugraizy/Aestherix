import parser from 'yargs-parser';

import { getLocale, useLocale, t } from '../../helper/i18n/index.js';
import { bluesky, color, isURL, loggers, removeDuplicatesArray } from '../../utils/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'bluesky',
	description: 'Download media from Bluesky',
	usage: '!bluesky `<url(s)>` (you can send multiple link using space in between)',
	aliases: ['bsky'],
	category: 'Downloader',
	cooldown: 8,
	limit: 4,
	status: 'enable',
	run: async ({ from, query, message, prettyNumber }, client) => {
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

		loggers.warning(`${color('Downloading Bluesky Post', 'pink')} for ${color(prettyNumber, 'lilac')}`);

		for (const url of urls) {
			if (!isURL(url.trim())) {
				await client.reply(from, t(locale, 'errors.validUrlRequired', [url]), message);
				error++;
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
						await client.reply(from, item.error, message);
						loggers.error(`${color('Failed to Download Bluesky Post', 'red')} for ${color(prettyNumber, 'lilac')}`);
						error++;
						break;
					}

					await client.send(from, { [mediaType.slice(0, -1)]: { url: item }, caption }, { quoted: message });
					caption = '';
					success++;
				}
			}
		}

		await wait.update(`Command Finished. With total ${success} success, and ${error} fail.`);

		loggers.info(`${color('Downloaded Bluesky Post', 'pink')} for ${color(prettyNumber, 'lilac')}`);
	}
});
