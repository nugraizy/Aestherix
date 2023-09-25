import path from 'path';

import { numberWithCommas, removeDuplicatesArray, getFilesizeFromBytes } from '../../utils/modules/index.js';
import { bilibiliSearchEn, bilibiliDetailEn, mergeVideoWithAudio } from '../../utils/index.js';

/**
 * @type {import('../types.js').Plugins}
 */
export default {
	name: 'bilibili',
	description: 'Search videos from Bilibili',
	usage: '!bilibili <query>',
	category: 'Search',
	aliases: ['bili', 'bli'],
	limit: 4,
	cooldown: 7,
	status: 'enable',
	async run({ query, from, message, cmd, sender, filename, args, groupMetadata }, client) {
		if (!query) {
			return await client[botNum].reply({ groupMetadata, from, quoted: message }, 'You must provide a query.');
		}

		if (args[1] === '-dl') {
			const result = JSON.parse(args.slice(2).join(''));

			await client[botNum].reply(
				{ groupMetadata, from, quoted: message },
				` • Converting videos, this might take a while please wait.\n\nResolution : ${
					result.resolution
				}\nSize : ${getFilesizeFromBytes(result.size)}`
			);

			const merge = await mergeVideoWithAudio(
				result.video.videoUrl,
				result.video.audioUrl,
				path.join(__dirname, `src/media/temporary_files/${filename}.mp4`),
				sender,
				result.container.arcurl
			);

			let caption = 'Bilibili Downloader'.formatHeaders();

			caption += `\n\nTitle : ${result.video.title.capitalize()}
Author : ${result.video.author}
Author ID : ${result.video.authorId}
Video ID : ${result.container.aid}
View : ${numberWithCommas(result.video.view)}
Like : ${numberWithCommas(result.video.like)}
Favorite : ${numberWithCommas(result.container.favorites)}
Duration : ${result.container.duration}
Description : ${result.video.description}`;

			await client[botNum].send(
				from,
				{ video: new Buffer.from(merge, 'base64'), caption },
				{ groupMetadata, quoted: message }
			);
			return;
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			const container = await bilibiliSearchEn(querie.trim());
			const video = await bilibiliDetailEn(container[0]);

			await client[botNum].send(
				from,
				{
					image: {
						url: video.thumbnail
					},
					caption: 'Bilibili'.formatHeaders(),
					templateButtons: [
						{ index: 1, urlButton: { displayText: 'Source Bilibili', url: video.originalVideoLink } },
						{ index: 2, urlButton: { displayText: 'Source Image', url: video.thumbnail } },
						{
							index: 3,
							quickReplyButton: {
								displayText: 'Download',
								id: `${cmd} -dl ${JSON.stringify({ container: container[0], video })}`
							}
						}
					],
					footer: '\t'
				},
				{ groupMetadata }
			);

			await client[botNum].send(
				from,
				{
					title: 'Bilibili'.formatHeaders(),
					footer: 'Made by Void Bot. Powered by Hidden Finder',
					text: '\t',
					buttonText: 'Open List',
					sections: container.slice(1).map((v, i) => ({
						rows: [
							{
								title: `${i + 1}.  ${v.title.replace(/<[^>]+>/g, '')}`,
								rowId: `${cmd} -dl ${JSON.stringify(v)}`
							}
						],
						title: `Bilibili | ${v.title.replace(/<[^>]+>/g, '')}`
					}))
				},
				{ groupMetadata }
			);
		}
	}
};
