import asyncRetry from 'async-retry';
import { Innertube, Platform, UniversalCache, Utils } from 'youtubei.js';

import { isURL, isYoutubeURL } from '../modules/index.js';
import { extractVideoId } from './utils.js';

Platform.shim.eval = async (data, env) => {
	const properties = [];

	if (env.n) {
		properties.push(`n: exportedVars.nFunction("${env.n}")`);
	}

	if (env.sig) {
		properties.push(`sig: exportedVars.sigFunction("${env.sig}")`);
	}

	const code = `${data.output}\nreturn { ${properties.join(', ')} }`;

	return new Function(code)();
};

const youtube = await Innertube.create({ cache: new UniversalCache(true, './cache'), generate_session_locally: true });  

class YoutubeiError extends Error {
	constructor(message, info) {
		super(message);

		if (info) {
			this.info = info;
		}
	}
}

export class YouTubei {
	constructor() {
		this.yt = youtube;
	}
	async tryWithRetry(fn) {
		return await asyncRetry(fn, {
			maxTimeout: 5000
		});
	}

	async getBufferFromReadable(stream) {
		const chunks = [];
		let totalLength = 0;

		for await (const chunk of Utils.streamToIterable(stream)) {
			chunks.push(chunk);
			totalLength += chunk.length;
		}

		const buffer = new Uint8Array(totalLength);
		let offset = 0;

		for (const chunk of chunks) {
			buffer.set(chunk, offset);
			offset += chunk.length;
		}

		return buffer;
	}

	async download(id, type) {
		const { basic_info: basicInfo } = await this.yt.getBasicInfo(id);
		const stream = await this.yt.download(id, { type, ...(type === 'video' ? { quality: 'best' } : {}) });

		const container = {
			id: basicInfo.id,
			title: basicInfo.title,
			duration: basicInfo.duration,
			keywords: basicInfo.keywords,
			description: basicInfo.short_description,
			views: basicInfo.view_count,
			thumbnail: basicInfo.thumbnail[0].url,

			...(stream
				? {
						download: () => {
							return this.getBufferFromReadable(stream);
						}
					}
				: {})
		};

		return container;
	}

	audio(query) {
		return new Promise(async (resolve, reject) => {
			try {
				if (!(isURL(query) && isYoutubeURL(query))) {
					const search = await this.yt.search(query);

					if (!search.results.length) {
						reject(new YoutubeiError('Container has no results'));
					}

					query = `https://youtu.be/${search.results[0].id}`;
				}

				const id = extractVideoId(query);

				resolve(await this.download(id, 'audio'));
			} catch (error) {
				reject(new YoutubeiError(error.message || 'Unknown Error!'));
			}
		});
	}

	video(query) {
		return new Promise(async (resolve, reject) => {
			try {
				if (!(isURL(query) && isYoutubeURL(query))) {
					const search = await this.yt.search(query);

					if (!search.results.length) {
						reject(new YoutubeiError('Container has no results'));
					}

					query = `https://youtu.be/${search.results[0].id}`;
				}

				const id = extractVideoId(query);

				resolve(await this.download(id, 'video+audio'));
			} catch (error) {
				reject(new YoutubeiError(error.message || 'Unknown Error!'));
			}
		});
	}
}
