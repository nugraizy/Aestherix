/* global botNum */
import path from 'path';

import { __dirname } from '../../index.js';
import { removeDuplicatesArray, isURL } from '../../helper/modules/index.js';
import { downloadBandcamp, toOpus } from '../../utils/index.js';

export default {
	name: 'bandcampdl',
	description: 'Download Musics from Bandcamp',
	usage: '!bandcampdl <url>',
	category: 'Downloader',
	aliases: ['bcampdl', 'bandcdl'],
	limit: 4,
	cooldown: 8,
	status: 'enable',
	async run({ query, from, message, filename }, client) {
		if (!query) {
			return await client[botNum].reply({ from, quoted: message }, 'You must provide a query.');
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			const regexs = isURL(querie.trim());

			if (!regexs) {
				await client[botNum].reply({ from, quoted: message }, 'Please Use a Valid URL.');

				continue;
			}

			const result = await downloadBandcamp(querie);

			if ('error' in result) {
				await client[botNum].reply({ from, quoted: message }, result.error);

				continue;
			}

			await client[botNum].sendMessage(
				from,
				{
					document: await toOpus('opus', {
						input: path.join(__dirname, `temporary_files/${filename}`),
						output: path.join(__dirname, `temporary_files/${filename}-done`),
						media: result.mp3.replace('https', 'http'),
					}),
					fileName: `${result.title}.opus`,
					mimetype: 'audio/opus',
					caption: `\`\`\` • Bandcamp \`\`\`
Title : ${result.title}`,
				},
				{ quoted: message },
			);
		}
	},
};
