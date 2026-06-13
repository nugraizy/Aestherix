import parser from 'yargs-parser';

import { getLocale, useLocale, t } from '../../helper/i18n/index.js';
import {
	bilibiliDetailTv,
	color,
	getFilesizeFromBytes,
	loggers,
	mergeVideoWithAudio,
	removeDuplicatesArray
} from '../../utils/index.js';
import { defineCommand } from '../_define.js';

const regex = (input) => {
	input = input.replace(/`/g, '').trim();
	const reg = /^https?:\/\/(www\.)?bilibili\.tv\/[a-zA-Z-]*\/?(?:play|video)?\/?/i;
	const isBili = reg.test(input) || /\d{5,}/.test(input);

	if (isBili) {
		const match = input.match(/\d{5,}/);

		if (!match) {
			return { status: false, message: 'Bstation code not found on your URL. Try another URL or Input a Code.' };
		}

		return { status: true, message: match[0] };
	}

	return { status: false, message: 'This URL is not a valid Bstation URL. Try another URL.' };
};

const processVideo = async (aid, client, { from, message, sender, filename, wait }) => {
	const video = await bilibiliDetailTv({ aid });

	await wait.update(
		` • Converting videos, this might take a while please wait.\n\nResolution : ${
			video.resolution
		}\nSize : ${getFilesizeFromBytes(video.size)}`.formatForm()
	);

	const merge = await mergeVideoWithAudio(
		video.video,
		video.audio,
		`./tmp/${filename}.mp4`,
		sender,
		'https://www.bilibili.tv/'
	);

	await client.send(
		from,
		{ video: Buffer.from(merge, 'base64'), caption: 'Bstation Downloader'.formatHeaders() },
		{ quoted: message }
	);
};

export default defineCommand({
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
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (
			typeQuoted === 'imageMessage' &&
			client.decodeJid(await client.resolveJid(mediaData.participant, 'jid'))?.includes(client.decodeJid(client.user.id))
		) {
			const reg = /✦ Video ID :\s*([^\n]+)/g;

			const videoIds = [];
			let match;

			while ((match = reg.exec(bodyQuoted)) !== null) {
				videoIds.push(match[1].replace(/`/g, '').trim());
			}

			if (!videoIds.length) {
				return await client.reply(from, L.errors.noIdsFound, message);
			}

			const numberiedQuery = Number(query);
			const index = numberiedQuery - 1;

			if (!numberiedQuery) {
				return await client.reply(from, t(locale, 'errors.numberRange', [1, videoIds.length]), message);
			}

			if (index >= videoIds.length) {
				return await client.reply(from, t(locale, 'errors.numberRange', [1, videoIds.length]), message);
			}

			const videoId = videoIds[index];

			if (!videoId) {
				return await client.reply(from, t(locale, 'errors.numberRange', [1, videoIds.length]), message);
			}

			const wait = await client.waitMessage(from, `Downloading Bstation audio :\n${videoId}\nPlease wait`, message);

			await processVideo(videoId, client, { from, message, prettyNumber, wait });

			return;
		}

		if (!query) {
			return await client.reply(from, L.errors.noQuery, message);
		}

		const wait = await client.waitMessage(from, L.success.loading, message);

		let { _: urls } = parser(query);

		urls = removeDuplicatesArray(urls);

		let regexs = urls.length === 1 ? regex(urls[0]) : null;

		if (urls.length === 1 && !regexs?.status) {
			return await wait.update(regexs.message);
		}

		let success = 0;
		let error = 0;

		loggers.warning(`${color('Downloading Bstation File', 'pink')} for ${color(prettyNumber, 'lilac')}`);

		for (const url of urls) {
			const regexs = regex(url.trim());

			if (!regexs.status) {
				await client.reply(from, `${regexs.message}\nInvalid : ${url}`, message);
				error++;
				continue;
			}

			await wait.update(`Downloading Bstation video :\n${regexs.message}\nPlease wait`);

			await processVideo(regexs.message.trim(), client, { from, message, sender, filename, wait });
			success++;
		}

		await wait.update(`Command Finished. With total ${success} success, and ${error} fail.`);

		loggers.info(`${color('Downloaded Bstation File', 'pink')} for ${color(prettyNumber, 'lilac')}`);
	}
});
