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
const processVideo = async (url, client, { from, message, prettyNumber }) => {
	const video = await youtube.video(url);

	const { title, description, download } = video;

	if (!download) {
		client.reply(from, `Error while downloading YouTube Video\n\n${url}`, message);
		loggers.error(`${color('Failed to Download YouTube Video', 'red')} for ${color(prettyNumber, 'lilac')}`);
		return false;
	}

	let capt = '';

	capt += `Title : ${title}\n`;
	capt += `Descriptions : ${description || ''}`;

	await client.send(
		from,
		{
			video: await download(),
			caption: capt.trim().formatForm()
		},
		{
			quoted: message
		}
	);
};

export default defineCommand({
	name: 'ytvideo',
	minifiedDescription: 'Downloads YouTube Video',
	description: 'Downloads a YouTube video',
	usage: '!ytvideo `<url(s)>` (you can send multiple url using space in between)',
	aliases: ['ytv', 'ytmp4'],
	category: 'Downloader',
	cooldown: 12,
	limit: 8,
	status: 'enable',
	async run({ from, query, prettyNumber, message, /*type, args,*/ mediaData, typeQuoted, bodyQuoted }, client) {
		if (typeQuoted === 'conversation' && mediaData.participant?.includes(client.decodeJid(instance))) {
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

			if (!numberiedQuery || index > videoIds.length) {
				return await client.reply(from, `Please specify a number beteen 1 - ${videoIds.length}`, message);
			}

			const videoId = videoIds[index];

			const wait = await client.waitMessage(
				from,
				`Please wait...\nDownloading YouTube audio :\n${videoId}`.formatForm(),
				message
			);

			const status = await processVideo(`https://youtu.be/${videoId}`, client, { from, message, prettyNumber });

			if (!status) {
				error++;
				await wait.update(`Command Finished. With total ${success} success, and ${error} fail.`);
				return;
			}

			await wait.update(`Command Finished. With total ${success} success, and ${error} fail.`);

			loggers.info(`${color('Downloaded YouTube Video', 'pink')} for ${color(prettyNumber, 'lilac')}`);

			return;
		}

		// if (type === 'listResponseMessage' && args[1] === 'download') {
		// 	await client.send(
		// 		from,
		// 		{ video: { url: args[2].replace('https', 'http') } },
		// 		{ quoted: message }
		// 	);
		// 	return;
		// } else if (type === 'templateButtonReplyMessage' && args[1] === 'get') {
		// 	const video = await ytv(args[2], 'mp4');
		// 	const { mp4 } = video;

		// 	await client.send(
		// 		from,
		// 		{
		// 			title: 'YouTube MP4'.formatHeaders(),
		// 			footer: 'Made by Void Bot. Powered by Hidden Finder',
		// 			text: '\t',
		// 			buttonText: 'Open List',
		// 			sections: mp4.map((v, i) => ({
		// 				rows: [{ title: `${i + 1}. ${v.quality} ${v.filesizeF}`, rowId: `.ytmp4 download ${v.dlUrl}` }],
		// 				title: '\t'
		// 			}))
		// 		},
		// 		{  }
		// 	);
		// 	return;
		// }

		if (!query) {
			return await client.reply(from, 'Please provide a URL', message);
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		if (queries.length === 1 && isURL(queries) && !isYoutubeURL(queries)) {
			return await client.reply(from, 'This is not a valid YouTube URL.', message);
		}

		const wait = await client.waitMessage(
			from,
			`Please wait...\nDownloading YouTube video(s) :\n${queries.join('\n')}`.formatForm(),
			message
		);

		let success = 0;
		let error = 0;

		loggers.warning(`${color('Downloading YouTube Video', 'pink')} for ${color(prettyNumber, 'lilac')}`);

		for (const Query of queries) {
			if (isURL(Query) && !isYoutubeURL(Query)) {
				await client.reply(from, `[ ${Query} ] This isn't a valid YouTube URL.`, message);
				loggers.error(`${color('Failed to Download YouTube Video', 'red')} for ${color(prettyNumber, 'lilac')}`);
				error++;
				continue;
			}

			const status = await processVideo(Query, client, { from, message, prettyNumber });

			if (!status) {
				error++;
				continue;
			}

			success++;
		}

		await wait.update(`Command Finished. With total ${success} success, and ${error} fail.`);

		loggers.info(`${color('Downloaded YouTube Video', 'pink')} for ${color(prettyNumber, 'lilac')}`);
	}
});
