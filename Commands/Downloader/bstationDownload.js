/* global botNum, Buffer */
import path from 'path';

import { __dirname } from '../../index.js';
import { getFilesizeFromBytes, removeDuplicatesArray } from '../../Helper/Modules/index.js';
import { detailSourceFormat } from '../../Utils/Bilibili/index.js';
import { mergeVideoWithAudio } from '../../Utils/Converter/index.js';

const regex = (input) => {
	const reg = /^https?:\/\/(www\.)?bilibili\.tv\/[a-bA-Z-?]*\/play?\/\d$/gi;
	const isBili = reg.test(input) || /\d{5,10}/g.test(input);

	if (isBili) {
		const match = input.match(/\d{5,10}/g) || input.match(/\d{5,10}/g);

		if (!match) {
			return { status: false, message: 'Bstation code not found on your URL. Try another URL or Input a Code.' };
		}

		return { status: true, message: match[0] };
	}

	return { status: false, message: 'This URL is not a valid Bstation Art URL. Try another URL.' };
};

export default {
	name: 'bstationdl',
	description: 'Download videos from Bilibili/Bstation',
	usage: '!bstationdl <url|code>',
	category: 'Downloader',
	aliases: ['bstatdl', 'bsdl'],
	limit: 4,
	cooldown: 8,
	status: 'enable',
	async run({ query, from, message, filename, sender }, client) {
		if (!query) {
			return await client[botNum].reply({ from, quoted: message }, 'You must provide a query.');
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			const regexs = regex(querie.trim());

			if (!regexs.status) {
				return await client[botNum].reply({ from, quoted: message }, regexs.message);
			}

			const result = await detailSourceFormat(regexs.message.trim());

			if ('error' in result) {
				await client[botNum].reply({ from, quoted: message }, `${result.error}\n${result.cusMessage}`);

				continue;
			}

			await client[botNum].reply(
				{ from, quoted: message },
				` • Converting videos, this might take a while please wait.\n\nResolution : ${result.resolution}\nSize : ${getFilesizeFromBytes(result.size)}`,
			);

			const merge = await mergeVideoWithAudio(result.video, result.audio, path.join(__dirname, `Temporary Files/${filename}.mp4`), sender);

			await client[botNum].sendMessage(from, { video: new Buffer.from(merge, 'base64'), caption: '``` • Bstation Downloader ```' }, { quoted: message });
		}
	},
};
