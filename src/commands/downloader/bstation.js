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

const processVideo = async (url, client, { from, message, groupMetadata, sender, filename }) => {
	const video = await bilibiliDetailTv({ aid: url });

	await client.instance.reply(
		` • Converting videos, this might take a while please wait.\n\nResolution : ${
			video.resolution
		}\nSize : ${getFilesizeFromBytes(video.size)}`,
		{ from, quoted: message }
	);

	const merge = await mergeVideoWithAudio(
		video.video,
		video.audio,
		path.join(__dirname, `src/media/temporary_files/${filename}.mp4`),
		sender
	);

	await client.instance.send(
		from,
		{ video: new Buffer.from(merge, 'base64'), caption: 'Bstation Downloader'.formatHeaders() },
		{ groupMetadata, quoted: message }
	);
};

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'bstationdl',
	minifiedDescription: 'Download Bilbili/Bstation',
	description: 'Download videos from Bilibili/Bstation',
	usage: '!bstationdl <url|code>',
	category: 'Downloader',
	aliases: ['bstatdl', 'bsdl'],
	limit: 4,
	cooldown: 8,
	status: 'enable',
	async run(
		{ query, from, message, filename, sender, groupMetadata, typeQuoted, mediaData, bodyQuoted, prettyNumber },
		client
	) {
		if (typeQuoted === 'imageMessage' && mediaData.participant?.includes(client.instance.decodeJid(instance))) {
			const reg = /✦ Video ID :\s*([^\n]+)/g;

			const videoIds = [];
			let match;

			while ((match = reg.exec(bodyQuoted)) !== null) {
				videoIds.push(match[1]);
			}

			if (!videoIds.length) {
				return await client.instance.reply('No id(s) found', { from, quoted: message, groupMetadata });
			}

			const numberiedQuery = Number(query);
			const index = numberiedQuery - 1;

			if (!numberiedQuery) {
				return await client.instance.reply(`Please specify a number beteen 1 - ${videoIds.length}`, {
					from,
					quoted: message,
					groupMetadata
				});
			}

			if (index > videoIds.length) {
				return await client.instance.reply(`Please specify a number beteen 1 - ${videoIds.length}`, {
					from,
					quoted: message,
					groupMetadata
				});
			}

			const videoId = videoIds[index];

			if (!videoId) {
				return await client.instance.reply(`Please specify a number beteen 1 - ${videoIds.length}`, {
					from,
					quoted: message,
					groupMetadata
				});
			}

			await client.instance.reply(`Downloading Bstation audio :\n${videoId}\nPlease wait`, {
				from,
				quoted: message,
				groupMetadata
			});

			await processVideo(videoId, client, { from, message, groupMetadata, prettyNumber });

			return;
		}

		if (!query) {
			return await client.instance.reply('You must provide a query.', { from, quoted: message, groupMetadata });
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			const regexs = regex(querie.trim());

			if (!regexs.status) {
				return await client.instance.reply(regexs.message, { from, quoted: message, groupMetadata });
			}

			await client.instance.reply(`Downloading Bstation video :\n${regexs.message}\nPlease wait`, {
				from,
				quoted: message,
				groupMetadata
			});

			await processVideo(regexs.message.trim(), client, { from, message, groupMetadata, sender, filename });
		}
	}
};
