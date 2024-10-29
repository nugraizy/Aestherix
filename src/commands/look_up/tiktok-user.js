import parser from 'yargs-parser';
import _ from 'lodash';

import { color, numberWithCommas, loggers } from '../../utils/modules/index.js';
import { tiktok } from '../../utils/tiktok/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'tikstalk',
	minifiedDescription: 'Look-up TikTok User',
	description: 'Look-up TikTok user.',
	usage: '!tikstalk <username>',
	aliases: ['ttstalk', 'ttuser'],
	category: 'Look-up',
	cooldown: 6,
	limit: 6,
	status: 'enable',
	async run({ from, query, prettyNumber, message, type, args, groupMetadata }, client) {
		if (type === 'templateButtonReplyMessage' && args[1] === '-crawl') {
			let data = JSON.parse(args.slice(2).join(' '));
			let len = '';
			let int = 0;

			data = _.chunk(data, 5).map((v, i) => {
				len = i === 0 ? `1 - ${v.length}` : `${int + 1} - ${int + v.length}`;
				int += v.length;
				return {
					int: len,
					videos: v
				};
			});

			const row = [];

			data.forEach((v) =>
				row.push({
					rows: [{ title: `${v.int}`, rowId: `.ttv ${v.videos.map((v) => v.url.sourceUrl).join(' ')}` }],
					title: '\t'
				})
			);

			await client.instance.send(
				from,
				{
					buttonText: 'Open list',
					title: 'See List Videos',
					footer: 'Made by Void Bot. Powered by Hidden Finder',
					text: '\t',
					sections: row
				},
				{ groupMetadata }
			);

			return;
		}

		if (!query) {
			return await client.instance.reply('Please specify a query', { from, quoted: message, groupMetadata });
		}

		let { _: usernames } = parser(query);

		const users = await tiktok.search.lookup(usernames);

		for (const data in users) {
			if ('error' in users[data]) {
				client.instance.reply(`Error while searching TikTok user\n\n${users[data].error}`, {
					from,
					quoted: message,
					groupMetadata
				});

				loggers.error(`${color('Failed to Search TikTok User', '#FF5555')} for ${color(prettyNumber, '#E4C1F9')}`);
				continue;
			}

			const {
				keyword,
				username,
				fullName,
				biography,
				isVerified,
				profileHD,
				profileSD,
				followers,
				following,
				heart,
				totalVideo
			} = users[data];

			let capt = `Username : ${username}\n`;

			capt += `Fullname : ${fullName}\n`;
			capt += `Followers : ${numberWithCommas(followers)}\n`;
			capt += `Following : ${numberWithCommas(following)}\n`;
			capt += `Tot. Like : ${numberWithCommas(heart)}\n`;
			capt += `Tot. Post : ${numberWithCommas(totalVideo)}\n`;
			capt += `Verified? : ${isVerified ? 'Yes' : 'No'}\n`;
			capt += `ID Profile : ${keyword}\n`;
			capt += `Biography : ${biography}\n`;

			await client.instance.send(
				from,
				{
					image: { url: profileHD || profileSD },
					caption: 'TikTok User Lookup'.formatHeaders() + `\n\n${capt.trim().formatForm()}`.trimEnd()
				},
				{ groupMetadata, quoted: message }
			);
		}
	}
};
