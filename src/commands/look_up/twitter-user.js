import { BOT_NAME } from '../../core/constants.js';

import dayjs from 'dayjs';
import parser from 'yargs-parser';

import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { color, formatNumber, isURL, loggers } from '../../utils/modules/index.js';
import { Twitter } from '../../utils/twitter/index.js';
import { defineCommand } from '../_define.js';

const twitter = new Twitter({ cookie: process.env.TWITTER_COOKIE });

export default defineCommand({
	name: 'twitstalk',
	minifiedDescription: 'Look-up Twitter User',
	description: 'Look-up Twitter user.',
	usage: '!twitstalk `<username>`',
	aliases: ['twtlu', 'twtlookup', 'twtuser'],
	category: 'Look-up',
	cooldown: 6,
	limit: 6,
	status: 'enable',
	async run({ from, query, prettyNumber, message, prefix }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const Ll = useLocale(locale, 'look_up');

		if (!query) {
			return await client.reply(from, L.errors.usernameRequired, message);
		}

		let { _: usernames } = parser(query);

		if (usernames.length === 1 && isURL(usernames[0])) {
			return await client.reply(from, L.errors.twitterUsernameRequired, message);
		}

		for (const username of usernames) {
			if (isURL(username.trim())) {
				await client.reply(from, L.errors.twitterUsernameRequired, message);

				continue;
			}

			const user = await twitter.getUser(username);
			const builder = new client.TemplateBuilder.Native();

			if (user?.error) {
				await client.reply(from, `${L.errors.failedSearch}\n\n${user.error}\n${username}`, message);

				loggers.error(`${color('Failed to Searching Twitter User', 'red')} for ${color(prettyNumber, 'lilac')}`);

				continue;
			}

			const {
				biograph,
				username: userName,
				name,
				joined,
				verified,
				isBlueVerified,
				imageProfile,
				personalUrl,
				followers,
				following,
				tweets,
				likes
			} = user;

			let capt = Ll.titles.twitterUser.formatHeaders();

			capt += `\n\n${L.core.caption.username} : @${userName}\n`;
			capt += `${L.core.caption.fullname} : ${name}\n`;
			capt += `${Ll.labels.verified} : ${verified ? '✅ ' + L.core.labels.yes : L.core.labels.no}\n`;
			capt += `${Ll.labels.blueVerified} : ${isBlueVerified ? '✅ ' + L.core.labels.yes : L.core.labels.no}\n`;
			capt += `${Ll.labels.joined} : ${dayjs(joined).format('MMM D, YYYY')}\n`;
			capt += `${L.core.caption.followers} : ${formatNumber(followers)}\n`;
			capt += `${Ll.labels.following} : ${formatNumber(following)}\n`;
			capt += `${Ll.labels.tweets} : ${formatNumber(tweets)}\n`;
			capt += `${L.core.caption.likes} : ${formatNumber(likes)}\n`;
			capt += `${Ll.labels.personalUrl} : ${personalUrl || 'n/a'}\n`;
			capt += `${Ll.labels.bio} : ${biograph || 'n/a'}`;

			await builder
				.destination(from)
				.body(capt.trim().formatForm())
				.header('image', imageProfile)
				.footer(t(locale, 'look_up.footer.poweredBy', [BOT_NAME]))
				.buttons(builder.button.reply({ display: Ll.labels.getUserTweets, id: cmdId('twttweets', username, { prefix }) }))
				.send();
		}
	}
});
