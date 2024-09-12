import ytdl from 'ytdl-core';
import { Client } from 'undici';
import { Innertube, Session, UniversalCache, Utils } from 'youtubei.js';
import asyncRetry from 'async-retry';

import { CACHE_MANAGER, constant, extractVideoId, filterQualities } from './utils.js';
import { isYoutubeURL, isURL } from '../modules/index.js';
import { searchYoutube } from './y2mate.js';

let YOUTUBE_COOKIE = process.env.YOUTUBE_COOKIE;

const yt = await Innertube.create({
	cache: new UniversalCache(false),
	generate_session_locally: true, // eslint-disable-line
	...(YOUTUBE_COOKIE ? { cookie: YOUTUBE_COOKIE } : {})
});

class YoutubeiError extends Error {
	constructor(message, info) {
		super(message);

		if (info) {
			this.info = info;
		}
	}
}

class Requests {
	#headers = {
		'User-Agent':
			'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 YaBrowser/23.1.5.750 (beta) Yowser/2.5 Safari/537.36',
		'X-Requested-With': 'XMLHttpRequest',
		'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
	};

	/**
	 * @param {'v1' | 'v2'} version
	 */
	constructor(version = 'v1') {
		this._client = new Client(constant[version].urlBase);

		/**
		 * @param {string} url
		 * @returns {Promise<Dispatcher.ResponseData['body']>}
		 */
		this.get = async (url) => {
			url = new URL(url);
			const client = new Client(url.origin);

			return (
				await client.request({
					path: url.pathname + url.search,
					method: 'GET'
				})
			).body;
		};

		/**
		 * @param {string} form
		 * @returns {Promise<Dispatcher.ResponseData}
		 */
		this.ajax = async (form) =>
			this._client.request({
				path: constant[version].ajax.path,
				body: form,
				method: 'POST',
				headers: this.#headers
			});

		/**
		 * @param {string} form
		 * @returns {Promise<Dispatcher.ResponseData}
		 */
		this.search = async (form) =>
			this._client.request({
				path: constant[version].search.path,
				body: form,
				method: 'POST',
				headers: this.#headers
			});

		/**
		 * @param {string} form
		 * @returns {Promise<Dispatcher.ResponseData}
		 */
		this.convert = async (form) =>
			this._client.request({
				path: constant[version].convert.path,
				body: form,
				method: 'POST',
				headers: this.#headers
			});
	}
}

export default class YouTube {
	#client;
	#rawDownloadAPI;
	#detailed;
	#search;
	#fetchDetailedInfo;
	#createConvertForm;
	#createSearchForm;

