/* global botNum */
import dayjs from 'dayjs';
import parser from 'yargs-parser';

import { color, ERRLOG, isOne, isURL, numberWithCommas } from '../../helper/modules/index.js';
import { getUser } from '../../utils/instagram/index.js';

export default {
	name: 'instalk',
	description: 'Lookup Instagram user',
	usage: '!instalk <username>',
	aliases: ['instauser', 'iguser', 'igstalk'],
	category: 'Look-up',
	cooldown: 6,
	limit: 6,
	status: 'enable',
	async run({ from, query, prettyNumber, message }, client) {
		const time = dayjs().format('HH:mm:ss DD/MM');

		if (!query) {
			return await client[botNum].reply({ from, quoted: message }, 'Please specify a url');
		}

		let { _: usernames } = parser(query);

		if (isOne(usernames.length) && isURL(usernames[0])) {
			return await client[botNum].reply({ from, quoted: message }, 'Please specify a valid Instagram usernames');
		}

		for (const user of usernames) {
			if (isURL(user.trim())) {
				await client[botNum].reply({ from, quoted: message }, 'Please specify a valid Instagram username');

				continue;
			}

			const users = await getUser(user);

			if ('error' in users) {
				await client[botNum].reply({ from, quoted: message }, `Error while searching Instagram user\n\n${users.error}`);

				ERRLOG(
					`[${color(time, 'cyan')}]`,
					`⚠️ ${color('Failed to Searching Instagram User', 'red')} for ${color(prettyNumber, '#ff71ce')}`,
				);

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
					postsCount,
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

				await client[botNum].sendMessage(
					from,
					{
						image: { url: profilePicHD },
						caption: 'Instagram User Lookup'.formatHeaders(),
						templateButtons: [
							{ urlButton: { displayText: 'Profile Picture HD Source', url: profilePicHD } },
							{ urlButton: { displayText: 'Profile Picture Low Source', url: profilePic } },
						],
						footer: capt.trim(),
					},
					{ quoted: message },
				);
			}
		}
	},
};
