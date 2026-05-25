import { color, isURL, isYoutubeURL, loggers, removeDuplicatesArray } from '../../utils/modules/index.js';
import { youtube } from '../../utils/youtube/index.js';
import { defineCommand } from '../_define.js';

// const youtube = new YouTubei();

/**
 *
 * @param {string} url
 * @param {import('../../types/Socket/index.js').AdvancedClient} client
 * @param {{from: string, message: import('../../types/Reconstruct/index.js').ReassignResult['message'], : import('../../types/Reconstruct/index.js').ReassignResult[''], prettyNumber: string}} param2
 * @returns
 */
const processAudio = async (url, client, { from, message, prettyNumber }) => {
	const audio = await youtube.audio(url);

	const { title, description, download } = audio;

	if (!download) {
		client.reply(from, `Error while downloading YouTube Audio\n\n${url}`, message);
		loggers.error(`${color('Failed to Download YouTube Audio', 'red')} for ${color(prettyNumber, 'lilac')}`);
		return false;
	}

	const buffer = await download();

	let capt = '';

	capt += `Title : ${title}\n`;
	capt += `Descriptions : ${description || ''}`;

	await client.send(
		from,
		{
			document: Buffer.from(buffer),
			fileName: `${title}.mp3`,
			mimetype: 'audio/mp3',
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
	usage: '!ytaudio `<url(s)>` (you can send multiple url using space in between)',
	aliases: ['yta', 'ytmp3'],
	category: 'Downloader',
	cooldown: 7,
	limit: 8,
	status: 'enable',
	async run({ from, query, prettyNumber, message, /*type, args,*/ mediaData, bodyQuoted, typeQuoted }, client) {
		if (typeQuoted === 'conversation' && mediaData.participant?.includes(client.decodeJid(client.user.id))) {
			const reg = /✦ Video ID :\s*`([^\n]+)`/g;

			const videoIds = [];
			let match;
			let success = 0;
			let error = 0;

			while ((match = reg.exec(bodyQuoted)) !== null) {
				videoIds.push(match[1]);
			}

			if (!videoIds.length) {
				return await client.reply(from, 'No id(s) found', message);
			}

			const numberiedQuery = Number(query);
			const index = numberiedQuery - 1;

			if (!numberiedQuery) {
				return await client.reply(from, `Please specify a number beteen 1 - ${videoIds.length}`, message);
			}

			if (index > videoIds.length) {
				return await client.reply(from, `Please specify a number beteen 1 - ${videoIds.length}`, message);
			}

			const videoId = videoIds[index];

			if (!videoId) {
				return await client.reply(from, `Please specify a number beteen 1 - ${videoIds.length}`, message);
			}

			const wait = await client.waitMessage(
				from,
				`Please wait...\nDownloading YouTube audio :\n${videoId}`.formatForm(),
				message
			);

			const status = await processAudio(`https://youtu.be/${videoId}`, client, { from, message, prettyNumber });

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
			return await client.reply(from, 'Please provide a URL or Query.', message);
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		if (queries.length === 1 && isURL(queries) && !isYoutubeURL(queries)) {
			return await client.reply(from, 'This is not a valid YouTube URL.', message);
		}

		const wait = await client.waitMessage(
			from,
			`Please wait...\nDownloading YouTube audio(s) :\n${queries.join('\n')}`,
			message
		);

		let success = 0;
		let error = 0;

		loggers.warning(`${color('Downloading YouTube Audio', 'pink')} for ${color(prettyNumber, 'lilac')}`);

		for (const Query of queries) {
			if (isURL(Query) && !isYoutubeURL(Query)) {
				await client.reply(from, `[ ${Query} ] This isn't a valid YouTube URL.`, message);
				loggers.error(`${color('Failed to Download YouTube Audio', 'red')} for ${color(prettyNumber, 'lilac')}`);
				error++;
				continue;
			}

			const status = await processAudio(Query, client, { from, message, prettyNumber });

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