	/**
	 * @param {'v1' | 'v2'} version
	 */
	constructor(version = 'v1') {
		this.version = version;
		this.#client = new Requests(this.version);

		/**
		 * @typedef {ytdl.MoreVideoDetails & {download: (format: string) => Promise<ArrayBuffer>}} Detailed
		 * @param {string} query
		 * @param {boolean} isQueryUrl
		 * @returns {Promise<Detailed>}
		 */
		this.#detailed = async (query, isQueryUrl) => {
			try {
				const id = isQueryUrl ? extractVideoId(query) : query;
				const cachedDetails = CACHE_MANAGER.get(id);

				if (cachedDetails) {
					return {
						...cachedDetails.videoDetails,
						download: async (format) => (await this.#rawDownloadAPI(query, format)).arrayBuffer()
					};
				}

				const info = isQueryUrl ? await ytdl.getInfo(query) : await this.#fetchDetailedInfo(query);
				const { videoDetails } = info;

				CACHE_MANAGER.set(videoDetails.videoId, {
					...videoDetails,
					download: async (format) => {
						const { file } = await this.#rawDownloadAPI(query, format);

						return (await this.#client.get(file)).arrayBuffer();
					}
				});

				return {
					...videoDetails,
					download: async (format) => {
						const { file } = await this.#rawDownloadAPI(videoDetails.video_url, format);

						return (await this.#client.get(file)).arrayBuffer();
					}
				};
			} catch (error) {
				throw new Error(error.message);
			}
		};

		this.#fetchDetailedInfo = async (query) => {
			const form = new URLSearchParams(constant[this.version].search.form);

			if (this.version === 'v1') {
				form.set('k_query', query);
			} else if (this.version === 'v2') {
				form.set('query', query);
			}

			const data = await this.#client.search(form.toString());
			const body = await data.body.json();
			const [{ v }] = constant[this.version].search.parser(body);

			return ytdl.getInfo(`https://www.youtube.com/watch?v=${v}`);
		};

		/**
		 * @param {string} query
		 * @returns {Promise<Detailed[]>}
		 */
		this.#search = async (query, noDetail) => {
			try {
				const isQueryUrl = isURL(query) && isYoutubeURL(query);

				if (CACHE_MANAGER.has(`search:${query}`)) {
					return CACHE_MANAGER.get(`search:${query}`);
				}

				if (isQueryUrl) {
					const detail = await this.#detailed(query, true);

					CACHE_MANAGER.set(`search:${query}`, [detail]);
					return [detail];
				}

				const form1 = this.#createSearchForm(query);
				const data1 = await this.#client.search(form1.toString());
				const body = await data1.body.json();

				const data2 = constant[this.version].search.parser(body);

				if (noDetail) {
					CACHE_MANAGER.set(`search:${query}`, data2);
					return data2;
				}

				const promises = await Promise.all(data2.map(({ v }) => this.#detailed(`https://www.youtube.com/watch?v=${v}`, true)));

				CACHE_MANAGER.set(`search:${query}`, promises);

				return promises;
			} catch (error) {
				throw new Error('Error processing search: ' + error.message);
			}
		};

		this.#createSearchForm = (query, format) => {
			const form = new URLSearchParams(constant[this.version].search.form);

			if (this.version === 'v1') {
				form.set('k_query', query);
			} else if (this.version === 'v2') {
				form.set('query', query);

				if (format) {
					form.set('vt', format);
				}
			}

			return form;
		};

		/**
		 *
		 * @param {string} query
		 * @param {'mp3' | 'mp4'} format
		 * @returns {Promise<{ title: string, resolution: string, size: string, file: string, download: Detailed['download'] }>}
		 * @throws {Error}
		 */
		this.#rawDownloadAPI = async (query, format = 'mp3') => {
			try {
				const isQueryUrl = isURL(query) && isYoutubeURL(query);

				if (!isYoutubeURL(query) && isURL(query)) {
					throw new Error('Invalid URL');
				}

				const id = isQueryUrl ? extractVideoId(query) : query;
				const cachedDownload = CACHE_MANAGER.get(`download:${id}:${format}`);

				if (cachedDownload) {
					const { video, vid } = cachedDownload;

					const form = this.#createConvertForm(vid, video.k);
					const convert = await this.#client.convert(form.toString());
					const { title, file } = constant[this.version].convert.parser(await convert.body.json());

					return { title, resolution: video.quality, size: video.size, file, download: () => this.#client.get(file) };
				}

				const form1 = this.#createSearchForm(query, format);
				const data1 = isQueryUrl ? await this.#client.ajax(form1.toString()) : await this.#client.search(form1.toString());
				const body = await data1.body.json();
				const data2 = isQueryUrl ? constant[this.version].ajax.parser(body) : constant[this.version].search.parser(body);

				let container = data2;

				if (!isQueryUrl) {
					const form2 = this.#createSearchForm(`https://www.youtube.com/watch?v=${data2[0].v}`, format);
					const ajax = await this.#client.ajax(form2.toString());

					container = constant[this.version].ajax.parser(await ajax.body.json());

					const video = filterQualities(container.items, format);

					CACHE_MANAGER.set(`download:${query}:${format}`, { video, vid: container.vid });
				}

				const { vid, items } = container;
				const video = filterQualities(items, format);

				if (!video) {
					return {
						error: 'No Media found'
					};
				}

				const form3 = this.#createConvertForm(vid, video.k);
				const convert = await this.#client.convert(form3.toString());
				const { title, file } = constant[this.version].convert.parser(await convert.body.json());

				CACHE_MANAGER.set(`download:${vid}:${format}`, { video, vid });

				return {
					title,
					resolution: video.quality,
					size: video.size,
					file,
					download: async () => await (await this.#client.get(file)).arrayBuffer()
				};
			} catch (error) {
				console.log(error);
				throw new Error('Error processing download: ' + error.message);
			}
		};

		this.#createConvertForm = (vid, k) => {
			const form = new URLSearchParams(constant[this.version].convert.form);

			form.set('vid', vid);
			form.set('k', k);
			return form;
		};

		this.core = {
			search: (query, noDetail) => {
				if (noDetail) {
					return this.#search(query, true);
				}

				return searchYoutube(query, null, true);
			},
			video: {
				download: (query) => this.#rawDownloadAPI(query, 'mp4'),
				search: this.#search
			},

			audio: {
				download: (query) => this.#rawDownloadAPI(query, 'mp3'),
				search: this.#search
			}
		};
	}
}

export class YouTubei {
	constructor() {
		this.yt = yt;
		this.refreshedAt = +new Date();
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

	async shouldRefreshInstance() {
		const session = new Session(
			this.yt.session.context,
			this.yt.session.key,
			this.yt.session.api_version,
			this.yt.session.account_index,
			this.yt.session.player,
			YOUTUBE_COOKIE,
			this.yt.session.http.fetch,
			this.yt.session.cache
		);

		if (session.logged_in) {
			if (session.oauth.shouldRefreshToken()) {
				await session.oauth.refreshAccessToken();

				this.yt = new Innertube(session);
			}
		}
	}

	async download(id, type) {
		const { basic_info: basicInfo } = await yt.getBasicInfo(id);
		const stream = await yt.download(id, { type, ...(type === 'video' ? { quality: 'best' } : {}) });

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
				  } // eslint-disable-line
				: {})
		};

		return container;
	}

	audio(query) {
		return new Promise(async (resolve, reject) => {
			try {
				await this.shouldRefreshInstance();

				if (!(isURL(query) && isYoutubeURL(query))) {
					const search = await yt.search(query);

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
				await this.shouldRefreshInstance();

				if (!(isURL(query) && isYoutubeURL(query))) {
					const search = await yt.search(query);

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
