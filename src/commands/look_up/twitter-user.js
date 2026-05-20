import dayjs from 'dayjs';
import parser from 'yargs-parser';

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
		if (!query) {
			return await client.reply(from, 'Please specify a username.', message);
		}

		let { _: usernames } = parser(query);

		if (usernames.length === 1 && isURL(usernames[0])) {
			return await client.reply(from, 'Please specify a valid Twitter username, not a URL.', message);
		}

		for (const username of usernames) {
			if (isURL(username.trim())) {
				await client.reply(from, 'Please specify a valid Twitter username, not a URL.', message);

				continue;
			}

			const user = await twitter.getUser(username);
			const builder = new client.TemplateBuilder.Native();

			if (user?.error) {
				await client.reply(from, `Error while searching Twitter user\n\n${user.error}\n${username}`, message);

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

			let capt = 'Twitter User Lookup'.formatHeaders();

			capt += `\n\nUsername : @${userName}\n`;
			capt += `Fullname : ${name}\n`;
			capt += `Verified : ${verified ? '✅ Yes' : 'No'}\n`;
			capt += `Blue Verified : ${isBlueVerified ? '✅ Yes' : 'No'}\n`;
			capt += `Joined : ${dayjs(joined).format('MMM D, YYYY')}\n`;
			capt += `Followers : ${formatNumber(followers)}\n`;
			capt += `Following : ${formatNumber(following)}\n`;
			capt += `Tweets : ${formatNumber(tweets)}\n`;
			capt += `Likes : ${formatNumber(likes)}\n`;
			capt += `Personal URL : ${personalUrl || 'n/a'}\n`;
			capt += `Bio : ${biograph || 'n/a'}`;

			await builder
				.destination(from)
				.body(capt.trim().formatForm())
				.header('image', imageProfile)
				.footer('Powered by ' + __botName)
				.buttons(builder.button.reply({ display: 'Get User Tweets', id: cmdId('twttweets', username, { prefix }) }))
				.send();
		}
	}
});
