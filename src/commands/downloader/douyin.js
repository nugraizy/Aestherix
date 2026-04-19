import parser from 'yargs-parser';

import { color, formatNumber, isURL, loggers, removeDuplicatesArray } from '../../utils/modules/index.js';
import { getDouyinInfo } from '../../utils/tiktok/index.js';

const isDouyinUrl = (input) => /^(https?:\/\/)?(www\.)?(douyin\.com|v\.douyin\.com)\//i.test((input || '').trim());

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'douyin',
	minifiedDescription: 'Download Douyin Post',
	description: 'Downloads Douyin posts.',
	usage: '!douyin `<url(s)>` (you can send multiple link using space in between)',
	aliases: ['douyindl', 'douyinpost', 'dy', 'dydl'],
	category: 'Downloader',
	cooldown: 8,
	limit: 4,
	status: 'enable',
	async run({ from, query, prettyNumber, message }, client) {
		if (!query) {
			return await client.instance.reply(from, 'Please provide a URL', message);
		}

		const wait = await client.instance.waitMessage(from, 'Please wait...', message);

		let { _: urls } = parser(query);

		urls = removeDuplicatesArray(urls);

		if (urls.length === 1 && !isURL(urls[0])) {
			return await wait.update('Please specify a valid url');
		}

		if (urls.length === 1 && isURL(urls[0]) && !isDouyinUrl(urls[0])) {
			return await wait.update('Please specify a valid Douyin url');
		}

		let success = 0;
		let error = 0;

		loggers.warning(`${color('Downloading Douyin Media', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);

		for (const url of urls) {
			if (!isURL(url)) {
				await client.instance.reply(from, `Please specify a valid url\nInvalid : ${url}`, message);
				error++;
				continue;
			} else if (!isDouyinUrl(url)) {
				await client.instance.reply(from, `Please specify a valid Douyin url\nInvalid : ${url}`, message);
				error++;
				continue;
			}

			let info;

			try {
				info = await getDouyinInfo(url);
			} catch (err) {
				await client.instance.reply(from, `Error while downloading Douyin post\n\n${err?.message || err}\n${url}`, message);
				loggers.error(`${color('Failed to Download Douyin Post', '#FF5555')} for ${color(prettyNumber, '#E4C1F9')}`);
				error++;
				continue;
			}

			const author = info.author_statistics || {};
			const nickname = author.nickname || author.unique_id || author.short_id || author.uid || 'Unknown';
			const username = author.unique_id || author.short_id || author.sec_uid || author.uid || '';
			const bio = author.signature || '';
			const isImages = Array.isArray(info.images) && info.images.length > 0;

			let caption = `Douyin ${isImages ? 'Slide' : 'Video'}`.formatHeaders();

			caption += `\n\nAuthor : ${nickname}\n`;

			if (username && username !== nickname) {
				caption += `Username : ${username}\n`;
			}

			if (bio) {
				caption += `Bio : ${bio}\n`;
			}

			if (author.follower_count || author.following_count) {
				caption += `👥 ${formatNumber(author.follower_count || 0)} 👤 ${formatNumber(author.following_count || 0)}\n`;
			}

			caption += `👍 ${formatNumber(info.digg_count || 0)} 🔄 ${formatNumber(info.share_count || 0)} 💬 ${formatNumber(
				info.comment_count || 0
			)} 👀 ${formatNumber(info.play_count || 0)}\n`;

			if (isImages) {
				caption += `Total Images : ${info.images.length}\n`;

				await client.instance.send(from, { text: caption.trim().formatForm() }, { quoted: message });

				for (const image of info.images) {
					await client.instance.send(from, { image: { url: image } });
				}

				success++;
				continue;
			}

			if (!info.video) {
				await client.instance.reply(from, 'No download url found, Might check your url and try again.', message);
				error++;
				continue;
			}

			await client.instance.send(
				from,
				{
					video: { url: info.video },
					caption: caption.trim().formatForm()
				},
				{ quoted: message }
			);

			success++;
		}

		await wait.update(`Command Finished. With total ${success} success, and ${error} fail.`);

		loggers.info(`${color('Downloaded Douyin Media', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);
	}
};
