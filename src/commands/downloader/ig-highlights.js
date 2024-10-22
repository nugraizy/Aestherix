import parser from 'yargs-parser';

import { color, loggers, numberWithCommas, isURL } from '../../utils/modules/index.js';
import { instagram } from '../../utils/instagram/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'ighighlights',
	minifiedDescription: 'Download Instagram Highlights',
	description: 'Downloads the highlights of the user',
	usage: '!ighighlights <username>',
	aliases: ['igh', 'ighl'],
	category: 'Downloader',
	cooldown: 13,
	limit: 9,
	status: 'enable',
	async run({ from, query, prettyNumber, message, groupMetadata }, client) {
		if (!query) {
			return await client.instance.reply('Please specify a username', { from, quoted: message, groupMetadata });
		}

		const { _: input } = parser(query);

		const highlights = await instagram.search.highlight(input);

		loggers.WRN(`${color('Downloading Instagram highlights', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);

		for (const data in highlights) {
			if ('error' in highlights[data]) {
				await client.instance.reply(`Error while downloading Instagram highlights\n\n${highlights.error}\n${data}`, {
					from,
					quoted: message,
					groupMetadata
				});
				loggers.ERR(`${color('Failed to Download Instagram highlights', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);
				continue;
			}

			let capt = 'Instagram Highlights'.formatHeaders();

			capt += `\n\nUsername  : ${highlights[data].user.username}\n`;
			capt += `Fullname  : ${highlights[data].user.fullName}\n`;
			capt += `Follower  : ${numberWithCommas(highlights[data].user.followers)}\n`;
			capt += `Following : ${numberWithCommas(highlights[data].user.following)}\n`;
			capt += highlights[data].user.biography === '' ? '' : `Biography : ${highlights[data].user.biography}\n`;
			capt += `Tot. Highlights : ${numberWithCommas(highlights[data].highlights.length)}\n\n`;
			if (!isURL(input)) {
				capt += 'Each Sections of the Higlights will be send 2 media.\n';
				capt += `Tot. Sections : ${highlights[data].highlights.length}\n`;
				capt += `Tot. Estimated media per Section : ${numberWithCommas(highlights[data].highlights.length * 2)}\n\n`;
			}

			await client.instance.reply(capt.trim().formatForm(), { from, quoted: message, groupMetadata });

			capt = '';

			if (highlights[data].highlights.length === 1) {
				const highlight = highlights[data].highlights[0].dataHighlight.slice(0, 2);
				for (const media of highlight) {
					await client.instance.send(
						from,
						{ [media.type === 'video' ? 'video' : 'image']: { url: media.url } },
						{ groupMetadata, quoted: message }
					);
				}
			} else {
				for (const media of highlights[data].highlights) {
					const caption = media.title;
					const dataHighlight =
						media.dataHighlight.length >= 2 ? [media.dataHighlight[0], media.dataHighlight[1]] : [media.dataHighlight[0]];
					let status = true;

					for (const highlight of dataHighlight) {
						await client.instance.send(
							from,
							{
								[highlight.type === 'video' ? 'video' : 'image']: { url: highlight.url },
								...(status && { caption })
							},
							{ groupMetadata }
						);
						status = false;
					}
				}
			}
		}

		loggers.INF(`${color('Downloaded Instagram highlights', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);
	}
};
