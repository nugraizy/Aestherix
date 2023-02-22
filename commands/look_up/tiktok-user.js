/* global botNum */
import dayjs from 'dayjs';
import parser from 'yargs-parser';

import { color, ERRLOG, isOne, isURL, numberWithCommas } from '../../helper/modules/index.js';
import { tiktokProfileTIKTOK } from '../../utils/tiktok/index.js';

const split = (arrs, len) => {
	let idx = 0;
	const result = [];

	while (idx < arrs.length) {
		if (idx % len === 0) result.push([]);
		result[result.length - 1].push(arrs[idx++]);
	}

	return result;
};

export default {
	name: 'tikstalk',
	description: 'Lookup TikTok user',
	usage: '!tikstalk <username>',
	aliases: ['ttstalk', 'ttuser'],
	category: 'Look-up',
	cooldown: 6,
	limit: 6,
	status: 'enable',
	async run({ from, query, prettyNumber, message, type, args }, client) {
		const time = dayjs().format('HH:mm:ss DD/MM');

		if (type === 'templateButtonReplyMessage' && args[1] === '-crawl') {
			let data = JSON.parse(args.slice(2).join(' '));
			let len = '';
			let int = 0;

			data = split(data, 5).map((v, i) => {
				len = i === 0 ? `1 - ${v.length}` : `${int + 1} - ${int + v.length}`;
				int += v.length;
				return {
					int: len,
					videos: v,
				};
			});

			const row = [];

			data.forEach((v) =>
				row.push({
					rows: [{ title: `${v.int}`, rowId: `.ttv ${v.videos.map((v) => v.url.sourceUrl).join(' ')}` }],
					title: '\t',
				}),
			);

			await client[botNum].sendMessage(from, {
				buttonText: 'Open list',
				title: 'See List Videos',
				footer: 'Made by Void Bot. Powered by Hidden Finder',
				text: '\t',
				sections: row,
			});

			return;
		}

		if (!query) {
			return await client[botNum].reply({ from, quoted: message }, 'Please specify a query');
		}

		let { _: usernames } = parser(query);

		if (isOne(usernames.length) && isURL(usernames[0])) {
			return await client[botNum].reply({ from, quoted: message }, 'Please specify a valid TikTok usernames');
		}

		for (const user of usernames) {
			if (isURL(user.trim())) {
				await client[botNum].reply({ from, quoted: message }, 'Please specify a valid TikTok username');

				continue;
			}

			const users = await tiktokProfileTIKTOK(user);

			if ('error' in users) {
				client[botNum].reply({ from, quoted: message }, `Error while searching TikTok user\n\n${users.error}`);

				ERRLOG(
					`[${color(time, 'cyan')}]`,
					`⚠️ ${color('Failed to Searching TikTok User', 'red')} for ${color(prettyNumber, '#ff71ce')}`,
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
					posts,
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

				await client[botNum].sendMessage(
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
								: {},
						],
						footer: capt.trim(),
					},
					{ quoted: message },
				);
			}
		}
	},
};
