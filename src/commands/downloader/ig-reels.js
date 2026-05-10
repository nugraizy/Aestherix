import dayjs from 'dayjs';
import parser from 'yargs-parser';

import configuration from '../../helper/config/connect.js';
import { color, formatNumber, loggers } from '../../utils/modules/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'igreel',
	minifiedDescription: 'Download Instagram Reel',
	description: 'Downloads the reel of the user',
	usage: '!igreel `<url(s)>` (you can send multiple link using space in between)',
	aliases: ['igreel', 'igr'],
	category: 'Downloader',
	cooldown: 10,
	limit: 9,
	status: 'enable',
	async run({ from, query, prettyNumber, message, isOwner, prefix }, client) {
		if (!configuration.isInstagramInitiated) {
			return await client.instance.reply(
				from,
				`Instagram session is not initialized. ${isOwner ? `Type ${prefix}instagraminit to initialize it.` : `Please ask the owner to initialize it first using the command ${prefix}instagraminit`}`,
				message
			);
		}

		if (!query) {
			return await client.instance.reply(from, 'Please specify a url', message);
		}

		const wait = await client.instance.waitMessage(from, 'Please wait...', message);

		const { _: urls } = parser(query);

		const reels = await configuration.instagram.download.post(urls);

		let success = 0;
		let error = 0;

		loggers.warning(`${color('Downloading Instagram reel', 'pink')} for ${color(prettyNumber, 'lilac')}`);

		for (const data in reels) {
			if (reels[data]?.error) {
				await client.instance.reply(from, `Error while downloading Instagram reel\n\n${reels[data].error}\n${data}`, message);
				loggers.error(`${color('Failed to Download Instagram reel', 'red')} for ${color(prettyNumber, 'lilac')}`);
				error++;
				continue;
			}

			let capt = 'Instagram reel'.formatHeaders();

			capt += `\n\nUsername : ${reels[data].username}\n`;
			capt += `Fullname : ${reels[data].fullName}\n`;
			capt += `Privacy : ${reels[data].isPrivate ? 'Private' : 'Public'}\n`;
			capt += `Verifies : ${reels[data].isVerified ? 'Verified' : 'Not Verified'}\n`;
			capt += `📅 ${dayjs(reels[data].takenAt * 1000).format('HH:mm:ss DD/MM/YYYY')}\n`;
			capt += `👍 ${formatNumber(reels[data].likeCount)} 💬 ${formatNumber(reels[data].commentCount)}\n\n`;

			if (reels[data].post.length === 1) {
				capt += `📝 ${(reels[data].captions || '').trim()}\n`;

				await client.instance.send(
					from,
					reels[data].post[0].isVideo
						? { video: { url: reels[data].post[0].url }, caption: capt.trim().formatForm() }
						: {
								image: { url: reels[data].post[0].url },
								caption: capt.trim().formatForm()
							},
					{ quoted: message }
				);
			}

			success++;
		}

		await wait.update(`Command Finished. With total ${success} success, and ${error} fail.`);

		loggers.info(`${color('Downloaded Instagram reel', 'pink')} for ${color(prettyNumber, 'lilac')}`);
	}
};
