import parser from 'yargs-parser';

import configuration from '../../helper/config/connect.js';
import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { color, loggers, numberWithCommas } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'instalk',
	minifiedDescription: 'Look-up Instagram User',
	description: 'Look-up Instagram user.',
	usage: '!instalk `<username>`',
	aliases: ['instauser', 'iguser', 'igstalk'],
	category: 'Look-up',
	cooldown: 6,
	limit: 6,
	status: 'enable',
	async run({ from, query, prettyNumber, message }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!configuration.isInstagramInitiated) {
			return await client.reply(from, L.errors.instagramNotInit, message);
		}

		if (!query) {
			return await client.reply(from, L.errors.noUrl, message);
		}

		let { _: usernames } = parser(query);

		const users = await configuration.instagram.search.user(usernames);

		loggers.warning(`${color('Searching Instagram User', 'pink')} for ${color(prettyNumber, 'lilac')}`);

		for (const data in users) {
			if (users[data]?.error) {
				await client.reply(from, `${L.errors.failedSearch}\n\n${users[data].error}\n${data}`, message);
				loggers.error(`${color('Failed to Searching Instagram User', 'red')} for ${color(prettyNumber, 'lilac')}`);
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

			await client.send(
				from,
				{
					image: { url: users[data].profilePicHD },
					caption: capt.trim().formatForm()
				},
				{ quoted: message }
			);
		}
	}
});
