import archiver from 'archiver';
import fs from 'fs-extra';
import parser from 'yargs-parser';

import { dab, metadata } from '../../utils/dab/index.js';
import { spotifier } from '../../utils/index.js';
import { color, delay, isURL, loggers, removeDuplicatesArray } from '../../utils/modules/index.js';

const spotifyRedirectUrlRegex = /https?:\/\/spotify\.link\/([a-zA-Z0-9]+)/;
const regexUrlLocation = /window\.top\.location = validateProtocol\("([^"]+)"\);/g;

const getRedirect = async (shortUrl) => {
	try {
		const response = await fetch(shortUrl, { redirect: 'follow' });
		const text = await response.text();
		const matches = [...text.matchAll(regexUrlLocation)].map((m) => m[1]);

		return matches[1] ?? null;
	} catch {
		console.error('Error fetching redirect URL:', shortUrl);
		return null;
	}
};

const getSpotifyType = (url) => {
	const reg = /^(https:\/\/open\.spotify\.com\/(track|album|playlist|artist)\/[a-zA-Z0-9]+)(\?.+)?$/i;
	const match = reg.exec(url);

	return match?.[2] ?? 'track';
};

const extractId = (url) =>
	url.match(/https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:track\/|\?uri=spotify:track:)((\w|-){22})/)?.[1] || null;

const isSpotifyURL = (url) =>
	/^(https:\/\/open\.spotify\.com\/(track|album|playlist|artist)\/[a-zA-Z0-9]+)(\?.+)?$/i.test(url);

