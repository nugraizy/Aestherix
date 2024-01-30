import parser from 'yargs-parser';

import { color, ERRLOG, fetchBUFFER, INFOLOG, isURL, delay } from '../../utils/modules/index.js';
import { fbDl } from '../../utils/facebook/index.js';

const regex = (input) => /^(https?:\/\/)?((w{3}\.)|(m\.)?)?(facebook|fb)\.(com|watch)\/.*/.test(input);

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'fbpost',
	minifiedDescription: 'Download Facebook Post',
	description: 'Downloads a Facebook post',
	usage: '!fbpost <url>',
	aliases: ['fbpost', 'fbp', 'fb', 'fbdl'],
	category: 'Downloader',
	cooldown: 8,
	limit: 6,
	status: 'enable',
	async run({ from, query, prettyNumber, message, groupMetadata }, client) {
		if (!query) {
			return await client.instance.reply('Please provide a URL', { from, quoted: message, groupMetadata });
		}

		const { _: urls } = parser(query);

		if (urls.length === 1 && !isURL(urls[0])) {
			return await client.instance.reply('Please specify a valid url', { from, quoted: message, groupMetadata });
		}

		if (urls.length === 1 && !regex(urls[0])) {
			return await client.instance.reply('Please specify a valid Facebook url', { from, quoted: message, groupMetadata });
		}

		for (const url of urls) {
			if (!isURL(url.trim())) {
				await client.instance.reply('Please specify a valid url', { from, quoted: message, groupMetadata });

				continue;
			} else if (!regex(url.trim())) {
				await client.instance.reply('Please specify a valid Facebook url', { from, quoted: message, groupMetadata });

				continue;
			}

			const post = await fbDl(url);

			INFOLOG(`${color('Downloading Facebook Post', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`);

			if ('error' in post) {
				await client.instance.reply(`Failed while downloading Facebook post\n\n${post.error}\n${url}`, {
					from,
					quoted: message,
					groupMetadata
				});
				ERRLOG(`⚠️ ${color('Failed to Download Facebook Post', '#FF5555')} for ${color(prettyNumber, '#ff71ce')}`);

				continue;
			}

			await client.instance.send(
				from,
				{
					video: new Buffer.from(await fetchBUFFER(post.result)),
				},
				{ groupMetadata }
			);
			await delay(300);
		}

		INFOLOG(`${color('Downloaded Facebook Post', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`);
	}
};
