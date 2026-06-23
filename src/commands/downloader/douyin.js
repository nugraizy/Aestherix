import parser from 'yargs-parser';

import { getLocale, useLocale, t } from '../../helper/i18n/index.js';
import { color, formatNumber, isURL, loggers, removeDuplicatesArray } from '../../utils/modules/index.js';
import { getDouyinInfo } from '../../utils/tiktok/index.js';
import { defineCommand } from '../_define.js';

const isDouyinUrl = (input) => /^(https?:\/\/)?(www\.)?(douyin\.com|v\.douyin\.com)\//i.test((input || '').trim());

export default defineCommand({
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
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const DL = useLocale(locale, 'downloader');

		if (!query) {
			return await client.reply(from, L.errors.noUrl, message);
		}

		const wait = await client.waitMessage(from, L.success.loading, message);

		let { _: urls } = parser(query);

		urls = removeDuplicatesArray(urls);

		if (urls.length === 1 && !isURL(urls[0])) {
			return await wait.update(L.errors.invalidUrl);
		}

		if (urls.length === 1 && isURL(urls[0]) && !isDouyinUrl(urls[0])) {
			return await wait.update(L.errors.douyinUrlRequired);
		}

		let success = 0;
		let error = 0;

		loggers.warning(`${color('Downloading Douyin Media', 'pink')} for ${color(prettyNumber, 'lilac')}`);

		for (const url of urls) {
			if (!isURL(url)) {
				await client.reply(from, t(locale, 'errors.validUrlRequired', [url]), message);
				error++;
				continue;
			} else if (!isDouyinUrl(url)) {
				await client.reply(from, L.errors.douyinUrlRequired, message);
				error++;
				continue;
			}

			let info;

			try {
				info = await getDouyinInfo(url);
			} catch (err) {
				await client.reply(from, `Error while downloading Douyin post\n\n${err?.message || err}\n${url}`, message);
				loggers.error(`${color('Failed to Download Douyin Post', 'red')} for ${color(prettyNumber, 'lilac')}`);
				error++;
				continue;
			}

			const author = info.author_statistics || {};
			const nickname = author.nickname || author.unique_id || author.short_id || author.uid || 'Unknown';
			const username = author.unique_id || author.short_id || author.sec_uid || author.uid || '';
			const bio = author.signature || '';
			const isImages = Array.isArray(info.images) && info.images.length > 0;

			let caption = t(locale, 'downloader.titles.douyin', [isImages ? 'Slide' : 'Video']).formatHeaders();

			caption += `\n\nAuthor : ${nickname}\n`;

			if (username && username !== nickname) {
				caption += `Username : ${username}\n`;
			}

			if (bio) {
				caption += `${DL.labels.bio} : ${bio}\n`;
			}

			if (author.follower_count || author.following_count) {
				caption += `👥 ${formatNumber(author.follower_count || 0)} 👤 ${formatNumber(author.following_count || 0)}\n`;
			}

			caption += `👍 ${formatNumber(info.digg_count || 0)} 🔄 ${formatNumber(info.share_count || 0)} 💬 ${formatNumber(
				info.comment_count || 0
			)} 👀 ${formatNumber(info.play_count || 0)}\n`;

			if (isImages) {
				caption += `${DL.labels.totalImages} : ${info.images.length}\n`;

				await client.send(from, { text: caption.trim().formatForm() }, { quoted: message });

				for (const image of info.images) {
					await client.send(from, { image: { url: image } });
				}

				success++;
				continue;
			}

			if (!info.video) {
				await client.reply(from, L.errors.noDownloadUrl, message);
				error++;
				continue;
			}

			await client.send(
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

		loggers.info(`${color('Downloaded Douyin Media', 'pink')} for ${color(prettyNumber, 'lilac')}`);
	}
});
