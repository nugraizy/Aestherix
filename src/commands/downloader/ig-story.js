import parser from 'yargs-parser';

import { color, delay, loggers, formatNumber } from '../../utils/modules/index.js';
import { instagram } from '../../utils/instagram/index.js';

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
	async run({ from, query, prettyNumber, message }, client) {
		if (!query) {
			return await client.instance.reply('Please specify a username', { from, quoted: message });
		}

		await client.instance.reply('Please wait...', { from, quoted: message });

		const { _: input } = parser(query);

		const stories = await instagram.search.story(input);

		loggers.warning(`${color('Downloading Instagram Story', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);

		for (const data in stories) {
			if (stories[data]?.error) {
				await client.instance.reply(`Error while downloading Instagram story\n\n${stories[data].error}\n${data}`, {
					from,
					quoted: message
				});
				loggers.error(`${color('Failed to Download Instagram Story', '#FF5555')} for ${color(prettyNumber, '#E4C1F9')}`);
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

			await client.instance.reply(capt.trim().formatForm(), { from, quoted: message });

			for (const media of stories[data].stories) {
				await client.instance.send(from, media.isVideo ? { video: { url: media.url } } : { image: { url: media.url } }, {});
				await delay(300);
			}
		}

		loggers.info(`${color('Downloaded Instagram Story', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);
	}
};
