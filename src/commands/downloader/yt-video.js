import { color, delay, loggers, isURL, removeDuplicatesArray, isYoutubeURL, fetchBUFFER } from '../../utils/modules/index.js';
import { youtubeMainDownload } from '../../utils/youtube/index.js';

// const youtube = new YouTubei();

/**
 *
 * @param {string} url
 * @param {import('../../types/Socket/index.js').AdvancedClient} client
 * @param {{from: string, message: import('../../types/Reconstruct/index.js').ReassignResult['message'], : import('../../types/Reconstruct/index.js').ReassignResult[''], prettyNumber: string}} param2
 * @returns
 */
const processVideo = async (url, client, { from, message, prettyNumber }) => {
	const video = await youtubeMainDownload(url, 'mp4');

	loggers.warning(`${color('Downloading YouTube Video', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);

	// if ('error' in video) {
	// 	client.instance.reply(video.error, { from, quoted: message,  });
	// 	loggers.error(`${color('Failed to Download YouTube Video', '#FF5555')} for ${color(prettyNumber, '#E4C1F9')}`);
	// 	return;
	// }

	const { title, link, description, resolution } = video;

	if (!link) {
		client.instance.reply(`Error while downloading YouTube Video\n\n${url}`, { from, quoted: message });
		loggers.error(`${color('Failed to Download YouTube Video', '#FF5555')} for ${color(prettyNumber, '#E4C1F9')}`);

		return;
	}

	let capt = '';

	capt += `Title : ${title}\n`;
	capt += `Resolution : ${resolution}\n`;
	capt += `Descriptions : ${description || ''}`;

	await client.instance.send(
		from,
		{
			video: Buffer.from(await fetchBUFFER(link), 'base64'),
			caption: capt.trim().formatForm()
		},
		{
			quoted: message
		}
	);
};

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
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
		if (typeQuoted === 'conversation' && mediaData.participant?.includes(client.instance.decodeJid(instance))) {
			const reg = /✦ Video ID :\s*`([^\n]+)`/g;

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

			if (!numberiedQuery || index > videoIds.length) {
				return await client.instance.reply(`Please specify a number beteen 1 - ${videoIds.length}`, {
					from,
					quoted: message
				});
			}

			const videoId = videoIds[index];

			const { key } = await client.instance.reply(`Downloading YouTube audio :\n${videoId}\nPlease wait`.formatForm(), {
				from,
				quoted: message
			});

			await processVideo(`https://youtu.be/${videoId}`, client, { from, message, prettyNumber });

			await client.relayMessage(
				from,
				{
					protocolMessage: {
						key,
						type: 14,
						editedMessage: {
							conversation: `Downloaded YouTube video(s) :\n${videoId}`
						}
					}
				},
				{}
			);

			loggers.info(`${color('Downloaded YouTube Video', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);

			return;
		}

		// if (type === 'listResponseMessage' && args[1] === 'download') {
		// 	await client.instance.send(
		// 		from,
		// 		{ video: { url: args[2].replace('https', 'http') } },
		// 		{ quoted: message }
		// 	);
		// 	return;
		// } else if (type === 'templateButtonReplyMessage' && args[1] === 'get') {
		// 	const video = await ytv(args[2], 'mp4');
		// 	const { mp4 } = video;

		// 	await client.instance.send(
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
			return await client.instance.reply('Please provide a URL', { from, quoted: message });
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		if (queries.length === 1 && isURL(queries) && !isYoutubeURL(queries)) {
			return await client.instance.reply('This is not a valid YouTube URL.', { from, quoted: message });
		}

		const { key } = await client.instance.reply(
			`Downloading YouTube video(s) :\n${queries.join('\n')}\nPlease wait`.formatForm(),
			{
				from,
				quoted: message
			}
		);

		for (const Query of queries) {
			if (isURL(Query) && !isYoutubeURL(Query)) {
				return await client.instance.reply(`[ ${Query} ] This isn't a valid YouTube URL.`, {
					from,
					quoted: message
				});
			}

			await processVideo(Query, client, { from, message, prettyNumber });
			await delay(300);
		}

		await client.instance.relayMessage(
			from,
			{
				protocolMessage: {
					key,
					type: 14,
					editedMessage: {
						conversation: `Downloaded YouTube video(s) :\n${queries.join('\n')}`.formatForm()
					}
				}
			},
			{}
		);

		loggers.info(`${color('Downloaded YouTube Video', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);
	}
};
