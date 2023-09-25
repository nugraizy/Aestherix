import dayjs from 'dayjs';
import parser from 'yargs-parser';

import { color, ERRLOG, INFOLOG, isURL, numberWithCommas } from '../../utils/modules/index.js';
import { getHighlights2 } from '../../utils/instagram/index.js';

/**
 * @type {import('../types.js').Plugins}
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
	async run({ from, query, prettyNumber, message, grouppMetadata }, client) {
		const time = dayjs().format('HH:mm:ss DD/MM');

		if (!query) {
			return await client[botNum].reply({ grouppMetadata, from, quoted: message }, 'Please specify a username');
		}

		const { _: usernames } = parser(query);

		if (usernames.length === 1 && isURL(usernames[0])) {
			return await client[botNum].reply({ grouppMetadata, from, quoted: message }, 'Please specify a valid username');
		}

		for (const username of usernames) {
			if (isURL(username)) {
				await client[botNum].reply({ grouppMetadata, from, quoted: message }, 'Please specify a username');
			} else {
				const highlights = await getHighlights2(username);

				INFOLOG(
					`[${color(time, 'cyan')}]`,
					`${color('Downloading Instagram highlights', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`
				);

				if ('error' in highlights) {
					await client[botNum].reply(
						{ from, quoted: message },
						`Error while downloading Instagram highlights\n\n${highlights.error}\n${username}`
					);
					ERRLOG(
						`[${color(time, 'cyan')}]`,
						`⚠️ ${color('Failed to Download Instagram highlights', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`
					);

					continue;
				} else if (highlights.highlights === '') {
					await client[botNum].reply({ from, quoted: message }, `No highlights found for ${username}`);
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

				await client[botNum].reply({ grouppMetadata, from, quoted: message }, capt.trim());

				if (highlights.highlights.length === 1) {
					for (const media of highlights.highlights[0].dataHighlight.slice(0, 2)) {
						capt = '';
						capt += `Highlights Title : ${highlights.highlights[0].title}\n`;

						await client[botNum].send(
							from,
							media.type === 'video'
								? { video: { url: media.url }, caption: capt.trim() }
								: { image: { url: media.url }, caption: capt.trim() },
							{ grouppMetadata, quoted: message }
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
							{ grouppMetadata }
						);
						await client[botNum].send(
							from,
							media.dataHighlight[1].type === 'video'
								? { video: { url: media.dataHighlight[1].url } }
								: { image: { url: media.dataHighlight[1].url } },
							{ grouppMetadata }
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
