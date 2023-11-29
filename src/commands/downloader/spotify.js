import { jidDecode } from '@adiwajshing/baileys';

import { color, delay, ERRLOG, INFOLOG, isURL, removeDuplicatesArray } from '../../utils/modules/index.js';
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

const processVideo = async (url, type, client, { from, message, groupMetadata, prettyNumber }) => {
	const { tracks, status, message: respMessage } = await spotifier.getTracks(extractId(url));

	console.log(tracks);

	if (!status) {
		return await client.instance.reply(respMessage, { from, quoted: message, groupMetadata });
	}

	const { download } = tracks[0];

	INFOLOG(`${color('Downloading Spotify ' + type, 'cyan')} for ${color(prettyNumber, '#ff71ce')}`);

	const video = await download();

	if ('error' in video && video.error) {
		client.instance.reply(video.message, { from, quoted: message, groupMetadata });
		ERRLOG(`⚠️ ${color('Failed to Download Spotify ' + type, '#FF5555')} for ${color(prettyNumber, '#ff71ce')}`);
		return;
	}

	const { url: downloadUrl } = video.results[video.absoluteUrl];

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
			groupMetadata,
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
	usage: '!spotifydl <url>',
	aliases: ['spdl', 'spotdl'],
	category: 'Downloader',
	cooldown: 4,
	limit: 5,
	status: 'enable',
	run: async ({ query, bodyQuoted, typeQuoted, message, groupMetadata, from, mediaData, prettyNumber }, client) => {
		if (typeQuoted === 'imageMessage' && mediaData.participant?.includes(jidDecode(instance).user)) {
			const reg = /✦ Media ID :\s*([^\n]+)/g;
			const type = /🖼️ Type :\s*([^\n]+)/g;

			const videoIds = [];
			let match;

			while ((match = reg.exec(bodyQuoted)) !== null) {
				videoIds.push([match[1], type.exec(bodyQuoted)[1]]);
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

			const videoId = videoIds[index][0];
			const typeMedia = videoIds[index][1];

			await client.instance.reply(`Downloading Spotify ${typeMedia} :\n${videoId}\nPlease wait`, {
				from,
				quoted: message,
				groupMetadata
			});

			await processVideo(`https://open.spotify.com/${typeMedia}/${videoId}`, typeMedia, client, {
				from,
				message,
				groupMetadata,
				prettyNumber
			});

			return;
		}

		if (!query) {
			return await client.instance.reply('Please provide a URL', { from, quoted: message, groupMetadata });
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		if (queries.length === 1 && isURL(queries) && !isSpotifyURL(queries)) {
			return await client.instance.reply('This is not a valid Spotify URL.', { from, quoted: message, groupMetadata });
		}

		await client.instance.reply(`Downloading Spotify Media(s) :\n${queries.join('\n')}\nPlease wait`, {
			from,
			quoted: message,
			groupMetadata
		});

		for (const Query of queries) {
			if (isURL(Query) && !isSpotifyURL(Query)) {
				return await client.instance.reply(`[ ${Query} ] This isn't a valid Spotify URL.`, {
					from,
					quoted: message,
					groupMetadata
				});
			}

			const typeMedia = getSpotifyType(Query);

			if (typeMedia === 'artist') {
				await client.instance.reply(`[ ${Query} ] This is an artist link. Please send media URL.`, {
					from,
					quoted: message,
					groupMetadata
				});

				continue;
			}

			await processVideo(Query, typeMedia, client, { from, message, groupMetadata, prettyNumber });
			await delay(300);
		}

		INFOLOG(`${color('Downloaded Spotify Media', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`);
	}
};
