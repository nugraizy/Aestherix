import path from 'path';
import parser from 'yargs-parser';

import {
	bilibiliDetailTv,
	mergeVideoWithAudio,
	getFilesizeFromBytes,
	removeDuplicatesArray,
	loggers,
	color
} from '../../utils/index.js';

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

const processVideo = async (url, client, { from, message, sender, filename }) => {
	const video = await bilibiliDetailTv({ aid: url });

	await client.instance.reply(
		` • Converting videos, this might take a while please wait.\n\nResolution : ${
			video.resolution
		}\nSize : ${getFilesizeFromBytes(video.size)}`.formatForm(),
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
		{ quoted: message }
	);
};

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'bstationdl',
	minifiedDescription: 'Download Bilbili/Bstation',
	description: 'Download videos from Bilibili/Bstation',
	usage: '!bstationdl `<url(s)/code>` (you can send multiple link/code using space in between)',
	category: 'Downloader',
	aliases: ['bstatdl', 'bsdl'],
	limit: 4,
	cooldown: 8,
	status: 'enable',
	async run({ query, from, message, filename, sender, typeQuoted, mediaData, bodyQuoted, prettyNumber }, client) {
		if (typeQuoted === 'imageMessage' && mediaData.participant?.includes(client.instance.decodeJid(instance))) {
			const reg = /✦ Video ID :\s*([^\n]+)/g;

			const videoIds = [];
			let match;

			while ((match = reg.exec(bodyQuoted)) !== null) {
				videoIds.push(match[1]);
			}

			if (!videoIds.length) {
				return await client.instance.reply('No id(s) found', { from, quoted: message });
			}

			const numberiedQuery = Number(query);
			const index = numberiedQuery - 1;

			if (!numberiedQuery) {
				return await client.instance.reply(`Please specify a number beteen 1 - ${videoIds.length}`, {
					from,
					quoted: message
				});
			}

			if (index > videoIds.length) {
				return await client.instance.reply(`Please specify a number beteen 1 - ${videoIds.length}`, {
					from,
					quoted: message
				});
			}

			const videoId = videoIds[index];

			if (!videoId) {
				return await client.instance.reply(`Please specify a number beteen 1 - ${videoIds.length}`, {
					from,
					quoted: message
				});
			}

			await client.instance.reply(`Downloading Bstation audio :\n${videoId}\nPlease wait`, {
				from,
				quoted: message
			});

			await processVideo(videoId, client, { from, message, prettyNumber });

			return;
		}

		if (!query) {
			return await client.instance.reply('You must provide a query.', { from, quoted: message });
		}

		await client.instance.reply('Please wait...', { from, quoted: message });

		let { _: urls } = parser(query);

		urls = removeDuplicatesArray(urls);

		let regexs = urls.length === 1 ? regex(urls[0]) : null;

		if (urls.length === 1 && !regexs?.status) {
			return await client.instance.reply(regexs.message, { from, quoted: message });
		}

		loggers.warning(`${color('Downloading Bstation File', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);

		for (const url of urls) {
			const regexs = regex(url.trim());

			if (!regexs.status) {
				await client.instance.reply(regexs.message + `\nInvalid : ${url}`, { from, quoted: message });
				continue;
			}

			await client.instance.reply(`Downloading Bstation video :\n${regexs.message}\nPlease wait`, {
				from,
				quoted: message
			});

			await processVideo(regexs.message.trim(), client, { from, message, sender, filename });
		}

		loggers.info(`${color('Downloaded Bstation File', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);
	}
};
