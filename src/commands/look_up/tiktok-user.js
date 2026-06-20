import { BOT_NAME } from '../../core/constants.js';

import _ from 'lodash';
import parser from 'yargs-parser';

import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { color, formatNumber, loggers } from '../../utils/modules/index.js';
import { tiktok } from '../../utils/tiktok/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'tikstalk',
	minifiedDescription: 'Look-up TikTok User',
	description: 'Look-up TikTok user.',
	usage: '!tikstalk `<username>`',
	aliases: ['ttstalk', 'ttuser'],
	category: 'Look-up',
	cooldown: 6,
	limit: 6,
	status: 'enable',
	async run({ from, query, prettyNumber, message, type, args, prefix }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

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
					rows: [{ title: `${v.int}`, rowId: cmdId('ttv', v.videos.map((v) => v.url.sourceUrl).join(' '), { prefix }) }],
					title: '\t'
				})
			);

			await client.send(
				from,
				{
					buttonText: 'Open list',
					title: 'See List Videos',
					footer: `Made by ${BOT_NAME}. Powered by Hidden Finder`,
					text: '\t',
					sections: row
				},
				{}
			);

			return;
		}

		if (!query) {
			return await client.reply(from, L.errors.noQuery, message);
		}

		let { _: usernames } = parser(query);

		const users = await tiktok.search.lookup(usernames);

		for (const data in users) {
			if (users[data]?.error) {
				client.reply(from, `${L.errors.failedSearch}\n\n${users[data].error}`, message);

				loggers.error(`${color('Failed to Search TikTok User', 'red')} for ${color(prettyNumber, 'lilac')}`);
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

			capt += `Author : ${fullName}\n`;
			capt += `Verifies : ${isVerified ? 'Verified' : 'Not Verified'}\n`;
			capt += `ID Profile : ${keyword}\n`;
			capt += `👥 ${formatNumber(followers)} 👤 ${formatNumber(following)} ❤️ ${formatNumber(heart)}\n`;
			capt += `🎞️ ${formatNumber(totalVideo)}\n\n`;

			capt += `📝 ${biography}\n`;

			await client.send(
				from,
				{
					image: { url: profileHD || profileSD },
					caption: 'TikTok User Lookup'.formatHeaders() + `\n\n${capt.trim().formatForm()}`.trimEnd()
				},
				{ quoted: message }
			);
		}
	}
});
