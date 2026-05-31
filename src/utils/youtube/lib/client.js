import { HttpClient } from './http-client.js';
import { Clients, DefaultClient, prepareInnertubeContext, prepareInnertubePlaylistData } from './clients.js';
import { Video } from './video.js';
import { Playlist } from './playlist.js';
import { Decipher } from './decipher.js';
import { PlayerCache } from './player-cache.js';
import { VideoID } from './video-id.js';
import { Size10Mb, Utils } from './utils.js';
import {
	ErrCipherNotFound,
	ErrLoginRequired,
	ErrNoFormat,
	ErrNotPlayableInEmbed,
	ErrUnexpectedStatusCode,
	YoutubeError
} from './errors.js';

const basejsPattern = /(\/s\/player\/[A-Za-z0-9_-]+\/[A-Za-z0-9._/-]*\/base\.js)/;
const watchUrl = (id) => `https://www.youtube.com/watch?v=${id}&bpctr=9999999999&has_verified=1`;

function textOf(node) {
	if (!node) {
		return '';
	}

	if (typeof node === 'string') {
		return node;
	}

	if (node.simpleText) {
		return node.simpleText;
	}

	if (Array.isArray(node.runs)) {
		return node.runs.map((run) => run.text || '').join('');
	}

	return '';
}

function collectVideoRenderers(node, out, limit) {
	if (!node || typeof node !== 'object' || out.length >= limit) {
		return;
	}

	const renderer = node.videoRenderer || node.compactVideoRenderer;

	if (renderer?.videoId) {
		const thumbnails = renderer.thumbnail?.thumbnails || [];

		out.push({
			id: renderer.videoId,
			type: 'video',
			title: textOf(renderer.title),
			url: `https://youtu.be/${renderer.videoId}`,
			author: textOf(renderer.ownerText) || textOf(renderer.longBylineText) || textOf(renderer.shortBylineText),
			duration: textOf(renderer.lengthText),
			publishedTime: textOf(renderer.publishedTimeText),
			views: Number(textOf(renderer.viewCountText).replace(/\D/g, '')) || 0,
			thumbnail: thumbnails[thumbnails.length - 1]?.url || '',
			thumbnails
		});
	}

	for (const key of Object.keys(node)) {
		collectVideoRenderers(node[key], out, limit);
	}
}

export class Client extends HttpClient {
	constructor(options = {}) {
		super(options);
		this.client = options.client || (this.cookies ? Clients.Web : DefaultClient);
		this.chunkSize = options.chunkSize || Size10Mb;
		this.maxRoutines = options.maxRoutines || 10;
		this.playerCache = new PlayerCache();
	}

	assureClient() {
		if (!this.client) {
			this.client = DefaultClient;
		}
	}

	async getVideo(url) {
		const id = VideoID.extract(url);

		return this.videoFromID(id);
	}

	async videoFromID(id) {
		this.assureClient();

		const body = await this.videoDataByInnertube(id);
		const video = new Video(id);

		let parseErr = null;

		try {
			video.parseVideoInfo(body);
		} catch (err) {
			parseErr = err;
		}

		if (!parseErr) {
			const html = await this.httpGetBody(watchUrl(id));
			const fromHtml = new Video(id);

			fromHtml.parseVideoPage(html);
			video.publishDate = fromHtml.publishDate;
			return video;
		}

		if (parseErr instanceof ErrNotPlayableInEmbed) {
			const html = await this.httpGetBody(watchUrl(id));

			video.parseVideoPage(html);
			return video;
		}

		if (parseErr instanceof ErrLoginRequired) {
			const bodyEmbed = await this.videoDataByInnertube(id, Clients.Embedded);

			video.parseVideoInfo(bodyEmbed);
			return video;
		}

		throw parseErr;
	}

	async videoDataByInnertube(id, clientInfo = this.client) {
		const data = {
			videoId: id,
			context: prepareInnertubeContext(clientInfo),
			contentCheckOk: true,
			racyCheckOk: true,
			playbackContext: { contentPlaybackContext: { html5Preference: 'HTML5_PREF_WANTS' } },
			params: ''
		};

		return this.httpPostBody(`https://www.youtube.com/youtubei/v1/player?key=${clientInfo.key}`, data);
	}

	async getPlaylist(url) {
		this.assureClient();
		const id = Playlist.extractID(url);
		const data = prepareInnertubePlaylistData(id, false, Clients.Web);
		const body = await this.httpPostBody(`https://www.youtube.com/youtubei/v1/browse?key=${Clients.Web.key}`, data);
		const playlist = new Playlist(id);

		await playlist.parsePlaylistInfo(this, body, Clients.Web);
		return playlist;
	}

	async videoFromPlaylistEntry(entry) {
		return this.videoFromID(entry.id);
	}

