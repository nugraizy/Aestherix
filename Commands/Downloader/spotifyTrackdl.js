/* global botNum */
import moment from 'moment-timezone';
import path from 'path';

import { __dirname } from '../../connect.js';
import { color, ERRLOG, INFOLOG, isURL, removeDuplicatesArray } from '../../Helper/Modules/index.js';
import { toOpus } from '../../Utils/Converter/index.js';
import { yta2 as yta, ytsr } from '../../Utils/YouTube/index.js';

const regex = (input) =>
	/(https?:\/\/open.spotify.com\/(track|user|artist|album)\/[a-zA-Z0-9]+(\/playlist\/[a-zA-Z0-9]+|)|spotify:(track|user|artist|album):[a-zA-Z0-9]+(:playlist:[a-zA-Z0-9]+|))/.test(
		input,
	);

export default {
	name: 'spotifydl',
	description: 'Downloads a Spotify audio',
	usage: '!spotifydl <url>',
	aliases: ['sfydl'],
	category: 'Downloader',
	cooldown: 9,
	limit: 8,
	status: 'enable',
	async run({ from, query, prettyNumber, filename, message }, client) {
		const time = moment().format('HH:mm:ss DD/MM');

		if (!query) {
			return await client[botNum].reply({ from, quoted: message }, 'Please provide a URL');
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		if (queries.length == 1 && isURL(queries) && !regex(queries)) {
			return await client[botNum].reply({ from, quoted: message }, 'This is not a valid Spotify URL.');
		}

		for (const Query of queries) {
			if (isURL(Query) && !regex(Query)) {
				return await client[botNum].reply({ from, quoted: message }, `[ ${Query} ] This isn't a valid Spotify URL.`);
			}

			const searchTerm = await ytsr(Query);
			const audio = await yta(searchTerm[0].url);

			INFOLOG(`[${color(time, 'cyan')}]`, `${color('Downloading Spotify Audio', '#01cdfe')} for ${color(prettyNumber, '#ff71ce')}`);

			if ('error' in audio) {
				await client[botNum].reply({ from, quoted: message }, audio.error);

				ERRLOG(`[${color(time, 'cyan')}]`, `${color('Failed to Download Spotify Audio', 'red')} for ${color(prettyNumber, '#ff71ce')}`);
			} else {
				const { title, timestamp, dlLink } = audio;

				let capt = '``` • Spotify Audio```\n\n';

				capt += `Title : ${title}\n`;
				capt += `Duration : ${timestamp ?? 'No Data'}\n`;

				await client[botNum].reply({ from, quoted: message }, capt.trim());
				await client[botNum].sendMessage(from, {
					document: await toOpus('opus', {
						input: path.join(__dirname, `Temporary Files/${filename}`),
						output: path.join(__dirname, `Temporary Files/${filename}-done`),
						media: dlLink.replace('https', 'http'),
					}),
					fileName: `${title}.opus`,
					mimetype: 'audio/opus',
					caption: capt.trim(),
				});
			}
		}

		INFOLOG(`[${color(time, 'cyan')}]`, `${color('Downloaded Spotify Audio', '#01cdfe')} for ${color(prettyNumber, '#ff71ce')}`);
	},
};
