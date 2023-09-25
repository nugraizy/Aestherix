import path from 'path';

import { bilibiliDetailTv, mergeVideoWithAudio, getFilesizeFromBytes, removeDuplicatesArray } from '../../utils/index.js';

const regex = (input) => {
	const reg = /^https?:\/\/(www\.)?bilibili\.tv\/[a-bA-Z-?]*\/play?\/\d$/gi;
	const isBili = reg.test(input) || /\d{5,10}/g.test(input);

	if (isBili) {
		const match = input.match(/\d{5,10}/g);

		if (!match) {
			return { status: false, message: 'Bstation code not found on your URL. Try another URL or Input a Code.' };
		}

		return { status: true, message: match[0] };
	}

	return { status: false, message: 'This URL is not a valid Bstation URL. Try another URL.' };
};

/**
 * @type {import('../types.js').Plugins}
 */
export default {
	name: 'bstationdl',
	description: 'Download videos from Bilibili/Bstation',
	usage: '!bstationdl <url|code>',
	category: 'Downloader',
	aliases: ['bstatdl', 'bsdl'],
	limit: 4,
	cooldown: 8,
	status: 'enable',
	async run({ query, from, message, filename, sender, grouppMetadata }, client) {
		if (!query) {
			return await client[botNum].reply({ grouppMetadata, from, quoted: message }, 'You must provide a query.');
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			const regexs = regex(querie.trim());

			if (!regexs.status) {
				return await client[botNum].reply({ grouppMetadata, from, quoted: message }, regexs.message);
			}

			const result = await bilibiliDetailTv({ aid: regexs.message.trim() });

			await client[botNum].reply(
				{ from, quoted: message },
				` • Converting videos, this might take a while please wait.\n\nResolution : ${
					result.resolution
				}\nSize : ${getFilesizeFromBytes(result.size)}`
			);

			const merge = await mergeVideoWithAudio(
				result.video,
				result.audio,
				path.join(__dirname, `src/media/temporary_files/${filename}.mp4`),
				sender
			);

			await client[botNum].send(
				from,
				{ video: new Buffer.from(merge, 'base64'), caption: 'Bstation Downloader'.formatHeaders() },
				{ grouppMetadata, quoted: message }
			);
		}
	}
};
