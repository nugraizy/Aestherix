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
const processAudio = async (url, client, { from, message, prettyNumber }) => {
	const audio = await youtubeMainDownload(url, 'mp3');

	loggers.warning(`${color('Downloading YouTube Audio', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);

	// if ('error' in audio) {
	// 	client.instance.reply(audio.error, { from, quoted: message,  });
	// 	loggers.error(`${color('Failed to Download YouTube Audio', '#FF5555')} for ${color(prettyNumber, '#E4C1F9')}`);
	// }

	const { title, link, description, resolution } = audio;

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
			document: Buffer.from(await fetchBUFFER(link), 'base64'),
			fileName: `${title}.mp3`,
			mimetype: 'audio/mp3',
			caption: capt.formatForm()
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

			const { key } = await client.instance.reply(`Downloading YouTube audio :\n${videoId}\nPlease wait`.formatForm(), {
				from,
				quoted: message
			});

			await processAudio(`https://youtu.be/${videoId}`, client, { from, message, prettyNumber });

			await client.instance.relayMessage(
				from,
				{
					protocolMessage: {
						key,
						type: 14,
						editedMessage: {
							conversation: `Downloaded YouTube audio(s) :\n${videoId}`
						}
					}
				},
				{}
			);

			loggers.info(`${color('Downloaded YouTube Audio', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);

			return;
		}

		// if (type === 'listResponseMessage' && args[1] === 'download') {
		// 	await client.instance.send(
		// 		from,
		// 		{
		// 			document: { url: args[2] },
		// 			fileName: `${args.slice(3).join(' ')}.opus`,
		// 			mimetype: 'audio/opus',
		// 			caption: ''
		// 		},
		// 		{ quoted: message }
		// 	);
		// 	return;
		// } else if (type === 'templateButtonReplyMessage' && args[1] === 'get') {
		// 	const video = await yta(args[2], 'mp4');
		// 	const { title, mp4 } = video;

		// 	await client.instance.send(from, {
		// 		title: 'YouTube MP3'.formatHeaders(),
		// 		footer: 'Made by Void Bot. Powered by Hidden Finder',
		// 		text: '\t',
		// 		buttonText: 'Open List',
		// 		sections: mp4.map((v, i) => ({
		// 			rows: [{ title: `${i + 1}. ${v.quality} ${v.filesizeF}`, rowId: `.ytmp4 download ${v.dlUrl} ${title}` }],
		// 			title: '\t'
		// 		}))
		// 	});
		// 	return;
		// }

		if (!query) {
			return await client.instance.reply('Please provide a URL or Query.', { from, quoted: message });
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		if (queries.length === 1 && isURL(queries) && !isYoutubeURL(queries)) {
			return await client.instance.reply('This is not a valid YouTube URL.', { from, quoted: message });
		}

		const { key } = await client.instance.reply(`Downloading YouTube audio(s) :\n${queries.join('\n')}\nPlease wait`, {
			from,
			quoted: message
		});

		for (const Query of queries) {
			if (isURL(Query) && !isYoutubeURL(Query)) {
				return await client.instance.reply(`[ ${Query} ] This isn't a valid YouTube URL.`, {
					from,
					quoted: message
				});
			}

			await processAudio(Query, client, { from, message, prettyNumber });
			await delay(300);
		}

		await client.instance.relayMessage(
			from,
			{
				protocolMessage: {
					key: key,
					type: 14,
					editedMessage: {
						conversation: `Downloaded YouTube audio(s) :\n${queries.join('\n')}`
					}
				}
			},
			{}
		);

		loggers.info(`${color('Downloaded YouTube Audio', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);
	}
};
