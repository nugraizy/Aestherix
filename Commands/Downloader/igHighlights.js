/* global botNum */
import moment from 'moment-timezone';
import parser from 'yargs-parser';

import { color, ERRLOG, INFOLOG, isEmpty, isOne, isSame, isURL, numberWithCommas } from '../../Helper/Modules/index.js';
import { getHighlights2 } from '../../Utils/Instagram/index.js';

export default {
	name: 'ighighlights',
	description: 'Downloads the highlights of the user',
	usage: '!ighighlights <username>',
	aliases: ['igh', 'ighl'],
	category: 'Downloader',
	cooldown: 13,
	limit: 9,
	status: 'enable',
	async run({ from, query, prettyNumber, message }, client) {
		const time = moment().format('HH:mm:ss DD/MM');

		if (!query) {
			return await client[botNum].reply({ from, quoted: message }, 'Please specify a username');
		}

		const { _: usernames } = parser(query);

		if (isOne(usernames.length) && isURL(usernames[0])) {
			return await client[botNum].reply({ from, quoted: message }, 'Please specify a valid username');
		}

		for (const username of usernames) {
			if (isURL(username)) {
				await client[botNum].reply({ from, quoted: message }, 'Please specify a username');
			} else {
				const highlights = await getHighlights2(username);

				INFOLOG(`[${color(time, 'cyan')}]`, `${color('Downloading Instagram highlights', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`);

				if ('error' in highlights) {
					await client[botNum].reply({ from, quoted: message }, `Error while downloading Instagram highlights\n\n${highlights.error}\n${username}`);
					ERRLOG(`[${color(time, 'cyan')}]`, `${color('Failed to Download Instagram highlights', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`);

					continue;
				} else if (isEmpty(highlights.highlights)) {
					await client[botNum].reply({ from, quoted: message }, `No highlights found for ${username}`);
					ERRLOG(`[${color(time, 'cyan')}]`, `${color('No highlights found for', 'cyan')} ${color(username, '#ff71ce')}`);

					continue;
				}

				let capt = '``` • Instagram Highlights```\n\n';

				capt += `Username  : ${highlights.user.username}\n`;
				capt += `Fullname  : ${highlights.user.fullName}\n`;
				capt += `Follower  : ${numberWithCommas(highlights.user.followers)}\n`;
				capt += `Following : ${numberWithCommas(highlights.user.following)}\n`;
				capt += isEmpty(highlights.user.biography) ? '' : `Biography : ${highlights.user.biography}\n`;
				capt += `Tot. Highlights : ${numberWithCommas(highlights.highlights.length)}\n\n`;
				capt += 'Each Sections of the Higlights will be send 2 media.\n';
				capt += `Tot. Sections : ${highlights.highlights.length}\n`;
				capt += `Tot. Estimated media per Section : ${numberWithCommas(highlights.highlights.length * 2)}\n\n`;

				await client[botNum].reply({ from, quoted: message }, capt.trim());

				if (isOne(highlights.highlights.length)) {
					for (const media of highlights.highlights[0].dataHighlight.slice(0, 2)) {
						capt = '';
						capt += `Highlights Title : ${highlights.highlights[0].title}\n`;

						await client[botNum].sendMessage(
							from,
							isSame(media.type, 'video') ? { video: { url: media.url }, caption: capt.trim() } : { image: { url: media.url }, caption: capt.trim() },
							{ quoted: message },
						);
					}
				} else {
					for (const media of highlights.highlights) {
						capt = '';
						capt += `Highlights Title : ${media.title}`;

						await client[botNum].sendMessage(
							from,
							isSame(media.dataHighlight[0].type, 'video') ? { video: { url: media.dataHighlight[0].url }, caption: capt } : { image: { url: media.dataHighlight[0].url }, caption: capt },
						);
						await client[botNum].sendMessage(
							from,
							isSame(media.dataHighlight[1].type, 'video') ? { video: { url: media.dataHighlight[1].url } } : { image: { url: media.dataHighlight[1].url } },
						);
					}
				}

				INFOLOG(`[${color(time, 'cyan')}]`, `${color('Downloaded Instagram highlights', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`);
			}
		}
	},
};
