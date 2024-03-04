import parser from 'yargs-parser';

import { color, ERRLOG, INFOLOG, numberWithCommas } from '../../utils/modules/index.js';
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

		INFOLOG(`${color('Downloading Instagram highlights', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`);

		for (const data in highlights) {
			if ('error' in highlights[data]) {
				await client.instance.reply(`Error while downloading Instagram highlights\n\n${highlights.error}\n${data}`, {
					from,
					quoted: message,
					groupMetadata
				});
				ERRLOG(`⚠️ ${color('Failed to Download Instagram highlights', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`);
				continue;
			}

			let capt = 'Instagram Highlights'.formatHeaders();

			capt += `\n\nUsername  : ${highlights[data].user.username}\n`;
			capt += `Fullname  : ${highlights[data].user.fullName}\n`;
			capt += `Follower  : ${numberWithCommas(highlights[data].user.followers)}\n`;
			capt += `Following : ${numberWithCommas(highlights[data].user.following)}\n`;
			capt += highlights[data].user.biography === '' ? '' : `Biography : ${highlights[data].user.biography}\n`;
			capt += `Tot. Highlights : ${numberWithCommas(highlights[data].highlights.length)}\n\n`;
			capt += 'Each Sections of the Higlights will be send 2 media.\n';
			capt += `Tot. Sections : ${highlights[data].highlights.length}\n`;
			capt += `Tot. Estimated media per Section : ${numberWithCommas(highlights[data].highlights.length * 2)}\n\n`;

			await client.instance.reply(capt.trim().formatForm(), { from, quoted: message, groupMetadata });

			capt = '';

			if (highlights[data].highlights.length === 1) {
				for (const media of highlights[data].highlights[0].dataHighlight.slice(0, 2)) {
					await client.instance.send(
						from,
						media.type === 'video' ? { video: { url: media.url } } : { image: { url: media.url } },
						{ groupMetadata, quoted: message }
					);
				}
			} else {
				for (const media of highlights[data].highlights) {
					await client.instance.send(
						from,
						media.dataHighlight[0].type === 'video'
							? { video: { url: media.dataHighlight[0].url } }
							: { image: { url: media.dataHighlight[0].url } },
						{ groupMetadata }
					);
					await client.instance.send(
						from,
						media.dataHighlight[1].type === 'video'
							? { video: { url: media.dataHighlight[1].url } }
							: { image: { url: media.dataHighlight[1].url } },
						{ groupMetadata }
					);
				}
			}
		}

		INFOLOG(`${color('Downloaded Instagram highlights', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`);
	}
};
