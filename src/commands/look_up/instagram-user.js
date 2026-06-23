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
		const Ll = useLocale(locale, 'look_up');

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

			let capt = Ll.titles.igUser.formatHeaders();

			capt += `\n\n${L.core.caption.username} : ${users[data].username}\n`;
			capt += `${L.core.caption.fullname} : ${users[data].fullName}\n`;
			capt += `${Ll.labels.follower} : ${numberWithCommas(users[data].followers)}\n`;
			capt += `${Ll.labels.following} : ${numberWithCommas(users[data].following)}\n`;
			capt += users[data].biography === '' ? '' : `${Ll.labels.biography} : ${users[data].biography}\n`;
			capt += `${L.core.caption.verified} : ${users[data].isVerified ? L.core.caption.verified : L.core.caption.notVerified}\n`;
			capt += `${L.core.caption.private} : ${users[data].isPrivate ? L.core.caption.private : L.core.caption.public}\n`;
			capt += `${Ll.labels.business} : ${users[data].isBusinessAccount ? L.core.labels.yes : L.core.labels.no}\n`;
			capt += `${Ll.labels.newUser} : ${users[data].isRecentUser ? L.core.labels.yes : L.core.labels.no}\n`;
			capt += `${Ll.labels.category} : ${users[data].accountCategory ? users[data].accountCategory : L.core.labels.no}\n`;
			capt += `${Ll.labels.facebookLinked} : ${users[data].linkedFacebookPage ? L.core.labels.yes : L.core.labels.no}\n`;
			capt += `${Ll.labels.totHighlight} : ${numberWithCommas(users[data].highlightCount)}\n`;
			capt += `${Ll.labels.totPost} : ${numberWithCommas(users[data].postsCount)}\n\n`;

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
