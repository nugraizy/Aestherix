import { jidDecode } from '@adiwajshing/baileys';

import {
	color,
	delay,
	ERRLOG,
	INFOLOG,
	isURL,
	numberWithCommas,
	removeDuplicatesArray,
	isYoutubeURL
} from '../../utils/modules/index.js';
import { youtubeMainDownload as yta } from '../../utils/youtube/index.js';

/**
 *
 * @param {string} url
 * @param {import('../../types/Socket/index.js').AdvancedClient} client
 * @param {{from: string, message: import('../../types/Reconstruct/index.js').ReassignResult['message'], groupMetadata: import('../../types/Reconstruct/index.js').ReassignResult['groupMetadata'], prettyNumber: string}} param2
 * @returns
 */
const processAudio = async (url, client, { from, message, groupMetadata, prettyNumber }) => {
	const audio = await yta(url, 'mp3');

	INFOLOG(`${color('Downloading YouTube Audio', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`);

	if ('error' in audio) {
		client.instance.reply(audio.error, { from, quoted: message, groupMetadata });
		ERRLOG(`⚠️ ${color('Failed to Download YouTube Audio', '#FF5555')} for ${color(prettyNumber, '#ff71ce')}`);
	} else {
		const { title, description, timestamp, uploaded, views, author, urlChannel, link } = audio;

		if (!link) {
			client.instance.reply(`Error while downloading YouTube Video\n\n${url}`, { from, quoted: message, groupMetadata });
			ERRLOG(`⚠️ ${color('Failed to Download YouTube Video', '#FF5555')} for ${color(prettyNumber, '#ff71ce')}`);

			return;
		}

		let capt = '';

		capt += `Title : ${title}\n`;
		capt += `Uploaded : ${uploaded}\n`;
		capt += `Views : ${numberWithCommas(views)}\n`;
		capt += `Author : ${author}\n`;
		capt += `Channel : ${urlChannel}\n`;
		capt += `Duration : ${timestamp ?? 'No Data'}\n`;
		capt += `Description : ${description ?? 'No Data'}\n`;

		await client.instance.send(
			from,
			{
				document: { url: link },
				fileName: `${title}.mp3`,
				mimetype: 'audio/mp3',
				caption: capt

				// caption: capt,
				// footer: 'Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪',
				// buttons: [
				// 	{
				// 		buttonId: `.ytmp4 get ${url}`,
				// 		buttonText: { displayText: '
				// Video' },
				// 		type: 1
				// 	}
				// ]
			},
			{
				groupMetadata,
				quoted: message
			}
		);
	}
};

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'ytaudio',
	minifiedDescription: 'Downloads YouTube Audio',
	description: 'Downloads a YouTube audio',
	usage: '!ytaudio <url>',
	aliases: ['yta', 'ytmp3'],
	category: 'Downloader',
	cooldown: 7,
	limit: 8,
	status: 'enable',
	async run({ from, query, prettyNumber, message, type, args, groupMetadata, mediaData, bodyQuoted, typeQuoted }, client) {
		if (typeQuoted === 'conversation' && mediaData.participant?.includes(jidDecode(instance).user)) {
			const reg = /✦ Video ID :\s*([^\n]+)/g;

			const videoIds = [];
			let match;

			while ((match = reg.exec(bodyQuoted)) !== null) {
				videoIds.push(match[1]);
			}

			if (videoIds.length === 0) {
				return await client.instance.reply('No id(s) found', { from, quoted: message, groupMetadata });
			}

			const numberiedQuery = Number(query);
			const index = numberiedQuery - 1;

			if (numberiedQuery === 0) {
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

			await client.instance.reply(`Downloading YouTube audio :\n${videoId}\nPlease wait`, {
				from,
				quoted: message,
				groupMetadata
			});

			await processAudio(`https://youtu.be/${videoId}`, client, { from, message, groupMetadata, prettyNumber });

			return;
		}

		if (type === 'listResponseMessage' && args[1] === 'download') {
			await client.instance.send(
				from,
				{
					document: { url: args[2] },
					fileName: `${args.slice(3).join(' ')}.opus`,
					mimetype: 'audio/opus',
					caption: ''
				},
				{ groupMetadata, quoted: message }
			);
			return;
		} else if (type === 'templateButtonReplyMessage' && args[1] === 'get') {
			const video = await yta(args[2], 'mp4');
			const { title, mp4 } = video;

			await client.instance.send(from, {
				title: 'YouTube MP3'.formatHeaders(),
				footer: 'Made by Void Bot. Powered by Hidden Finder',
				text: '\t',
				buttonText: 'Open List',
				sections: mp4.map((v, i) => ({
					rows: [{ title: `${i + 1}. ${v.quality} ${v.filesizeF}`, rowId: `.ytmp4 download ${v.dlUrl} ${title}` }],
					title: '\t'
				}))
			});
			return;
		}

		if (!query) {
			return await client.instance.reply('Please provide a URL', { from, quoted: message, groupMetadata });
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		if (queries.length === 1 && isURL(queries) && !isYoutubeURL(queries)) {
			return await client.instance.reply('This is not a valid YouTube URL.', { from, quoted: message, groupMetadata });
		}

		await client.instance.reply(`Downloading YouTube audio(s) :\n${queries.join('\n')}\nPlease wait`, {
			from,
			quoted: message,
			groupMetadata
		});

		for (const Query of queries) {
			if (isURL(Query) && !isYoutubeURL(Query)) {
				return await client.instance.reply(`[ ${Query} ] This isn't a valid YouTube URL.`, {
					from,
					quoted: message,
					groupMetadata
				});
			}

			await processAudio(Query, client, { from, message, groupMetadata, prettyNumber });
			await delay(300);
		}

		INFOLOG(`${color('Downloaded YouTube Audio', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`);
	}
};
