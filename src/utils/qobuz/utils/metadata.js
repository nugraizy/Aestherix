import { spawn } from 'child_process';

function extractMetadata(track) {
	const albumSource = track?.album ?? null;
	const rawAlbum = albumSource?.raw ?? albumSource ?? null;

	const artistName =
		track?.artist?.name ||
		track?.performer?.name ||
		(Array.isArray(rawAlbum?.artists) ? rawAlbum.artists.map((a) => a.name).join(', ') : '') ||
		rawAlbum?.artist?.name ||
		'';

	const releasedAt = rawAlbum?.released_at ?? albumSource?.releasedAt ?? null;
	const year = releasedAt ? new Date(releasedAt * 1000).getFullYear().toString() : '';

	return {
		title: track?.title || '',
		artist: artistName,
		album: albumSource?.title || rawAlbum?.title || '',
		year,
		trackNumber: (track?.track_number ?? track?.trackNumber ?? '').toString(),
		genre: rawAlbum?.genre?.name || albumSource?.genre || '',
		copyright: track?.copyright || rawAlbum?.copyright || ''
	};
}

const metadata = async (track, songUrl, coverUrl) =>
	new Promise((resolve, reject) => {
		const meta = extractMetadata(track, track?.album);
		const result = [];
		const args = [
			'-y',
			'-i',
			songUrl,
			...(coverUrl ? ['-i', coverUrl] : []),
			'-map',
			'0:a?',
			...(coverUrl ? ['-map', '1:v?'] : []),
			'-c',
			'copy',
			'-f',
			'flac',
			'-metadata',
			`title=${meta.title}`,
			'-metadata',
			`artist=${meta.artist}`,
			'-metadata',
			`album=${meta.album}`,
			'-metadata',
			`date=${meta.year}`,
			'-metadata',
			`track=${meta.trackNumber}`,
			'-metadata',
			`genre=${meta.genre}`,
			...(coverUrl
				? ['-metadata:s:v', 'title=Album cover', '-metadata:s:v', 'comment=Cover (front)', '-disposition:v:0', 'attached_pic']
				: []),
			'pipe:1'
		];

		const ff = spawn('ffmpeg', args, { windowsHide: true });

		ff.stdout.on('data', (data) => result.push(data));
		ff.stdout.on('error', (err) => reject(err));
		ff.on('error', (err) => reject(err));
		ff.on('close', () => resolve(Buffer.concat(result)));
	});

export { extractMetadata, metadata };
