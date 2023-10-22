import parser from 'yargs-parser';

import { color, delay, ERRLOG, INFOLOG, numberWithCommas } from '../../utils/modules/index.js';
import { instagram } from '../../utils/instagram/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'igstory',
	description: 'Downloads the story of the user',
	usage: '!igstory <username>',
	aliases: ['igstory', 'igs'],
	category: 'Downloader',
	cooldown: 10,
	limit: 9,
	status: 'enable',
	async run({ from, query, prettyNumber, message, groupMetadata }, client) {
		if (!query) {
			return await client[botNum].reply('Please specify a username', { from, quoted: message, groupMetadata });
		}

		const { _: input } = parser(query);

		const stories = await instagram.search.story(input);

		INFOLOG(`${color('Downloading Instagram Story', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`);

		for (const data in stories) {
			if ('error' in stories[data]) {
				await client[botNum].reply(`Error while downloading Instagram story\n\n${stories[data].error}\n${data}`, {
					from,
					quoted: message,
					groupMetadata
				});
				ERRLOG(`⚠️ ${color('Failed to Download Instagram Story', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`);
				continue;
			}

			let capt = 'Instagram Story'.formatHeaders();

			capt += `\n\nUsername : ${stories[data].username}\n`;
			capt += `Fullname : ${stories[data].fullName}\n`;
			capt += `Follower : ${numberWithCommas(stories[data].followers)}\n`;
			capt += `Following : ${numberWithCommas(stories[data].following)}\n`;
			capt += stories[data].biography === '' ? '' : `Biography : ${stories[data].biography}\n`;
			capt += `Verified : ${stories[data].isVerified ? 'Verified' : 'Not Verified'}\n`;
			capt += `Private : ${stories[data].isPrivate ? 'Private' : 'Public'}\n`;
			capt += `Business : ${stories[data].isBusinessAccount ? 'Yes' : 'No'}\n`;
			capt += `New User : ${stories[data].isRecentUser ? 'Yes' : 'No'}\n`;
			capt += `Category : ${stories[data].accountCategory ? stories[data].accountCategory : 'No'}\n`;
			capt += `Facebook Linked : ${stories[data].linkedFacebookPage ? 'Yes' : 'No'}\n`;
			capt += `Tot. Highlight : ${numberWithCommas(stories[data].highlightCount)}\n`;
			capt += `Tot. Post : ${numberWithCommas(stories[data].postsCount)}\n`;
			capt += `Tot. Story : ${stories[data].stories.length}\n\n`;

			await client[botNum].reply(capt.trim(), { from, quoted: message, groupMetadata });

			capt = '';

			for (const media of stories[data].stories) {
				await client[botNum].send(from, media.isVideo ? { video: { url: media.url } } : { image: { url: media.url } }, {
					groupMetadata
				});
				await delay(300);
			}
		}

		INFOLOG(`${color('Downloaded Instagram Story', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`);
	}
};
