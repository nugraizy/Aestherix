import dayjs from 'dayjs';
import parser from 'yargs-parser';

import { color, loggers, formatNumber } from '../../utils/modules/index.js';
import { instagram } from '../../utils/instagram/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'igpost',
	minifiedDescription: 'Download Instagram Post',
	description: 'Downloads the post of the user',
	usage: '!igpost `<url(s)>` (you can send multiple link using space in between)',
	aliases: ['igpost', 'igp'],
	category: 'Downloader',
	cooldown: 10,
	limit: 9,
	status: 'enable',
	async run({ from, query, prettyNumber, message, bodyQuoted }, client) {
		if (bodyQuoted && query) {
			const reg = /Source :\s*`([^`]+)`/g;

			const videoIds = [];
			let match;

			while ((match = reg.exec(bodyQuoted)) !== null) {
				videoIds.push(match[1]);
			}

			if (!videoIds.length) {
				return await client.instance.reply('No id(s) found', { from, quoted: message });
			}

			const numberiedQuery = Number(query);
			const index = numberiedQuery - 1;

			if (!numberiedQuery || index > videoIds.length) {
				return await client.instance.reply(`Please specify a number beteen 1 - ${videoIds.length}`, {
					from,
					quoted: message
				});
			}

			const videoId = videoIds[index];

			await client.instance.reply(`Downloading Instagram Posts :\n${videoId}\nPlease wait`.formatForm(), {
				from,
				quoted: message
			});

			query = videoId;
		}

		if (!query) {
			return await client.instance.reply('Please specify a url', { from, quoted: message });
		}

		await client.instance.reply('Please wait...', { from, quoted: message });

		const { _: urls } = parser(query);

		const posts = await instagram.download.post(urls);

		loggers.warning(`${color('Downloading Instagram Post', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);

		for (const data in posts) {
			if (posts[data]?.error) {
				await client.instance.reply(`Error while downloading Instagram post\n\n${posts[data].error}\n${data}`, {
					from,
					quoted: message
				});
				loggers.error(`${color('Failed to Download Instagram Post', '#FF5555')} for ${color(prettyNumber, '#E4C1F9')}`);
				continue;
			}

			let capt = 'Instagram Post'.formatHeaders();

			capt += `\n\nUsername : ${posts[data].username}\n`;
			capt += `Fullname : ${posts[data].fullName}\n`;
			capt += `Privacy : ${posts[data].isPrivate ? 'Private' : 'Public'}\n`;
			capt += `Verifies : ${posts[data].isVerified ? 'Verified' : 'Not Verified'}\n`;
			capt += `📅 ${dayjs(posts[data].takenAt * 1000).format('HH:mm:ss DD/MM/YYYY')}\n`;
			capt += `👍 ${formatNumber(posts[data].likeCount)} 💬 ${formatNumber(posts[data].commentCount)}\n\n`;

			if (posts[data].post.length === 1) {
				capt += `📝 ${(posts[data].captions || '').trim()}\n`;

				await client.instance.send(
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

				await client.instance.send(from, { text: capt.trim().formatForm() }, { quoted: message });

				for (const media of posts[data].post) {
					await client.instance.send(from, { [media.isVideo ? 'video' : 'image']: { url: media.url } }, {});
				}
			}
		}

		loggers.info(`${color('Downloaded Instagram Post', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);
	}
};
