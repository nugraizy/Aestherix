import dayjs from 'dayjs';
import parser from 'yargs-parser';

import { color, ERRLOG, isURL } from '../../utils/modules/index.js';
import { twitterUser } from '../../utils/twitter/index.js';

export default {
	name: 'twitstalk',
	description: 'Lookup Twitter user',
	usage: '!twitstalk <username>',
	aliases: ['twtlu', 'twtlookup', 'twtuser'],
	category: 'Look-up',
	cooldown: 6,
	limit: 6,
	status: 'enable',
	async run({ from, query, prettyNumber, message, groupMetadata }, client) {
		const time = dayjs().format('HH:mm:ss DD/MM');

		if (!query) {
			return await client[botNum].reply({ groupMetadata, from, quoted: message }, 'Please specify a url');
		}

		let { _: usernames } = parser(query);

		if (usernames.length === 1 && isURL(usernames[0])) {
			return await client[botNum].reply({ groupMetadata, from, quoted: message }, 'Please specify a valid Twitter usernames');
		}

		for (const username of usernames) {
			if (isURL(username.trim())) {
				await client[botNum].reply({ groupMetadata, from, quoted: message }, 'Please specify a valid Twitter username');

				continue;
			}

			const user = await twitterUser(username);

			if ('error' in user) {
				await client[botNum].reply(
					{ from, quoted: message },
					`Error while searching Twitter user\n\n${user.error}\n${username}`
				);

				ERRLOG(
					`[${color(time, 'cyan')}]`,
					`⚠️ ${color('Failed to Searching Twitter User', 'red')} for ${color(prettyNumber, '#ff71ce')}`
				);

				continue;
			} else {
				const { biograph, username, name, joined, verified, imageProfile, personalUrl } = user;

				let capt = 'Twitter User Lookup'.formatHeaders();

				capt += `Username : ${username}\n`;
				capt += `Fullname : ${name}\n`;
				capt += `Verified? : ${verified ? 'Yes' : 'No'}\n`;
				capt += `Joined : ${joined}\n`;
				capt += `Personal URL : ${personalUrl}\n`;
				capt += `Biograph : ${biograph}`;

				await client[botNum].send(
					from,
					{ image: { url: imageProfile }, caption: capt.trim() },
					{ groupMetadata, quoted: message }
				);
			}
		}
	}
};
