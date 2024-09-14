import parser from 'yargs-parser';

import { color, loggers, numberWithCommas } from '../../utils/modules/index.js';
import { instagram } from '../../utils/instagram/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'instalk',
	minifiedDescription: 'Look-up Instagram User',
	description: 'Look-up Instagram user.',
	usage: '!instalk <username>',
	aliases: ['instauser', 'iguser', 'igstalk'],
	category: 'Look-up',
	cooldown: 6,
	limit: 6,
	status: 'enable',
	async run({ from, query, prettyNumber, message, groupMetadata }, client) {
		if (!query) {
			return await client.instance.reply('Please specify a url', { from, quoted: message, groupMetadata });
		}

		let { _: usernames } = parser(query);

		const users = await instagram.search.user(usernames);

		loggers.WRN(`${color('Searching Instagram User', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);

		for (const data in users) {
			if ('error' in users[data]) {
				await client.instance.reply(`Error while searching Instagram user\n\n${users[data].error}\n${data}`, {
					from,
					quoted: message,
					groupMetadata
				});
				loggers.ERR(`${color('Failed to Searching Instagram User', '#FF5555')} for ${color(prettyNumber, '#E4C1F9')}`);
				continue;
			}

			let capt = 'Instagram User Lookup'.formatHeaders();

			capt += `\n\nUsername : ${users[data].username}\n`;
			capt += `Fullname : ${users[data].fullName}\n`;
			capt += `Follower : ${numberWithCommas(users[data].followers)}\n`;
			capt += `Following : ${numberWithCommas(users[data].following)}\n`;
			capt += users[data].biography === '' ? '' : `Biography : ${users[data].biography}\n`;
			capt += `Verified : ${users[data].isVerified ? 'Verified' : 'Not Verified'}\n`;
			capt += `Private : ${users[data].isPrivate ? 'Private' : 'Public'}\n`;
			capt += `Business : ${users[data].isBusinessAccount ? 'Yes' : 'No'}\n`;
			capt += `New User : ${users[data].isRecentUser ? 'Yes' : 'No'}\n`;
			capt += `Category : ${users[data].accountCategory ? users[data].accountCategory : 'No'}\n`;
			capt += `Facebook Linked : ${users[data].linkedFacebookPage ? 'Yes' : 'No'}\n`;
			capt += `Tot. Highlight : ${numberWithCommas(users[data].highlightCount)}\n`;
			capt += `Tot. Post : ${numberWithCommas(users[data].postsCount)}\n\n`;

			await client.instance.send(
				from,
				{
					image: { url: users[data].profilePicHD },
					caption: capt.trim().formatForm()
				},
				{ groupMetadata, quoted: message }
			);
		}
	}
};