	async search(query, { limit = 20 } = {}) {
		this.assureClient();

		const data = { context: prepareInnertubeContext(Clients.Web), query };
		const body = await this.httpPostBody(`https://www.youtube.com/youtubei/v1/search?key=${Clients.Web.key}`, data);
		const json = JSON.parse(body);
		const results = [];

		collectVideoRenderers(json, results, limit);
		return results;
	}

	async getStreamURL(video, format) {
		if (!format) {
			throw new ErrNoFormat();
		}

		this.assureClient();

		if (format.url) {
			if (this.client.androidVersion > 0) {
				return format.url;
			}

			return this.unThrottle(video.id, format.url);
		}

		if (!format.cipher) {
			throw new ErrCipherNotFound();
		}

		return this.decipherURL(video.id, format.cipher);
	}

	async unThrottle(videoID, urlString) {
		const config = await this.getPlayerConfig(videoID);

		return new Decipher(config).unThrottleURL(urlString);
	}

	async decipherURL(videoID, cipher) {
		const config = await this.getPlayerConfig(videoID);

		return new Decipher(config).decipherURL(cipher);
	}

	async getPlayerConfig(videoID) {
		const embedBody = await this.httpGetBody(`https://youtube.com/embed/${videoID}?hl=en`);
		const match = basejsPattern.exec(embedBody);

		if (!match) {
			throw new YoutubeError('unable to find basejs URL in playerConfig');
		}

		const playerPath = match[1];
		const cached = this.playerCache.get(playerPath);

		if (cached) {
			return cached;
		}

		const config = await this.httpGetBody(`https://youtube.com${playerPath}`);

		this.playerCache.set(playerPath, config);
		return config;
	}

	async getStream(video, format) {
		const url = await this.getStreamURL(video, format);
		const res = await this.httpGet(url, { responseType: 'stream' });
		const contentLength = format.contentLength || parseInt(res.headers['content-length'], 10) || 0;

		return { stream: res.data, contentLength };
	}

	async downloadChunk(url, start, end) {
		const sep = url.includes('?') ? '&' : '?';
		const res = await this.httpClient.request({
			method: 'GET',
			url: `${url}${sep}range=${start}-${end}`,
			responseType: 'arraybuffer',
			headers: { 'User-Agent': this.client.userAgent },
			validateStatus: () => true
		});

		if (res.status !== 200 && res.status !== 206) {
			throw new ErrUnexpectedStatusCode(res.status);
		}

		const data = Buffer.from(res.data);
		const expected = end - start + 1;

		if (data.length !== expected) {
			throw new YoutubeError(`chunk at ${start} has invalid size: expected=${expected} actual=${data.length}`);
		}

		return data;
	}

	async download(video, format, outputPath, options = {}) {
		const url = await this.getStreamURL(video, format);
		const total = format.contentLength;
		const fs = await import('node:fs');

		if (!total) {
			const res = await this.httpGet(url, { responseType: 'stream' });

			await new Promise((resolve, reject) => {
				const file = fs.createWriteStream(outputPath);

				res.data.on('error', reject);
				file.on('error', reject);
				file.on('finish', resolve);
				res.data.pipe(file);
			});
			return outputPath;
		}

		const chunkSize = options.chunkSize || this.chunkSize;
		const chunks = Utils.getChunks(total, chunkSize);
		const concurrency = Math.min(options.concurrency || this.maxRoutines, chunks.length);
		const handle = await fs.promises.open(outputPath, 'w');
		let cursor = 0;

		const worker = async () => {
			while (cursor < chunks.length) {
				const { start, end } = chunks[cursor++];
				const data = await this.downloadChunk(url, start, end);

				await handle.write(data, 0, data.length, start);
			}
		};

		try {
			await Promise.all(Array.from({ length: concurrency }, worker));
		} finally {
			await handle.close();
		}
		return outputPath;
	}

	async downloadAsBuffer(video, format, options = {}) {
		const url = await this.getStreamURL(video, format);
		const total = format.contentLength;

		if (!total) {
			const res = await this.httpGet(url, { responseType: 'stream' });
			const parts = [];

			for await (const chunk of res.data) {
				parts.push(chunk);
			}

			return Buffer.concat(parts);
		}

		const chunkSize = options.chunkSize || this.chunkSize;
		const chunks = Utils.getChunks(total, chunkSize);
		const concurrency = Math.min(options.concurrency || this.maxRoutines, chunks.length);
		const buffer = Buffer.allocUnsafe(total);
		let cursor = 0;

		const worker = async () => {
			while (cursor < chunks.length) {
				const { start, end } = chunks[cursor++];
				const data = await this.downloadChunk(url, start, end);

				data.copy(buffer, start);
			}
		};

		await Promise.all(Array.from({ length: concurrency }, worker));
		return buffer;
	}
}
