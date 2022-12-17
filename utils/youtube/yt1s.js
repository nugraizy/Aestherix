import fileSize from 'filesize-parser';
import yts from 'ytsr';

import { fetchJSON, isURL } from '../../helper/index.js';

const _apiIndex = 'https://yt1s.com/api/ajaxSearch/index';
const _apiConvert = 'https://yt1s.com/api/ajaxConvert/convert';

const isUrl = (url) =>
	url.match(
		new RegExp(/^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|&v(?:i)?=))([^#&?]*).*/, 'g'),
	);

/**
 * @typedef {{videoId: string, url: string, title: string, description: string | null, thumbnail: string, timestamp: string, uploaded: string, views: number, author: string, urlChannel: string}} YTSearchResults
 * @typedef {{filesizeF: string, filesize: number, dlLink: string, title: string, id: string}} YTScrapeResults
 */
/**
 * Scrape YouTube available downloader.
 * @param {string} url
 * @param {'mp3' | 'mp4'} type
 * @returns {Promise<YTScrapeResults>}
 * @throws {Error}
 */
const yt2 = async (url, type) =>
	new Promise(async (resolve, reject) => {
		try {
			if (!isUrl(url)) {
				return resolve({ error: 'Invalid URL' });
			}

			const datas = await fetchJSON(_apiIndex, {
				method: 'POST',
				body: `q=${encodeURIComponent(url)}&vt=home`,
				headers: {
					Accept: '*/*',
					'Content-Type': 'application/x-www-form-urlencoded',
					'X-Requested-With': 'XMLHttpRequest',
				},
			});

			const { k, size } =
				Object.values(datas.links[type]).filter((v) =>
					type == 'mp4' ? v.q == '480p' || v.q == '360p' : v.q == '128kbps' || v.q == `${128 / 2}kbps`,
				).length === 0
					? Object.values(datas.links[type])[Object.keys(datas.links[type]).length - 1]
					: Object.values(datas.links[type]).filter((v) =>
							type == 'mp4' ? v.q == '480p' || v.q == '360p' : v.q == '128kbps' || v.q == `${128 / 2}kbps`,
					  )[0]; /* eslint-disable-line */

			const data = await fetchJSON(_apiConvert, {
				method: 'POST',
				body: `vid=${datas.vid}&k=${encodeURIComponent(k)}`,
				headers: {
					Accept: 'application/json, text/plain, */*',
					'Content-Type': 'application/x-www-form-urlencoded',
				},
			});

			resolve({
				filesizeF: size || '0 B',
				filesize: fileSize(size || '0 B', { base: 2 }),
				dlLink: data.dlink,
				title: data.title,
				id: datas.vid,
			});
		} catch (e) {
			reject(e);
		}
	});

/**
 *
 * @param {string} query
 * @param {string | undefined} id
 * @returns {Promise<YTSearchResults>}
 * @throws {Error}
 */
export const ytsr2 = (query, id) =>
	new Promise(async (resolve, reject) => {
		try {
			const res = await yts(query);
			let data;

			if (id) {
				const filtered = res?.items?.find((v) => v.id === id);

				data = filtered ? filtered : res?.items?.[0];
			} else {
				data = res?.items?.[0];
			}

			if (!data) {
				reject(new Error('Result of the query is not found.'));
			}

			let {
				id: videoId,
				url,
				title,
				description,
				bestThumbnail: { url: thumbnail },
				duration: timestamp,
				uploadedAt: uploaded,
				views,
				author: { name: author, url: urlChannel },
			} = data;

			resolve({ videoId, url, title, description, thumbnail, timestamp, uploaded, views, author, urlChannel });
		} catch (e) {
			reject(e);
		}
	});

/**
 * Download YouTube video, Using either url or query.
 * @param {string} query
 * @returns {Promise<YTSearchResults & YTScrapeResults & {error?: string, internal?: false}}
 * @throws {Error}
 */
export const ytv2 = (query) =>
	new Promise(async (resolve, reject) => {
		try {
			if (isUrl(query)) {
				let res = await yt2(query, 'mp4');
				const container = res;

				res = await ytsr2(res.title, res.id);
				resolve({ ...container, ...res });
			} else if (isURL(query) && !isUrl(query)) {
				resolve({ error: 'Link YouTube tidak valid.', internal: false });
			} else {
				let res = await ytsr2(query, false);
				const url = `https://youtu.be/${res.videoId}`;
				const container = res;

				res = await yt2(url, 'mp4');
				resolve({ ...container, ...res });
			}
		} catch (e) {
			reject(e);
		}
	});

/**
 * Download YouTube audio, Using either url or query.
 * @param {string} query
 * @returns {Promise<YTSearchResults & YTScrapeResults & {error?: string, internal?: false}}
 * @throws {Error}
 */
export const yta2 = (query) =>
	new Promise(async (resolve, reject) => {
		try {
			if (isUrl(query)) {
				let res = await yt2(query, 'mp3');
				const container = res;

				res = await ytsr2(res.title, res.id);
				resolve({ ...container, ...res });
			} else if (isURL(query) && !isUrl(query)) {
				resolve({ error: 'Link YouTube tidak valid.', internal: false });
			} else {
				let res = await ytsr2(query, false);

				const url = `https://youtu.be/${res.videoId}`;
				const container = res;

				res = await yt2(url, 'mp3');
				resolve({ ...container, ...res });
			}
		} catch (e) {
			reject(e);
		}
	});