const sanitizeFilename = (name) =>
	name
		.replace(/[\/\\?%*:|"<>]/g, '_')
		.replace(/\s+/g, ' ')
		.trim()
		.slice(0, 150);

const searchTracksOnDab = async (tracksNames, wait, type) => {
	let processCaption = `Processing Spotify ${type}...\nSearching ${tracksNames.length} tracks...`;

	await wait.update(processCaption);

	processCaption = `Processing Spotify ${type}...\nFetching Spotify results...`;
	await wait.update(processCaption);

	const dabResults = await Promise.all(
		tracksNames.map(async (trackName) => {
			const res = await dab.search(trackName);

			return { name: trackName, result: res };
		})
	);

	const tracksNotFound = dabResults.filter(({ result }) => !result.items || result.items.length === 0).map(({ name }) => name);

	const dabTracks = dabResults.filter(({ result }) => result.items && result.items.length > 0).map(({ result }) => result);

	if (tracksNotFound.length > 0) {
		processCaption = processCaption.replace('Fetching Spotify results...', '⚠️  Tracks not found:');

		for (const name of tracksNotFound) {
			processCaption += `\n • ${name}`;
		}
	}

	processCaption = processCaption.replace(
		'Fetching Spotify results...',
		`✅ Found ${dabTracks.length}/${tracksNames.length} tracks.`
	);
	processCaption += `\n • ${dabTracks.map((track) => track.items[0].title).join(', ')}`;
	await wait.update(processCaption);

	return { dabTracks, processCaption };
};

const downloadTracksFromDab = async (dabTracks, wait, processCaption, type) => {
	processCaption += '\n\nDownloading tracks...';
	await wait.update(processCaption);

	let dabDownloads = await Promise.all(
		dabTracks.map(async (track) => {
			track = type === 'album' ? track.item : track.items[0];
			const downloadData = await dab.download(track.id);

			if (downloadData.error) {
				return null;
			}

			const buffer = await metadata(downloadData.track, downloadData.url, downloadData.cover);
			const filename = sanitizeFilename(`${downloadData.track.artist.name} - ${downloadData.track.title}`);

			return { name: filename, buffer };
		})
	);

	dabDownloads = dabDownloads.filter((t) => t !== null);
	return { dabDownloads, processCaption };
};

const createZipArchive = async (downloads, output, wait, processCaption) => {
	processCaption = processCaption.replace('Downloading tracks...', '📦 Creating ZIP archive...');
	await wait.update(processCaption);

	const stream = fs.createWriteStream(output);
	const archive = archiver('zip');

	stream.on('close', () => stream.end());
	archive.on('error', (err) => {
		throw err;
	});

	archive.pipe(stream);

	for (const track of downloads) {
		archive.append(track.buffer, { name: `${track.name}.flac` });
	}

	await archive.finalize();

	processCaption = processCaption.replace(
		'Creating ZIP archive...',
		'ZIP archive created! With Zipped ' + archive.pointer() + ' total bytes'
	);
	await wait.update(processCaption);

	return processCaption;
};

const handleSpotifyCollection = async (url, type, client, { from, message, wait }) => {
	let processCaption = `Searching Spotify ${type}...`;

	await wait.update(processCaption);

	const regex = new RegExp(`${type}\\/([a-zA-Z0-9]+)`);
	const id = url.match(regex)[1];

	let tracksNames, collectionName, dabDownloads, downloadCaption;

	if (type === 'playlist') {
		const playlist = await spotifier.getPlaylists(id);

		collectionName = sanitizeFilename(playlist.name);
		tracksNames = playlist.tracks.items.map((item) => `${item.track.artists[0].name} - ${item.track.name}`);

		tracksNames = [...new Set(tracksNames)];

		const { dabTracks, processCaption: searchCaption } = await searchTracksOnDab(tracksNames, wait, type);
		const { dabDownloads: downloads, processCaption } = await downloadTracksFromDab(dabTracks, wait, searchCaption);

		dabDownloads = downloads;
		downloadCaption = processCaption;
	} else {
		const album = await spotifier.getAlbum(id);

		collectionName = sanitizeFilename(album.albums[0].name);

		const albumTracksId = await dab.search(collectionName, 'album');
		const albumData = await dab.getAlbum(albumTracksId.albums.items[0].id);

		let processCaption = `Processing Spotify ${type}...\n✅ Found ${albumData[1].items.length}/${album.albums[0].total_tracks} tracks.`;

		await wait.update(processCaption);

		const { dabDownloads: downloads, processCaption: caption } = await downloadTracksFromDab(
			albumData[1].items,
			wait,
			processCaption,
			'album'
		);

		dabDownloads = downloads;
		downloadCaption = caption;
	}

	const output = `./src/media/temporary_files/${collectionName}.zip`;

	const finalCaption = await createZipArchive(dabDownloads, output, wait, downloadCaption);

	let sendCaption = finalCaption + '\n\n↻ Sending file...';

	await wait.update(sendCaption);

	await client.instance.send(
		from,
		{
			document: await fs.readFile(output),
			fileName: `${collectionName}.zip`,
			mimetype: 'application/zip'
		},
		{
			quoted: message
		}
	);

	fs.unlinkSync(output);

	sendCaption = sendCaption.replace('↻ Sending file...', 'Command finished successfully!');
	sendCaption = sendCaption.replace('Processing Spotify ' + type, 'Finished processing Spotify');
	await wait.update(sendCaption);

	return { status: true, caption: sendCaption };
};

const handleSingleTrack = async (url, type, client, { from, message, prettyNumber, wait }) => {
	await wait.update(`Downloading Spotify ${type}...`);
	const { tracks, status, message: respMessage } = await spotifier.getTracks(extractId(url));

	if (!status) {
		await client.instance.reply(from, respMessage, message);
		loggers.error(`${color('Failed to Download Spotify ' + type, '#FF5555')} for ${color(prettyNumber, '#E4C1F9')}`);
		return false;
	}

	loggers.warning(`${color('Downloading Spotify ' + type, '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);

	const searchResults = await dab.search(`${tracks[0].artists[0].name} - ${tracks[0].name}`);

	if (searchResults.items.length === 0) {
		await client.instance.reply(from, 'No results found on DAB.', message);
		loggers.error(`${color('Failed to Download Spotify ' + type, '#FF5555')} for ${color(prettyNumber, '#E4C1F9')}`);
		return false;
	}

	await wait.update('Downloading Music...');

	const downloadInfo = await dab.download(searchResults.items[0].id);

	if (downloadInfo?.error) {
		await client.instance.reply(from, downloadInfo?.error, message);
		loggers.error(`${color('Failed to Download Spotify ' + type, '#FF5555')} for ${color(prettyNumber, '#E4C1F9')}`);
		return false;
	}

	await wait.update('Writing metadata to the file...');

	const buffer = await metadata(downloadInfo.track, downloadInfo.url, downloadInfo.cover);

	await wait.update('Writing metadata to the file success.');
	await delay(2000);
	await wait.update('Sending the file...');

	const fileName = `${tracks[0].name} - ${tracks[0].artists
		.map((v) => v.name)
		.map((v, i) => (tracks[0].artists.length !== 1 && i + 1 === tracks[0].artists.length ? `and ${v}` : v))
		.join(', ')}.flac`;

	await client.instance.send(
		from,
		{
			document: buffer,
			fileName,
			mimetype: 'audio/flac'
		},
		{
			quoted: message
		}
	);

	return true;
};

const processVideo = async (url, type, client, ctx) => {
	if (['playlist', 'album'].includes(type)) {
		return handleSpotifyCollection(url, type, client, ctx);
	}

	return handleSingleTrack(url, type, client, ctx);
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
				return await client.instance.reply(from, 'No id(s) found', message);
			}

			const numberiedQuery = Number(query);
			const index = numberiedQuery - 1;

			if (!numberiedQuery) {
				return await client.instance.reply(from, `Please specify a number beteen 1 - ${videoIds.length}`, message);
			}

			if (index > videoIds.length) {
				return await client.instance.reply(from, `Please specify a number beteen 1 - ${videoIds.length}`, message);
			}

			const videoId = videoIds[index][0];
			const typeMedia = videoIds[index][1];

			if (!videoId) {
				return await client.instance.reply(from, `Please specify a number beteen 1 - ${videoIds.length}`, message);
			}

			await client.instance.reply(from, `Downloading Spotify ${typeMedia} :\n${videoId}\nPlease wait`.formatForm(), message);

			await processVideo(`https://open.spotify.com/${typeMedia}/${videoId}`, typeMedia, client, {
				from,
				message,
				prettyNumber
			});

			return;
		}

		if (!query) {
			return await client.instance.reply(from, 'Please provide a URL.', from);
		}

		const wait = await client.instance.waitMessage(from, 'Please wait...', message);

		let { _: urls } = parser(query);

		urls = removeDuplicatesArray(urls);

		let success = 0;
		let error = 0;

		loggers.warning(`${color('Downloading Spotify Media', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);

		check: if (urls.length === 1 && isURL(urls) && !isSpotifyURL(urls)) {
			if (spotifyRedirectUrlRegex.test(urls[0])) {
				const redirectUrl = await getRedirect(urls[0]);

				loggers.info(`${color('Resolved Spotify Redirect URL', '#99FFC8')} for ${color(prettyNumber, '#E4C1F9')}`);

				urls = [redirectUrl];
				break check;
			}

			loggers.error(`${color('Failed to Download Spotify Media', '#FF5555')} for ${color(prettyNumber, '#E4C1F9')}`);
			return await wait.update('This is not a valid Spotify URL.');
		}

		for (let url of urls) {
			check: if (isURL(url) && !isSpotifyURL(url)) {
				if (spotifyRedirectUrlRegex.test(url)) {
					const redirectUrl = await getRedirect(url);

					loggers.info(`${color('Resolved Spotify Redirect URL', '#99FFC8')} for ${color(prettyNumber, '#E4C1F9')}`);

					url = redirectUrl;
					break check;
				}

				await client.instance.reply(from, `[ ${url} ] This isn't a valid Spotify URL.`, message);
				loggers.error(`${color('Failed to Download Spotify Media', '#FF5555')} for ${color(prettyNumber, '#E4C1F9')}`);
				error++;
				continue;
			}

			const typeMedia = getSpotifyType(url);

			if (typeMedia === 'artist') {
				await client.instance.reply(from, `[ ${url} ] This is an artist link. Please send media URL.`, message);
				loggers.error(`${color('Failed to Download Spotify Media', '#FF5555')} for ${color(prettyNumber, '#E4C1F9')}`);
				error++;
				continue;
			}

			const status = await processVideo(url, typeMedia, client, { from, message, prettyNumber, wait });

			if (!status) {
				error++;
				continue;
			}

			success++;
		}

		await wait.update(`Command Finished. With total ${success} success, and ${error} fail.`);

		loggers.info(`${color('Downloaded Spotify Media', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);
	}
};
