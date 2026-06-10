import { exec } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { promisify } from 'node:util';

import fs from 'fs-extra';

import { isURL, isYoutubeURL } from '../modules/index.js';
import { Client } from './lib/index.js';

const execAsync = promisify(exec);
const TEMP_DIR = './tmp';

class YoutubeError extends Error {
	constructor(message, info) {
		super(message);
		this.name = 'YoutubeError';

		if (info) {
			this.info = info;
		}
	}
}

export class YouTube {
	constructor() {
		this.client = new Client();
	}

	async search(query, options) {
		return this.client.search(query, options);
	}

	async resolveId(query) {
		if (isURL(query) && isYoutubeURL(query)) {
			return query;
		}

		const [first] = await this.client.search(query, { limit: 1 });

		if (!first) {
			throw new YoutubeError('Container has no results');
		}

		return first.id;
	}

	matchAudioFormat(video, { quality, itag } = {}) {
		const formats = video.formats;

		if (itag) {
			const found = formats.itag(Number(itag))[0];

			if (!found) {
				throw new YoutubeError(`itag ${itag} is not available`);
			}

			return found;
		}

		const audio = formats.type('audio');
		const preferred = audio.type('mp4');
		const list = (preferred.length ? preferred : audio).sortByBitrateDesc();

		if (!list.length) {
			return null;
		}

		return quality === 'worst' ? list[list.length - 1] : list[0];
	}

	matchVideoFormat(video, { quality, itag } = {}) {
		const formats = video.formats;

		if (itag) {
			const found = formats.itag(Number(itag))[0];

			if (!found) {
				throw new YoutubeError(`itag ${itag} is not available`);
			}

			return found;
		}

		if (!quality) {
			const muxed = formats
				.withAudioChannels()
				.select((format) => format.width > 0)
				.sort();

			if (muxed.length) {
				return muxed[0];
			}
		}

		let candidates = formats.type('avc1');

		if (!candidates.length) {
			candidates = formats.type('video');
		}

		candidates.sort();

		if (!candidates.length) {
			return formats[0];
		}

		if (quality === 'worst') {
			return candidates[candidates.length - 1];
		}

		if (!quality || quality === 'best') {
			return candidates[0];
		}

		const target = String(quality).replace(/p$/i, '');

		return candidates.find((format) => (format.qualityLabel || '').startsWith(target)) || candidates[0];
	}

	pickMatchingAudio(video, videoFormat) {
		const formats = video.formats;
		const isWebm = videoFormat.mimeType.includes('webm');
		const matched = isWebm ? formats.type('audio/webm') : formats.type('audio/mp4');

		return matched.sortByBitrateDesc()[0] || formats.type('audio').sortByBitrateDesc()[0] || null;
	}

	async mergeToBuffer(video, videoFormat, audioFormat) {
		const ext = videoFormat.mimeType.includes('webm') ? 'webm' : 'mp4';
		const base = `${TEMP_DIR}/yt-${randomUUID()}`;
		const videoPath = `${base}.video`;
		const audioPath = `${base}.audio`;
		const outputPath = `${base}.${ext}`;

		try {
			const [videoBuffer, audioBuffer] = await Promise.all([
				this.client.downloadAsBuffer(video, videoFormat),
				this.client.downloadAsBuffer(video, audioFormat)
			]);

			await Promise.all([fs.writeFile(videoPath, videoBuffer), fs.writeFile(audioPath, audioBuffer)]);
			await execAsync(`ffmpeg -y -i "${videoPath}" -i "${audioPath}" -c copy -movflags +faststart "${outputPath}"`);

			return await fs.readFile(outputPath);
		} finally {
			await Promise.allSettled([fs.remove(videoPath), fs.remove(audioPath), fs.remove(outputPath)]);
		}
	}

	toContainer(video, format, audioFormat = null) {
		const thumbnails = video.thumbnails || [];

		return {
			id: video.id,
			title: video.title,
			description: video.description,
			duration: video.durationSeconds,
			views: video.views,
			author: video.author,
			thumbnail: thumbnails[thumbnails.length - 1]?.url || thumbnails[0]?.url || '',
			format,
			audioFormat,
			download: format
				? () => (audioFormat ? this.mergeToBuffer(video, format, audioFormat) : this.client.downloadAsBuffer(video, format))
				: null
		};
	}

	async audio(query, options = {}) {
		try {
			const video = await this.client.getVideo(await this.resolveId(query));

			return this.toContainer(video, this.matchAudioFormat(video, options));
		} catch (error) {
			throw new YoutubeError(error.message || 'Unknown Error!');
		}
	}

	async video(query, options = {}) {
		try {
			const video = await this.client.getVideo(await this.resolveId(query));
			const format = this.matchVideoFormat(video, options);
			const audioFormat = format.audioChannels > 0 ? null : this.pickMatchingAudio(video, format);

			return this.toContainer(video, format, audioFormat);
		} catch (error) {
			throw new YoutubeError(error.message || 'Unknown Error!');
		}
	}

	async playlist(query) {
		try {
			return await this.client.getPlaylist(query);
		} catch (error) {
			throw new YoutubeError(error.message || 'Unknown Error!');
		}
	}

	async listFormats(query) {
		const video = await this.client.getVideo(await this.resolveId(query));

		return {
			title: video.title,
			formats: [...video.formats].map((format) => ({
				itag: format.itag,
				type: format.mimeType.split(';')[0],
				quality: format.qualityLabel || format.audioQuality || format.quality,
				hasAudio: format.audioChannels > 0,
				size: format.contentLength
			}))
		};
	}
}
