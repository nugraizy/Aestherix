import path from 'path';

import { color, ERRLOG, INFOLOG, isURL, removeDuplicatesArray } from '../../utils/modules/index.js';
import { toOpus } from '../../utils/converter/index.js';
import { youtubeMainDownload as yta, searchYoutube } from '../../utils/youtube/index.js';

const regex = (input) =>
	/(https?:\/\/open.spotify.com\/(track|user|artist|album)\/[a-zA-Z0-9]+(\/playlist\/[a-zA-Z0-9]+|)|spotify:(track|user|artist|album):[a-zA-Z0-9]+(:playlist:[a-zA-Z0-9]+|))/.test(
		input
	);

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'spotifydl',
	minifiedDescription: 'Download Spotify Audio',
	description: 'Downloads a Spotify audio',
	usage: '!spotifydl <url>',
	aliases: ['sfydl'],
	category: 'Downloader',
	cooldown: 9,
	limit: 8,
	status: 'enable',
	async run({ from, query, prettyNumber, filename, message, groupMetadata }, client) {
		if (!query) {
			return await client.instance.reply('Please provide a URL', { from, quoted: message, groupMetadata });
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		if (queries.length === 1 && isURL(queries) && !regex(queries)) {
			return await client.instance.reply('This is not a valid Spotify URL.', { from, quoted: message, groupMetadata });
		}

		for (const Query of queries) {
			if (isURL(Query) && !regex(Query)) {
				return await client.instance.reply(`[ ${Query} ] This isn't a valid Spotify URL.`, {
					from,
					quoted: message,
					groupMetadata
				});
			}

			const searchTerm = await searchYoutube(Query);
			const audio = await yta(searchTerm[0].url);

			INFOLOG(`${color('Downloading Spotify Audio', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`);

			if ('error' in audio) {
				await client.instance.reply(audio.error, { from, quoted: message, groupMetadata });

				ERRLOG(`⚠️ ${color('Failed to Download Spotify Audio', '#FF5555')} for ${color(prettyNumber, '#ff71ce')}`);
			} else {
				const { title, timestamp, dlLink } = audio;

				let capt = 'Spotify Audio'.formatHeaders();

				capt += `\n\nTitle : ${title}\n`;
				capt += `Duration : ${timestamp ?? 'No Data'}\n`;

				await client.instance.reply(capt.trim(), { from, quoted: message, groupMetadata });
				await client.instance.send(from, {
					document: await toOpus('opus', {
						input: path.join(__dirname, `src/media/temporary_files/${filename}`),
						output: path.join(__dirname, `src/media/temporary_files/${filename}-done`),
						media: dlLink.replace('https', 'http')
					}),
					fileName: `${title}.opus`,
					mimetype: 'audio/opus',
					caption: capt.trim()
				});
			}
		}

		INFOLOG(`${color('Downloaded Spotify Audio', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`);
	}
};
