import { spawn } from 'child_process';

export const metadata = async (data, songUrl, coverUrl) =>
	new Promise((resolve, reject) => {
		const result = [];
		const args = [
			'-y',
			'-i',
			songUrl,
			'-i',
			coverUrl,
			'-map',
			'0:a?',
			'-map',
			'1:v?',
			'-c',
			'copy',
			'-f',
			'flac',
			'-metadata',
			'title=' + data.title,
			'-metadata',
			'album_artist=' + data.artist.name,
			'-metadata',
			'artist=' + data.artists.map((v) => v.name).join(', '),
			'-metadata',
			'album=' + data.album.title,
			'-metadata',
			'date=' + new Date(data.streamStartDate).getFullYear(),
			'-metadata',
			'track=' + data.trackNumber,
			'-metadata',
			'explicit=' + data.explicit,
			'-metadata:s:v',
			'title=Album cover',
			'-metadata:s:v',
			'comment=Cover (front)',
			'-disposition:v:0',
			'attached_pic',
			'pipe:1'
		];

		const ff = spawn('ffmpeg', args, { windowsHide: true });

		ff.stdout.on('data', (data) => result.push(data));
		ff.stdout.on('error', (err) => reject(err));

		ff.on('error', (err) => {
			reject(err);
		});
		ff.on('close', () => resolve(Buffer.concat(result)));
	});
