import archiver from 'archiver';
import fs from 'fs-extra';
import parser from 'yargs-parser';

import { getLocale, useLocale, t } from '../../helper/i18n/index.js';
import { hifi, metadata } from '../../utils/hi-fi/index.js';
import { spotifier } from '../../utils/index.js';
import { color, delay, isURL, loggers, removeDuplicatesArray } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';

const spotifyRedirectUrlRegex = /https?:\/\/spotify\.link\/([a-zA-Z0-9]+)/;
const regexUrlLocation = /window\.top\.location = validateProtocol\("([^"]+)"\);/g;

const getRedirect = async (shortUrl) => {
	try {
		const response = await fetch(shortUrl, { redirect: 'follow', signal: AbortSignal.timeout(15_000) });
		const text = await response.text();
		const matches = [...text.matchAll(regexUrlLocation)].map((m) => m[1]);

		return matches[1] ?? null;
	} catch {
		loggers.error(color('Spotify redirect URL fetch failed:', 'red'), color(shortUrl, 'gray'));
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

const searchTracksOnHifi = async (tracksNames, wait, type) => {
	let processCaption = `Processing Spotify ${type}...\nSearching ${tracksNames.length} tracks...`;

	await wait.update(processCaption);

	processCaption = `Processing Spotify ${type}...\nFetching Spotify results...`;
	await wait.update(processCaption);

	const hifiResults = await Promise.all(
		tracksNames.map(async (trackName) => {
			const res = await hifi.search(trackName);

			return { name: trackName, result: res };
		})
	);

	const tracksNotFound = hifiResults
		.filter(({ result }) => !result.items || result.items.length === 0)
		.map(({ name }) => name);

	const hifiTracks = hifiResults.filter(({ result }) => result.items && result.items.length > 0).map(({ result }) => result);

	if (tracksNotFound.length > 0) {
		processCaption = processCaption.replace('Fetching Spotify results...', '⚠️  Tracks not found:');

		for (const name of tracksNotFound) {
			processCaption += `\n • ${name}`;
		}
	}

	processCaption = processCaption.replace(
		'Fetching Spotify results...',
		`✅ Found ${hifiTracks.length}/${tracksNames.length} tracks.`
	);
	processCaption += `\n • ${hifiTracks.map((track) => track.items[0].title).join(', ')}`;
	await wait.update(processCaption);

	return { hifiTracks, processCaption };
};

const downloadTracksFromHifi = async (hifiTracks, wait, processCaption, type) => {
	processCaption += '\n\nDownloading tracks...';
	await wait.update(processCaption);

	let hifiDownloads = await Promise.all(
		hifiTracks.map(async (track) => {
			track = type === 'album' ? track.item : track.items[0];
			const downloadData = await hifi.download(track.id);

			if (downloadData.error) {
				return null;
			}

			const buffer = await metadata(downloadData.track, downloadData.url, downloadData.cover);
			const filename = sanitizeFilename(`${downloadData.track.artist.name} - ${downloadData.track.title}`);

			return { name: filename, buffer };
		})
	);

	hifiDownloads = hifiDownloads.filter((t) => t !== null);
	return { hifiDownloads, processCaption };
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

	let tracksNames, collectionName, hifiDownloads, downloadCaption;

	if (type === 'playlist') {
		const playlist = await spotifier.getPlaylists(id);

		collectionName = sanitizeFilename(playlist.name);
		tracksNames = playlist.tracks.items.map((item) => `${item.track.artists[0].name} - ${item.track.name}`);

		tracksNames = [...new Set(tracksNames)];

		const { hifiTracks, processCaption: searchCaption } = await searchTracksOnHifi(tracksNames, wait, type);
		const { hifiDownloads: downloads, processCaption } = await downloadTracksFromHifi(hifiTracks, wait, searchCaption);

		hifiDownloads = downloads;
		downloadCaption = processCaption;
	} else {
		const album = await spotifier.getAlbum(id);

		collectionName = sanitizeFilename(`${album.albums[0].artists[0].name} ${album.albums[0].name}`);

		const albumTracksId = await hifi.search(collectionName, 'album');
		const { items: albumData } = await hifi.getAlbum(albumTracksId.albums.items[0].id);

		let processCaption = `Processing Spotify ${type}...\n✅ Found ${albumData.length}/${album.albums[0].total_tracks} tracks.`;

		await wait.update(processCaption);

		const { hifiDownloads: downloads, processCaption: caption } = await downloadTracksFromHifi(
			albumData,
			wait,
			processCaption,
			'album'
		);

		hifiDownloads = downloads;
		downloadCaption = caption;
	}

	const output = `./tmp/${collectionName}.zip`;

	const finalCaption = await createZipArchive(hifiDownloads, output, wait, downloadCaption);

	let sendCaption = finalCaption + '\n\n↻ Sending file...';

	await wait.update(sendCaption);

	await client.send(
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

	await fs.unlink(output).catch(() => {});

	sendCaption = sendCaption.replace('↻ Sending file...', 'Command finished successfully!');
	sendCaption = sendCaption.replace('Processing Spotify ' + type, 'Finished processing Spotify');
	await wait.update(sendCaption);

	return { status: true, caption: sendCaption };
};

const handleSingleTrack = async (url, type, client, { from, message, prettyNumber, wait, L, locale }) => {
	await wait.update(`Downloading Spotify ${type}...`);
	const { tracks, status, message: respMessage } = await spotifier.getTracks(extractId(url));

	if (!status) {
		await client.reply(from, respMessage, message);
		loggers.error(`${color('Failed to Download Spotify ' + type, 'red')} for ${color(prettyNumber, 'lilac')}`);
		return false;
	}

	loggers.warning(`${color('Downloading Spotify ' + type, 'pink')} for ${color(prettyNumber, 'lilac')}`);

	const searchResults = await hifi.search(`${tracks[0].artists[0].name} - ${tracks[0].name}`);

	if (searchResults.items.length === 0) {
		await client.reply(from, L.errors.noResults, message);
		loggers.error(`${color('Failed to Download Spotify ' + type, 'red')} for ${color(prettyNumber, 'lilac')}`);
		return false;
	}

	await wait.update('Downloading Music...');

	const downloadInfo = await hifi.download(searchResults.items[0].id);

	if (downloadInfo?.error) {
		await client.reply(from, downloadInfo?.error, message);
		loggers.error(`${color('Failed to Download Spotify ' + type, 'red')} for ${color(prettyNumber, 'lilac')}`);
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

	await client.send(
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

export default defineCommand({
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
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (
			typeQuoted === 'imageMessage' &&
			client.decodeJid(await client.resolveJid(mediaData.participant, 'jid'))?.includes(client.decodeJid(client.user.id))
		) {
			const reg = /✦ Media ID :\s*([^\n]+)\n🖼️ Type :\s*([^\n]+)/g;

			const videoIds = [];
			let match;

			while ((match = reg.exec(bodyQuoted)) !== null) {
				videoIds.push([match[1], match[2]]);
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

			const videoId = videoIds[index][0];
			const typeMedia = videoIds[index][1];

			if (!videoId) {
				return await client.reply(from, t(locale, 'common.errors.numberRange', [1, videoIds.length]), message);
			}

			await client.reply(from, `Downloading Spotify ${typeMedia} :\n${videoId}\nPlease wait`.formatForm(), message);

			const wait = await client.waitMessage(from, L.success.processing, message);

			await processVideo(`https://open.spotify.com/${typeMedia}/${videoId}`, typeMedia, client, {
				from,
				message,
				prettyNumber,
				wait
			});

			return;
		}

		if (!query) {
			return await client.reply(from, L.errors.noUrl, from);
		}

		const wait = await client.waitMessage(from, L.success.loading, message);

		let { _: urls } = parser(query);

		urls = removeDuplicatesArray(urls);

		let success = 0;
		let error = 0;

		loggers.warning(`${color('Downloading Spotify Media', 'pink')} for ${color(prettyNumber, 'lilac')}`);

		check: if (urls.length === 1 && isURL(urls[0]) && !isSpotifyURL(urls[0])) {
			if (spotifyRedirectUrlRegex.test(urls[0])) {
				const redirectUrl = await getRedirect(urls[0]);

				loggers.info(`${color('Resolved Spotify Redirect URL', 'mint')} for ${color(prettyNumber, 'lilac')}`);

				urls = [redirectUrl];
				break check;
			}

			loggers.error(`${color('Failed to Download Spotify Media', 'red')} for ${color(prettyNumber, 'lilac')}`);
			return await wait.update(L.errors.invalidSpotifyUrl);
		}

		for (let url of urls) {
			check: if (isURL(url) && !isSpotifyURL(url)) {
				if (spotifyRedirectUrlRegex.test(url)) {
					const redirectUrl = await getRedirect(url);

					loggers.info(`${color('Resolved Spotify Redirect URL', 'mint')} for ${color(prettyNumber, 'lilac')}`);

					url = redirectUrl;
					break check;
				}

				await client.reply(from, `${url} ${L.errors.invalidSpotifyUrl}`, message);
				loggers.error(`${color('Failed to Download Spotify Media', 'red')} for ${color(prettyNumber, 'lilac')}`);
				error++;
				continue;
			}

			const typeMedia = getSpotifyType(url);

			if (typeMedia === 'artist') {
				await client.reply(from, `${url} ${L.errors.spotifyArtistUrl}`, message);
				loggers.error(`${color('Failed to Download Spotify Media', 'red')} for ${color(prettyNumber, 'lilac')}`);
				error++;
				continue;
			}

			const status = await processVideo(url, typeMedia, client, { from, message, prettyNumber, wait, L, locale });

			if (!status) {
				error++;
				continue;
			}

			success++;
		}

		await wait.update(`Command Finished. With total ${success} success, and ${error} fail.`);

		loggers.info(`${color('Downloaded Spotify Media', 'pink')} for ${color(prettyNumber, 'lilac')}`);
	}
});
