import dayjs from 'dayjs';
import parser from 'yargs-parser';
import _ from 'lodash';

import { color, ERRLOG, isURL, numberWithCommas } from '../../utils/modules/index.js';
import { tiktokProfileTIKTOK } from '../../utils/tiktok/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'tikstalk',
	description: 'Lookup TikTok user',
	usage: '!tikstalk <username>',
	aliases: ['ttstalk', 'ttuser'],
	category: 'Look-up',
	cooldown: 6,
	limit: 6,
	status: 'enable',
	async run({ from, query, prettyNumber, message, type, args, groupMetadata }, client) {
		const time = dayjs().format('HH:mm:ss DD/MM');

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

			await client[botNum].send(
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
			return await client[botNum].reply('Please specify a query', { from, quoted: message, groupMetadata });
		}

		let { _: usernames } = parser(query);

		if (usernames.length === 1 && isURL(usernames[0])) {
			return await client[botNum].reply('Please specify a valid TikTok usernames', { from, quoted: message, groupMetadata });
		}

		for (const user of usernames) {
			if (isURL(user.trim())) {
				await client[botNum].reply('Please specify a valid TikTok username', { from, quoted: message, groupMetadata });

				continue;
			}

			const users = await tiktokProfileTIKTOK(user);

			if ('error' in users) {
				client[botNum].reply(`Error while searching TikTok user\n\n${users.error}`, { from, quoted: message, groupMetadata });

				ERRLOG(
					`[${color(time, 'cyan')}]`,
					`⚠️ ${color('Failed to Searching TikTok User', 'red')} for ${color(prettyNumber, '#ff71ce')}`
				);

				continue;
			} else {
				const {
					keyword,
					username,
					fullName,
					biography,
					isVerified,
					profileHD,
					profileSD,
					profileLOW,
					followers,
					following,
					heart,
					totalVideo,
					posts
				} = users;

				let capt = `Username : ${username}\n`;

				capt += `Fullname : ${fullName}\n`;
				capt += `Followers : ${numberWithCommas(followers)}\n`;
				capt += `Following : ${numberWithCommas(following)}\n`;
				capt += `Tot. Like : ${numberWithCommas(heart)}\n`;
				capt += `Tot. Post : ${numberWithCommas(totalVideo)}\n`;
				capt += `Verified? : ${isVerified ? 'Yes' : 'No'}\n`;
				capt += `ID Profile : ${keyword}\n`;
				capt += `Biography : ${biography}\n`;

				await client[botNum].send(
					from,
					{
						image: { url: profileHD },
						caption: 'TikTok User Lookup'.formatHeaders(),
						templateButtons: [
							{ urlButton: { displayText: 'Profile Picture HD Source', url: profileHD } },
							{ urlButton: { displayText: 'Profile Picture SD Source', url: profileSD } },
							{ urlButton: { displayText: 'Profile Picture Low Source', url: profileLOW } },
							posts.length !== 0
								? { quickReplyButton: { displayText: 'Crawl Videos', id: `.tikstalk -crawl ${JSON.stringify(posts)}` } }
								: {}
						],
						footer: capt.trim()
					},
					{ groupMetadata, quoted: message }
				);
			}
		}
	}
};
