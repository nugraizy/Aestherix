import parser from 'yargs-parser';

import { color, delay, loggers, isURL, removeDuplicatesArray } from '../../utils/modules/index.js';
import { spotifier } from '../../utils/index.js';

const getSpotifyType = (url) => {
	const reg = /^(https:\/\/open\.spotify\.com\/(track|album|playlist|artist)\/[a-zA-Z0-9]+)(\?.+)?$/gi;
	const match = reg.exec(url);

	if (!match) {
		return 'track';
	}

	return match[2];
};

const extractId = (url) => {
	return url.match(/https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:track\/|\?uri=spotify:track:)((\w|-){22})/)?.[1] || null;
};

const isSpotifyURL = (url) => {
	const reg = /^(https:\/\/open\.spotify\.com\/(track|album|playlist|artist)\/[a-zA-Z0-9]+)(\?.+)?$/gi;

	return reg.test(url);
};

const processVideo = async (url, type, client, { from, message, prettyNumber }) => {
	const { tracks, status, message: respMessage } = await spotifier.getTracks(extractId(url));

	if (!status) {
		return await client.instance.reply(respMessage, { from, quoted: message });
	}

	const { download } = tracks[0];

	loggers.warning(`${color('Downloading Spotify ' + type, '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);

	const video = await download();

	if (video?.error) {
		client.instance.reply(video.message, { from, quoted: message });
		loggers.error(`${color('Failed to Download Spotify ' + type, '#FF5555')} for ${color(prettyNumber, '#E4C1F9')}`);
		return;
	}

	const { url: downloadUrl } = video;

	await client.instance.send(
		from,
		{
			document: { url: downloadUrl },
			fileName: `${tracks[0].name} - ${tracks[0].artists
				.map((v) => v.name)
				.map((v, i) => (tracks[0].artists.length !== 1 && i + 1 === tracks[0].artists.length ? `and ${v}` : v))
				.join(', ')}.mp3`,
			mimetype: 'audio/mp3'

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
			quoted: message
		}
	);
};

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'spotifydl',
	minifiedDescription: 'Download Spotify',
	description: 'Download media from Spotify.',
	usage: '!spotifydl `<url(s)>` (you can send multiple url using space in between)',
	aliases: ['spdl', 'spotdl'],
	category: 'Downloader',
	cooldown: 4,
	limit: 5,
	status: 'enable',
	run: async ({ query, bodyQuoted, typeQuoted, message, from, mediaData, prettyNumber }, client) => {
		if (typeQuoted === 'imageMessage' && mediaData.participant?.includes(client.instance.decodeJid(instance))) {
			const reg = /✦ Media ID :\s*([^\n]+)/g;
			const type = /🖼️ Type :\s*([^\n]+)/g;

			const videoIds = [];
			let match;

			while ((match = reg.exec(bodyQuoted)) !== null) {
				videoIds.push([match[1], type.exec(bodyQuoted)[1]]);
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

			const videoId = videoIds[index][0];
			const typeMedia = videoIds[index][1];

			if (!videoId) {
				return await client.instance.reply(`Please specify a number beteen 1 - ${videoIds.length}`, {
					from,
					quoted: message
				});
			}

			await client.instance.reply(`Downloading Spotify ${typeMedia} :\n${videoId}\nPlease wait`.formatForm(), {
				from,
				quoted: message
			});

			await processVideo(`https://open.spotify.com/${typeMedia}/${videoId}`, typeMedia, client, {
				from,
				message,
				prettyNumber
			});

			return;
		}

		if (!query) {
			return await client.instance.reply('Please provide a URL', { from, quoted: message });
		}

		await client.instance.reply('Please wait...', { from, quoted: message });

		let { _: urls } = parser(query);

		urls = removeDuplicatesArray(urls);

		loggers.warning(`${color('Downloading Pixiv File', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);

		if (urls.length === 1 && isURL(urls) && !isSpotifyURL(urls)) {
			return await client.instance.reply('This is not a valid Spotify URL.', { from, quoted: message });
		}

		for (const url of urls) {
			if (isURL(url) && !isSpotifyURL(url)) {
				await client.instance.reply(`[ ${url} ] This isn't a valid Spotify URL.`, {
					from,
					quoted: message
				});
				loggers.error(`${color('Failed to Download Spotify Media', '#FF5555')} for ${color(prettyNumber, '#E4C1F9')}`);
				continue;
			}

			const typeMedia = getSpotifyType(url);

			if (typeMedia === 'artist') {
				await client.instance.reply(`[ ${url} ] This is an artist link. Please send media URL.`, {
					from,
					quoted: message
				});

				continue;
			}

			await processVideo(url, typeMedia, client, { from, message, prettyNumber });
			await delay(300);
		}

		loggers.info(`${color('Downloaded Spotify Media', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);
	}
};
