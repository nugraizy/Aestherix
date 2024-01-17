import ytdl from 'ytdl-core';
import { Client } from 'undici';

import { CACHE_MANAGER, constant, extractVideoId, filterQualities } from './utils.js';
import { isYoutubeURL, isURL } from '../modules/index.js';
import { searchYoutube } from './y2mate.js';

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
