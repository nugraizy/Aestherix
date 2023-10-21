import parser from 'yargs-parser';

import { color, ERRLOG, isURL } from '../../utils/modules/index.js';
import { twitterUser } from '../../utils/twitter/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
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
		if (!query) {
			return await client[botNum].reply('Please specify a url', { from, quoted: message, groupMetadata });
		}

		let { _: usernames } = parser(query);

		if (usernames.length === 1 && isURL(usernames[0])) {
			return await client[botNum].reply('Please specify a valid Twitter usernames', { from, quoted: message, groupMetadata });
		}

		for (const username of usernames) {
			if (isURL(username.trim())) {
				await client[botNum].reply('Please specify a valid Twitter username', { from, quoted: message, groupMetadata });

				continue;
			}

			const user = await twitterUser(username);

			if ('error' in user) {
				await client[botNum].reply(`Error while searching Twitter user\n\n${user.error}\n${username}`, {
					from,
					quoted: message,
					groupMetadata
				});

				ERRLOG(`⚠️ ${color('Failed to Searching Twitter User', '#FF5555')} for ${color(prettyNumber, '#ff71ce')}`);

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
