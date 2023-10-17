import parser from 'yargs-parser';

import { color, ERRLOG, isURL, numberWithCommas } from '../../utils/modules/index.js';
import { getUser } from '../../utils/instagram/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'instalk',
	description: 'Lookup Instagram user',
	usage: '!instalk <username>',
	aliases: ['instauser', 'iguser', 'igstalk'],
	category: 'Look-up',
	cooldown: 6,
	limit: 6,
	status: 'enable',
	async run({ from, query, prettyNumber, message, groupMetadata }, client) {
		if (!query) {
			return await client[botNum].reply('Please specify a url', { from, quoted: message, groupMetadata });
		}

		let { _: usernames } = parser(query);

		if (usernames.length === 1 && isURL(usernames[0])) {
			return await client[botNum].reply('Please specify a valid Instagram usernames', {
				from,
				quoted: message,
				groupMetadata
			});
		}

		for (const user of usernames) {
			if (isURL(user.trim())) {
				await client[botNum].reply('Please specify a valid Instagram username', { from, quoted: message, groupMetadata });

				continue;
			}

			const users = await getUser(user);

			if ('error' in users) {
				await client[botNum].reply(`Error while searching Instagram user\n\n${users.error}`, {
					from,
					quoted: message,
					groupMetadata
				});

				ERRLOG(`⚠️ ${color('Failed to Searching Instagram User', 'red')} for ${color(prettyNumber, '#ff71ce')}`);

				continue;
			} else {
				const {
					id,
					biography,
					followers,
					following,
					fullName,
					highlightCount,
					isBusinessAccount,
					isRecentUser,
					accountCategory,
					linkedFacebookPage,
					isPrivate,
					isVerified,
					profilePic,
					profilePicHD,
					username,
					postsCount
				} = users;

				let capt = `Username : ${username}\n`;

				capt += `Fullname : ${fullName}\n`;
				capt += `Followers : ${numberWithCommas(followers)}\n`;
				capt += `Following : ${numberWithCommas(following)}\n`;
				capt += `ID Profile :${id}\n`;
				capt += `Verified? : ${isVerified ? 'Yes' : 'No'}\n`;
				capt += `Business? : ${isBusinessAccount ? 'Yes' : 'No'}\n`;
				capt += `New User? : ${isRecentUser ? 'Yes' : 'No'}\n`;
				capt += `Category? : ${accountCategory ? accountCategory : 'No'}\n`;
				capt += `Facebook Linked? : ${linkedFacebookPage ? 'Yes' : 'No'}\n`;
				capt += `Private? : ${isPrivate ? 'Yes' : 'No'}\n`;
				capt += `Tot. Highlight : ${numberWithCommas(highlightCount)}\n`;
				capt += `Tot. Post : ${numberWithCommas(postsCount)}\n`;
				capt += `Biography : ${biography}\n`;

				await client[botNum].send(
					from,
					{
						image: { url: profilePicHD },
						caption: 'Instagram User Lookup'.formatHeaders(),
						templateButtons: [
							{ urlButton: { displayText: 'Profile Picture HD Source', url: profilePicHD } },
							{ urlButton: { displayText: 'Profile Picture Low Source', url: profilePic } }
						],
						footer: capt.trim()
					},
					{ groupMetadata, quoted: message }
				);
			}
		}
	}
};
