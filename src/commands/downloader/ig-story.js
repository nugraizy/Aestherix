import parser from 'yargs-parser';

import configuration from '../../helper/config/connect.js';
import { color, delay, loggers, formatNumber } from '../../utils/modules/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'igstory',
	minifiedDescription: 'Download Instagram Story',
	description: 'Downloads the story of the user',
	usage: '!igstory `<username(s)>` (you can send multiple username using space in between)',
	aliases: ['igstory', 'igs'],
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
			return await client.instance.reply(from, 'Please specify a username', message);
		}

		const wait = await client.instance.waitMessage(from, 'Please wait...', message);

		const { _: input } = parser(query);

		const stories = await configuration.instagram.search.story(input);

		let success = 0;
		let error = 0;

		loggers.warning(`${color('Downloading Instagram Story', 'pink')} for ${color(prettyNumber, 'lilac')}`);

		for (const data in stories) {
			if (stories[data]?.error) {
				await client.instance.reply(
					from,
					`Error while downloading Instagram story\n\n${stories[data].error}\n${data}`,
					message
				);
				loggers.error(`${color('Failed to Download Instagram Story', 'red')} for ${color(prettyNumber, 'lilac')}`);
				error++;
				continue;
			}

			let capt = 'Instagram Story'.formatHeaders();

			capt += `\n\nUsername : ${stories[data].username}\n`;
			capt += `Fullname : ${stories[data].fullName}\n`;
			capt += stories[data].biography === '' ? '' : `Biography : ${stories[data].biography}\n`;
			capt += `Verifies : ${stories[data].isVerified ? 'Verified' : 'Not Verified'}\n`;
			capt += `Private : ${stories[data].isPrivate ? 'Private' : 'Public'}\n`;
			capt += `Business : ${stories[data].isBusinessAccount ? 'Yes' : 'No'}\n`;
			capt += `New User : ${stories[data].isRecentUser ? 'Yes' : 'No'}\n`;
			capt += `Category : ${stories[data].accountCategory ? stories[data].accountCategory : 'No'}\n`;
			capt += `Facebook Linked : ${stories[data].linkedFacebookPage ? 'Yes' : 'No'}\n`;
			capt += `Total Highlights : ${formatNumber(stories[data].highlightCount)}\n`;
			capt += `Total Posts : ${formatNumber(stories[data].postsCount)}\n`;
			capt += `Total Stories : ${stories[data].stories.length}\n`;
			capt += `👥 ${formatNumber(stories[data].followers)} 👤 ${formatNumber(stories[data].following)}\n\n`;

			await client.instance.reply(from, capt.trim().formatForm(), message);

			for (const media of stories[data].stories) {
				await client.instance.send(from, media.isVideo ? { video: { url: media.url } } : { image: { url: media.url } }, {});
				await delay(300);
			}

			success++;
		}

		await wait.update(`Command Finished. With total ${success} success, and ${error} fail.`);

		loggers.info(`${color('Downloaded Instagram Story', 'pink')} for ${color(prettyNumber, 'lilac')}`);
	}
};
