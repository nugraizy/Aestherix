import dayjs from 'dayjs';
import parser from 'yargs-parser';

import configuration from '../../helper/config/connect.js';
import { getLocale, useLocale, t } from '../../helper/i18n/index.js';
import { color, formatNumber, loggers } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'igpost',
	minifiedDescription: 'Download Instagram Post',
	description: 'Downloads the post of the user',
	usage: '!igpost `<url(s)>` (you can send multiple link using space in between)',
	aliases: ['igpost', 'igp'],
	category: 'Downloader',
	cooldown: 10,
	limit: 9,
	status: 'enable',
	async run({ from, query, prettyNumber, message, sender, bodyQuoted, isOwner, prefix }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const DL = useLocale(locale, 'downloader');

		if (!configuration.isInstagramInitiated) {
			return await client.reply(
				from,
				`Instagram session is not initialized. ${isOwner ? `Type ${prefix}instagraminit to initialize it.` : `Please ask the owner to initialize it first using the command ${prefix}instagraminit`}`,
				message
			);
		}

		if (bodyQuoted && query) {
			const reg = /Source :\s*`([^`]+)`/g;

			const videoIds = [];
			let match;

			while ((match = reg.exec(bodyQuoted)) !== null) {
				videoIds.push(match[1]);
			}

			if (!videoIds.length) {
				return await client.reply(from, L.errors.noIdsFound, message);
			}

			const numberiedQuery = Number(query);
			const index = numberiedQuery - 1;

			if (!numberiedQuery || index >= videoIds.length) {
				return await client.reply(from, t(locale, 'common.errors.numberRange', [1, videoIds.length]), message);
			}

			const videoId = videoIds[index];

			await client.reply(from, `Downloading Instagram Posts :\n${videoId}\nPlease wait`.formatForm(), message);

			query = videoId;
		}

		if (!query) {
			return await client.reply(from, L.errors.noUrl, message);
		}

		const wait = await client.waitMessage(from, L.success.loading, message);

		const { _: urls } = parser(query);

		const posts = await configuration.instagram.download.post(urls);

		let success = 0;
		let error = 0;

		loggers.warning(`${color('Downloading Instagram Post', 'pink')} for ${color(prettyNumber, 'lilac')}`);

		for (const data in posts) {
			if (posts[data]?.error) {
				await client.reply(from, `Error while downloading Instagram post\n\n${posts[data].error}\n${data}`, message);
				loggers.error(`${color('Failed to Download Instagram Post', 'red')} for ${color(prettyNumber, 'lilac')}`);
				error++;
				continue;
			}

		let capt = DL.titles.igPost.formatHeaders();

		capt += `\n\nUsername : ${posts[data].username}\n`;
		capt += `Fullname : ${posts[data].fullName}\n`;
		capt += `${DL.labels.privacy} : ${posts[data].isPrivate ? 'Private' : 'Public'}\n`;
		capt += `${DL.labels.verifies} : ${posts[data].isVerified ? 'Verified' : 'Not Verified'}\n`;
			capt += `📅 ${dayjs(posts[data].takenAt * 1000).format('HH:mm:ss DD/MM/YYYY')}\n`;
			capt += `👍 ${formatNumber(posts[data].likeCount)} 💬 ${formatNumber(posts[data].commentCount)}\n\n`;

			if (posts[data].post.length === 1) {
				capt += `📝 ${(posts[data].captions || '').trim()}\n`;

				await client.send(
					from,
					{
						[posts[data].post[0].isVideo ? 'video' : 'image']: { url: posts[data].post[0].url },
						caption: capt.trim().formatForm()
					},
					{ quoted: message }
				);
			} else {
				capt += `🖼️ ${posts[data].post.length}\n\n`;
				capt += `📝 ${(posts[data].captions || '').trim()}\n`;

				await client.send(from, { text: capt.trim().formatForm() }, { quoted: message });

				for (const media of posts[data].post) {
					await client.send(from, { [media.isVideo ? 'video' : 'image']: { url: media.url } });
				}
			}

			success++;
		}

		await wait.update(t(locale, 'common.core.commands.downloadBatchFinished', [success, error]));

		loggers.info(`${color('Downloaded Instagram Post', 'pink')} for ${color(prettyNumber, 'lilac')}`);
	}
});
