import parser from 'yargs-parser';

import { color, ERRLOG, isURL } from '../../utils/modules/index.js';
import { twitterUser } from '../../utils/twitter/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'twitstalk',
	minifiedDescription: 'Look-up Twitter User',
	description: 'Look-up Twitter user.',
	usage: '!twitstalk <username>',
	aliases: ['twtlu', 'twtlookup', 'twtuser'],
	category: 'Look-up',
	cooldown: 6,
	limit: 6,
	status: 'enable',
	async run({ from, query, prettyNumber, message, groupMetadata }, client) {
		if (!query) {
			return await client.instance.reply('Please specify a url', { from, quoted: message, groupMetadata });
		}

		let { _: usernames } = parser(query);

		if (usernames.length === 1 && isURL(usernames[0])) {
			return await client.instance.reply('Please specify a valid Twitter usernames', { from, quoted: message, groupMetadata });
		}

		for (const username of usernames) {
			if (isURL(username.trim())) {
				await client.instance.reply('Please specify a valid Twitter username', { from, quoted: message, groupMetadata });

				continue;
			}

			const user = await twitterUser(username);

			if ('error' in user) {
				await client.instance.reply(`Error while searching Twitter user\n\n${user.error}\n${username}`, {
					from,
					quoted: message,
					groupMetadata
				});

				ERRLOG(`⚠️ ${color('Failed to Searching Twitter User', '#FF5555')} for ${color(prettyNumber, '#E4C1F9')}`);

				continue;
			}

			const { biograph, username: userName, name, joined, verified, imageProfile, personalUrl } = user;

			let capt = 'Twitter User Lookup'.formatHeaders();

			capt += `Username : ${userName}\n`;
			capt += `Fullname : ${name}\n`;
			capt += `Verified? : ${verified ? 'Yes' : 'No'}\n`;
			capt += `Joined : ${joined}\n`;
			capt += `Personal URL : ${personalUrl}\n`;
			capt += `Biograph : ${biograph}`;

			await client.instance.send(
				from,
				{ image: { url: imageProfile }, caption: capt.trim().formatForm() },
				{ groupMetadata, quoted: message }
			);
		}
	}
};
