import path from 'path';

import { removeDuplicatesArray, isURL, toOpus, downloadBandcamp } from '../../utils/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'bandcampdl',
	description: 'Download Musics from Bandcamp',
	usage: '!bandcampdl <url>',
	category: 'Downloader',
	aliases: ['bcampdl', 'bandcdl'],
	limit: 4,
	cooldown: 8,
	status: 'enable',
	async run({ query, from, message, filename, groupMetadata }, client) {
		if (!query) {
			return await client[botNum].reply('You must provide a query.', { from, quoted: message, groupMetadata });
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			const regexs = isURL(querie.trim());

			if (!regexs) {
				await client[botNum].reply('Please Use a Valid URL.', { from, quoted: message, groupMetadata });

				continue;
			}

			const result = await downloadBandcamp(querie);

			if ('error' in result) {
				await client[botNum].reply(result.error);

				continue;
			}

			await client[botNum].send(
				from,
				{
					document: await toOpus('opus', {
						input: path.join(__dirname, `src/media/temporary_files/${filename}`),
						output: path.join(__dirname, `src/media/temporary_files/${filename}-done`),
						media: result.mp3.replace('https', 'http')
					}),
					fileName: `${result.title}.opus`,
					mimetype: 'audio/opus',
					caption: `${'Bandcamp'.formatHeaders()}
Title : ${result.title}`
				},
				{ groupMetadata, quoted: message }
			);
		}
	}
};
