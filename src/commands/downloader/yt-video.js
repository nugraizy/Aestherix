import { color, delay, ERRLOG, INFOLOG, isURL, removeDuplicatesArray, isYoutubeURL } from '../../utils/modules/index.js';
import youtube from '../../utils/youtube/index.js';

const processVideo = async (url, client, { from, message, groupMetadata, prettyNumber }) => {
	const video = await youtube.core.video.download(url);

	INFOLOG(`${color('Downloading YouTube Video', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);

	if ('error' in video) {
		client.instance.reply(video.error, { from, quoted: message, groupMetadata });
		ERRLOG(`⚠️ ${color('Failed to Download YouTube Video', '#FF5555')} for ${color(prettyNumber, '#E4C1F9')}`);
		return;
	}

	const { title, resolution, file, size, download } = video;

	if (!file) {
		client.instance.reply(`Error while downloading YouTube Video\n\n${url}`, { from, quoted: message, groupMetadata });
		ERRLOG(`⚠️ ${color('Failed to Download YouTube Video', '#FF5555')} for ${color(prettyNumber, '#E4C1F9')}`);

		return;
	}

	let capt = '';

	capt += `Title : ${title}\n`;
	capt += `Size : ${size}\n`;
	capt += `Resolution : ${resolution}`;

	await client.instance.send(
		from,
		{
			video: Buffer.from(await download(), 'base64'),
			caption: capt.trim().formatForm()
		},
		{
			groupMetadata,
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
	usage: '!ytvideo <url>',
	aliases: ['ytv', 'ytmp4'],
	category: 'Downloader',
	cooldown: 12,
	limit: 8,
	status: 'enable',
	async run({ from, query, prettyNumber, message, /*type, args,*/ groupMetadata, mediaData, typeQuoted, bodyQuoted }, client) {
		if (typeQuoted === 'conversation' && mediaData.participant?.includes(client.instance.decodeJid(instance))) {
			const reg = /✦ Video ID :\s*`([^\n]+)`/g;

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

			const { key } = await client.instance.reply(`Downloading YouTube audio :\n${videoId}\nPlease wait`.formatForm(), {
				from,
				quoted: message,
				groupMetadata
			});

			await processVideo(`https://youtu.be/${videoId}`, client, { from, message, groupMetadata, prettyNumber });

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

			INFOLOG(`${color('Downloaded YouTube Video', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);

			return;
		}

		// if (type === 'listResponseMessage' && args[1] === 'download') {
		// 	await client.instance.send(
		// 		from,
		// 		{ video: { url: args[2].replace('https', 'http') } },
		// 		{ groupMetadata, quoted: message }
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
		// 		{ groupMetadata }
		// 	);
		// 	return;
		// }

		if (!query) {
			return await client.instance.reply('Please provide a URL', { from, quoted: message, groupMetadata });
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		if (queries.length === 1 && isURL(queries) && !isYoutubeURL(queries)) {
			return await client.instance.reply('This is not a valid YouTube URL.', { from, quoted: message, groupMetadata });
		}

		const { key } = await client.instance.reply(
			`Downloading YouTube video(s) :\n${queries.join('\n')}\nPlease wait`.formatForm(),
			{
				from,
				quoted: message,
				groupMetadata
			}
		);

		for (const Query of queries) {
			if (isURL(Query) && !isYoutubeURL(Query)) {
				return await client.instance.reply(`[ ${Query} ] This isn't a valid YouTube URL.`, {
					from,
					quoted: message,
					groupMetadata
				});
			}

			await processVideo(Query, client, { from, message, groupMetadata, prettyNumber });
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

		INFOLOG(`${color('Downloaded YouTube Video', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);
	}
};
