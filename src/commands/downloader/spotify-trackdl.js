import dayjs from 'dayjs';
import path from 'path';

import { color, ERRLOG, INFOLOG, isURL, removeDuplicatesArray } from '../../utils/modules/index.js';
import { toOpus } from '../../utils/converter/index.js';
import { youtubeMainDownload as yta, searchYoutube } from '../../utils/youtube/index.js';

const regex = (input) =>
	/(https?:\/\/open.spotify.com\/(track|user|artist|album)\/[a-zA-Z0-9]+(\/playlist\/[a-zA-Z0-9]+|)|spotify:(track|user|artist|album):[a-zA-Z0-9]+(:playlist:[a-zA-Z0-9]+|))/.test(
		input
	);

/**
 * @type {import('../types.js').Plugins}
 */
export default {
	name: 'spotifydl',
	description: 'Downloads a Spotify audio',
	usage: '!spotifydl <url>',
	aliases: ['sfydl'],
	category: 'Downloader',
	cooldown: 9,
	limit: 8,
	status: 'enable',
	async run({ from, query, prettyNumber, filename, message, groupMetadata }, client) {
		const time = dayjs().format('HH:mm:ss DD/MM');

		if (!query) {
			return await client[botNum].reply({ groupMetadata, from, quoted: message }, 'Please provide a URL');
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		if (queries.length === 1 && isURL(queries) && !regex(queries)) {
			return await client[botNum].reply({ groupMetadata, from, quoted: message }, 'This is not a valid Spotify URL.');
		}

		for (const Query of queries) {
			if (isURL(Query) && !regex(Query)) {
				return await client[botNum].reply(
					{ groupMetadata, from, quoted: message },
					`[ ${Query} ] This isn't a valid Spotify URL.`
				);
			}

			const searchTerm = await searchYoutube(Query);
			const audio = await yta(searchTerm[0].url);

			INFOLOG(
				`[${color(time, 'cyan')}]`,
				`${color('Downloading Spotify Audio', '#01cdfe')} for ${color(prettyNumber, '#ff71ce')}`
			);

			if ('error' in audio) {
				await client[botNum].reply({ groupMetadata, from, quoted: message }, audio.error);

				ERRLOG(
					`[${color(time, 'cyan')}]`,
					`⚠️ ${color('Failed to Download Spotify Audio', 'red')} for ${color(prettyNumber, '#ff71ce')}`
				);
			} else {
				const { title, timestamp, dlLink } = audio;

				let capt = 'Spotify Audio'.formatHeaders();

				capt += `\n\nTitle : ${title}\n`;
				capt += `Duration : ${timestamp ?? 'No Data'}\n`;

				await client[botNum].reply({ groupMetadata, from, quoted: message }, capt.trim());
				await client[botNum].send(from, {
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

		INFOLOG(
			`[${color(time, 'cyan')}]`,
			`${color('Downloaded Spotify Audio', '#01cdfe')} for ${color(prettyNumber, '#ff71ce')}`
		);
	}
};
