import parser from 'yargs-parser';

import configuration from '../../helper/config/connect.js';
import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
import { color, formatNumber, isURL, loggers } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'ighighlights',
	minifiedDescription: 'Download Instagram Highlights',
	description: 'Downloads the highlights of the user',
	usage: '!ighighlights `<username(s)>` (you can send multiple username using space in between)',
	aliases: ['igh', 'ighl'],
	category: 'Downloader',
	cooldown: 13,
	limit: 9,
	status: 'enable',
	async run({ from, query, prettyNumber, message, sender, isOwner, prefix }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const DL = useLocale(locale, 'downloader');

		if (!configuration.isInstagramInitiated) {
			return await client.reply(
				from,
				`Instagram session is not initialized. ${isOwner ? `Type ${prefix}instagraminit to initialize it.` : `Please ask the owner to initialize it first using the command ${prefix}instagraminit`}`,
				message
			);
		}

		if (!query) {
			return await client.reply(from, L.errors.usernameRequired, message);
		}

		const wait = await client.waitMessage(from, L.success.loading, message);

		const { _: input } = parser(query);

		const highlights = await configuration.instagram.search.highlight(input);

		let success = 0;
		let error = 0;

		loggers.warning(`${color('Downloading Instagram highlights', 'pink')} for ${color(prettyNumber, 'lilac')}`);

		for (const data in highlights) {
			if (highlights[data]?.error) {
				await client.reply(from, `Error while downloading Instagram highlights\n\n${highlights.error}\n${data}`, message);
				loggers.error(`${color('Failed to Download Instagram highlights', 'red')} for ${color(prettyNumber, 'lilac')}`);
				error++;
				continue;
			}

			console.log(highlights[data]);

		let capt = DL.titles.igHighlights.formatHeaders();

		capt += `\n\n${L.core.caption.username} : ${highlights[data].user.username}\n`;
		capt += `${L.core.caption.fullname} : ${highlights[data].user.fullName}\n`;
		capt += `${DL.labels.totalHighlights} : ${formatNumber(highlights[data].highlights.length)}\n`;

			if (!isURL(input)) {
				capt += DL.labels.highlightsNote;
				capt += `${DL.labels.totalSections} : ${highlights[data].highlights.length}\n`;
				capt += `${DL.labels.totalEstimatedMedia} : ${formatNumber(
					highlights[data].highlights.length >= 2 ? 2 : highlights[data].highlights.length
				)}\n\n`;
			}

			await client.reply(from, capt.trim().formatForm(), message);

			capt = '';

			if (highlights[data].highlights.length === 1) {
				const highlight = highlights[data].highlights[0].dataHighlight.slice(0, 2);

				for (const media of highlight) {
					await client.send(from, { [media.type === 'video' ? 'video' : 'image']: { url: media.url } }, { quoted: message });
				}
			} else {
				for (const media of highlights[data].highlights) {
					const caption = media.title;
					const dataHighlight =
						media.dataHighlight.length >= 2 ? [media.dataHighlight[0], media.dataHighlight[1]] : [media.dataHighlight[0]];
					let status = true;

					for (const highlight of dataHighlight) {
						await client.send(
							from,
							{
								[highlight.type === 'video' ? 'video' : 'image']: { url: highlight.url },
								...(status && { caption })
							},
							{}
						);
						status = false;
					}
				}
			}

			success++;
		}

		await wait.update(t(locale, 'common.core.commands.downloadBatchFinished', [success, error]));

		loggers.info(`${color('Downloaded Instagram highlights', 'pink')} for ${color(prettyNumber, 'lilac')}`);
	}
});
