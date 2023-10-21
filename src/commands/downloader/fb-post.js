import parser from 'yargs-parser';

import { color, ERRLOG, fetchBUFFER, INFOLOG, isURL, delay } from '../../utils/modules/index.js';
import { fbDl } from '../../utils/facebook/index.js';

const regex = (input) => /^(https?:\/\/)?((w{3}\.)|(m\.)?)?(facebook|fb)\.(com|watch)\/.*/.test(input);

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'fbpost',
	description: 'Downloads a Facebook post',
	usage: '!fbpost <url>',
	aliases: ['fbpost', 'fbp', 'fb', 'fbdl'],
	category: 'Downloader',
	cooldown: 8,
	limit: 6,
	status: 'enable',
	async run({ from, query, prettyNumber, message, groupMetadata }, client) {
		if (!query) {
			return await client[botNum].reply('Please provide a URL', { from, quoted: message, groupMetadata });
		}

		const { _: urls } = parser(query);

		if (urls.length === 1 && !isURL(urls[0])) {
			return await client[botNum].reply('Please specify a valid url', { from, quoted: message, groupMetadata });
		}

		if (urls.length === 1 && !regex(urls[0])) {
			return await client[botNum].reply('Please specify a valid Facebook url', { from, quoted: message, groupMetadata });
		}

		for (const url of urls) {
			if (!isURL(url.trim())) {
				await client[botNum].reply('Please specify a valid url', { from, quoted: message, groupMetadata });

				continue;
			} else if (!regex(url.trim())) {
				await client[botNum].reply('Please specify a valid Facebook url', { from, quoted: message, groupMetadata });

				continue;
			}

			const post = await fbDl(url.trim());

			INFOLOG(`${color('Downloading Facebook Post', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`);

			if ('error' in post) {
				await client[botNum].reply(`Failed while downloading Facebook post\n\n${post.error}\n${url}`, {
					from,
					quoted: message,
					groupMetadata
				});
				ERRLOG(`⚠️ ${color('Failed to Download Facebook Post', '#FF5555')} for ${color(prettyNumber, '#ff71ce')}`);

				continue;
			}

			const urlFilter = post.url.find((v) => v.resolution === '1080p' || v.resolution === '720p' || v.resolution === '480p');

			await client[botNum].send(
				from,
				{
					video: new Buffer.from(await fetchBUFFER(urlFilter.url)),
					caption: `${'Facebook Video Downloader'.formatHeaders()}\n\nRes : ${urlFilter.resolution}`
				},
				{ groupMetadata }
			);
			await delay(300);
		}

		INFOLOG(`${color('Downloaded Facebook Post', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`);
	}
};
