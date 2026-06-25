import parser from 'yargs-parser';

import { getLocale, useLocale, t } from '../../helper/i18n/index.js';
import { color, isURL, isYoutubeURL, loggers, removeDuplicatesArray } from '../../utils/modules/index.js';
import { youtube } from '../../utils/youtube/index.js';
import { defineCommand } from '../_define.js';

const parseFlags = (query) => {
	const { _, quality, itag, list } = parser(query || '', {
		configuration: { 'short-option-groups': false },
		alias: { quality: ['q', 'res', 'resolution'], itag: ['t'], list: ['l', 'formats'] }
	});

	return { query: _.join(' '), options: { quality, itag }, list: Boolean(list) };
};

const replyFormats = async (client, from, message, query) => {
	const info = await youtube.listFormats(query.split(',')[0]);
	const lines = info.formats
		.map((f) => `${f.itag} | ${f.quality || '-'} | ${f.type}${f.hasAudio ? ' +audio' : ''}`)
		.join('\n');

	return client.reply(from, `${info.title}\n\n${lines}`.formatForm(), message);
};

/**
 *
 * @param {string} url
 * @param {import('../../types/Socket/index.js').AdvancedClient} client
 * @param {{from: string, message: import('../../types/Reconstruct/index.js').ReassignResult['message'], : import('../../types/Reconstruct/index.js').ReassignResult[''], prettyNumber: string}} param2
 * @param {{quality?: string|number, itag?: number}} options
 * @returns
 */
const processAudio = async (url, client, { from, message, prettyNumber }, options = {}) => {
	const audio = await youtube.audio(url, options);

	const { title, description, download, format } = audio;

	if (!download) {
		client.reply(from, `Error while downloading YouTube Audio\n\n${url}`, message);
		loggers.error(`${color('Failed to Download YouTube Audio', 'red')} for ${color(prettyNumber, 'lilac')}`);
		return false;
	}

	const buffer = await download();
	const extension = format.mimeType.includes('webm') ? 'opus' : 'm4a';

	let capt = '';

	capt += `Title : ${title}\n`;
	capt += `Descriptions : ${description || ''}`;

	await client.send(
		from,
		{
			document: Buffer.from(buffer),
			fileName: `${title}.${extension}`,
			mimetype: format.mimeType.split(';')[0] || 'audio/mp4',
			caption: capt.formatForm()
		},
		{
			quoted: message
		}
	);
};

export default defineCommand({
	name: 'ytaudio',
	minifiedDescription: 'Downloads YouTube Audio',
	description: 'Downloads a YouTube audio',
	usage: '!ytaudio `<url(s)/query>`\n\nFlags:\n-q, --quality `<best|worst>`\n--itag `<itag>`\n--list (show available formats)',
	aliases: ['yta', 'ytmp3'],
	category: 'Downloader',
	cooldown: 7,
	limit: 8,
	status: 'enable',
	async run({ from, query, prettyNumber, message, /*type, args,*/ mediaData, bodyQuoted, typeQuoted }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		const { query: cleanQuery, options, list } = parseFlags(query);

		query = cleanQuery;

		if (
			typeQuoted === 'conversation' &&
			client.decodeJid(await client.resolveJid(mediaData.participant, 'jid'))?.includes(client.decodeJid(client.user.id))
		) {
			const reg = /✦ Video ID :\s*`([^\n]+)`/g;

			const videoIds = [];
			let match;
			let success = 0;
			let error = 0;

			while ((match = reg.exec(bodyQuoted)) !== null) {
				videoIds.push(match[1]);
			}

			if (!videoIds.length) {
				return await client.reply(from, L.errors.noIdsFound, message);
			}

			const numberiedQuery = Number(query);
			const index = numberiedQuery - 1;

			if (!numberiedQuery) {
				return await client.reply(from, t(locale, 'common.errors.numberRange', [1, videoIds.length]), message);
			}

			if (index >= videoIds.length) {
				return await client.reply(from, t(locale, 'common.errors.numberRange', [1, videoIds.length]), message);
			}

			const videoId = videoIds[index];

			if (!videoId) {
				return await client.reply(from, t(locale, 'common.errors.numberRange', [1, videoIds.length]), message);
			}

			const wait = await client.waitMessage(
				from,
				`${L.success.loading}\nDownloading YouTube audio :\n${videoId}`.formatForm(),
				message
			);

			const status = await processAudio(`https://youtu.be/${videoId}`, client, { from, message, prettyNumber }, options);

			if (!status) {
				error++;
				await wait.update(`Command Finished. With total ${success} success, and ${error} fail.`);
				return;
			}

			await wait.update(`Command Finished. With total ${success} success, and ${error} fail.`);

			loggers.info(`${color('Downloaded YouTube Audio', 'pink')} for ${color(prettyNumber, 'lilac')}`);

			return;
		}

		if (!query) {
			return await client.reply(from, L.errors.noUrl, message);
		}

		if (list) {
			return await replyFormats(client, from, message, query);
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		if (queries.length === 1 && isURL(queries[0]) && !isYoutubeURL(queries[0])) {
			return await client.reply(from, L.errors.invalidYoutubeUrl, message);
		}

		const wait = await client.waitMessage(
			from,
			`${L.success.loading}\nDownloading YouTube audio(s) :\n${queries.join('\n')}`,
			message
		);

		let success = 0;
		let error = 0;

		loggers.warning(`${color('Downloading YouTube Audio', 'pink')} for ${color(prettyNumber, 'lilac')}`);

		for (const Query of queries) {
			if (isURL(Query) && !isYoutubeURL(Query)) {
				await client.reply(from, `${Query} ${L.errors.invalidYoutubeUrl}`, message);
				loggers.error(`${color('Failed to Download YouTube Audio', 'red')} for ${color(prettyNumber, 'lilac')}`);
				error++;
				continue;
			}

			const status = await processAudio(Query, client, { from, message, prettyNumber }, options);

			if (!status) {
				error++;
				continue;
			}

			success++;
		}

		await wait.update(`Command Finished. With total ${success} success, and ${error} fail.`);

		loggers.info(`${color('Downloaded YouTube Audio', 'pink')} for ${color(prettyNumber, 'lilac')}`);
	}
});
