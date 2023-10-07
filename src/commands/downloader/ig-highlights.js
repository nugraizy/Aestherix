import dayjs from 'dayjs';
import parser from 'yargs-parser';

import { color, ERRLOG, INFOLOG, isURL, numberWithCommas } from '../../utils/modules/index.js';
import { getHighlights2 } from '../../utils/instagram/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'ighighlights',
	description: 'Downloads the highlights of the user',
	usage: '!ighighlights <username>',
	aliases: ['igh', 'ighl'],
	category: 'Downloader',
	cooldown: 13,
	limit: 9,
	status: 'enable',
	async run({ from, query, prettyNumber, message, groupMetadata }, client) {
		const time = dayjs().format('HH:mm:ss DD/MM');

		if (!query) {
			return await client[botNum].reply('Please specify a username', { from, quoted: message, groupMetadata });
		}

		const { _: usernames } = parser(query);

		if (usernames.length === 1 && isURL(usernames[0])) {
			return await client[botNum].reply('Please specify a valid username', { from, quoted: message, groupMetadata });
		}

		for (const username of usernames) {
			if (isURL(username)) {
				await client[botNum].reply('Please specify a username', { from, quoted: message, groupMetadata });
			} else {
				const highlights = await getHighlights2(username);

				INFOLOG(
					`[${color(time, 'cyan')}]`,
					`${color('Downloading Instagram highlights', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`
				);

				if ('error' in highlights) {
					await client[botNum].reply(`Error while downloading Instagram highlights\n\n${highlights.error}\n${username}`, {
						from,
						quoted: message,
						groupMetadata
					});
					ERRLOG(
						`[${color(time, 'cyan')}]`,
						`⚠️ ${color('Failed to Download Instagram highlights', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`
					);

					continue;
				} else if (highlights.highlights === '') {
					await client[botNum].reply(`No highlights found for ${username}`, { from, quoted: message, groupMetadata });
					ERRLOG(`[${color(time, 'cyan')}]`, `⚠️ ${color('No highlights found for', 'cyan')} ${color(username, '#ff71ce')}`);

					continue;
				}

				let capt = 'Instagram Highlights'.formatHeaders();

				capt += `\n\nUsername  : ${highlights.user.username}\n`;
				capt += `Fullname  : ${highlights.user.fullName}\n`;
				capt += `Follower  : ${numberWithCommas(highlights.user.followers)}\n`;
				capt += `Following : ${numberWithCommas(highlights.user.following)}\n`;
				capt += highlights.user.biography === '' ? '' : `Biography : ${highlights.user.biography}\n`;
				capt += `Tot. Highlights : ${numberWithCommas(highlights.highlights.length)}\n\n`;
				capt += 'Each Sections of the Higlights will be send 2 media.\n';
				capt += `Tot. Sections : ${highlights.highlights.length}\n`;
				capt += `Tot. Estimated media per Section : ${numberWithCommas(highlights.highlights.length * 2)}\n\n`;

				await client[botNum].reply(capt.trim());

				if (highlights.highlights.length === 1) {
					for (const media of highlights.highlights[0].dataHighlight.slice(0, 2)) {
						capt = '';
						capt += `Highlights Title : ${highlights.highlights[0].title}\n`;

						await client[botNum].send(
							from,
							media.type === 'video'
								? { video: { url: media.url }, caption: capt.trim() }
								: { image: { url: media.url }, caption: capt.trim() },
							{ groupMetadata, quoted: message }
						);
					}
				} else {
					for (const media of highlights.highlights) {
						capt = '';
						capt += `Highlights Title : ${media.title}`;

						await client[botNum].send(
							from,
							media.dataHighlight[0].type === 'video'
								? { video: { url: media.dataHighlight[0].url }, caption: capt }
								: { image: { url: media.dataHighlight[0].url }, caption: capt },
							{ groupMetadata }
						);
						await client[botNum].send(
							from,
							media.dataHighlight[1].type === 'video'
								? { video: { url: media.dataHighlight[1].url } }
								: { image: { url: media.dataHighlight[1].url } },
							{ groupMetadata }
						);
					}
				}

				INFOLOG(
					`[${color(time, 'cyan')}]`,
					`${color('Downloaded Instagram highlights', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`
				);
			}
		}
	}
};
