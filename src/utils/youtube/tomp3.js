import fileSize from 'filesize-parser';
import yts from 'ytsr';

import { fetchJSON, isURL } from '../modules/index.js';

const _apiIndex = 'https://tomp3.cc/api/ajax/search';
const _apiConvert = 'https://tomp3.cc/api/ajax/convert';

const isUrl = (url) =>
	url.match(
		new RegExp(/^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|&v(?:i)?=))([^#&?]*).*/, 'g')
	);

const convertStreams = (vid, el) =>
	new Promise(async (resolve) => {
		const data = await fetchJSON(_apiConvert, {
			method: 'POST',
			body: `vid=${vid}&k=${encodeURIComponent(el.k)}`,
			headers: {
				Accept: 'application/json, text/plain, */*',
				'Content-Type': 'application/x-www-form-urlencoded',
				'user-agent':
					'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 YaBrowser/23.1.5.750 (beta) Yowser/2.5 Safari/537.36',
				'x-requested-with': 'XMLHttpRequest'
			}
		});

		resolve({
			filesizeF: (el.size !== 'MB' && el.size) || '0MB',
			filesize: (el.size !== 'MB' && fileSize(el.size, { base: 2 })) || '0MB',
			quality: el.q,
			dlUrl: data.dlink
		});
	});

export const downloaderYouTubeMain = (url, type) =>
	new Promise(async (resolve, reject) => {
		try {
			const data = await fetchJSON(_apiIndex, {
				method: 'POST',
				body: `query=${encodeURIComponent(url)}&vt=downloader`,
				headers: {
					Accept: '*/*',
					'Content-Type': 'application/x-www-form-urlencoded',
					'X-Requested-With': 'XMLHttpRequest',
					'User-Agent':
						'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.81 Safari/537.36'
				}
			});

			const rawData = Object.values(Object.entries(data.links).filter((v) => [type].includes(v[0]))[0][1]).filter(
				(v) => ![''].includes(v.size)
			);

			const response = {
				title: data.title,
				id: data.vid
			};

			if (type === 'mp4') {
				response.mp4 = await Promise.all(rawData.map((v) => convertStreams(data.vid, v)));
			} else if (type === 'mp3') {
				response.mp3 = await Promise.all(rawData.map((v) => convertStreams(data.vid, v)));
			}

			resolve(response);
		} catch (e) {
			reject(e);
		}
	});

export const searchYoutube = (query, id) =>
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
				author: { name: author, url: urlChannel }
			} = data;

			resolve({ videoId, url, title, description, thumbnail, timestamp, uploaded, views, author, urlChannel });
		} catch (e) {
			reject(e);
		}
	});

export const youtubeMainDownload = (query, type) =>
	new Promise(async (resolve, reject) => {
		try {
			if (isUrl(query)) {
				const result = await downloaderYouTubeMain(query, type);
				const response = await searchYoutube(result.title, result.id);

				resolve({ title: result.title, ...response, ...(type === 'mp3' ? { mp3: result.mp3 } : { mp4: result.mp4 }) });
			} else if (isURL(query) && !isUrl(query)) {
				resolve({ error: true });
			} else {
				const result = await searchYoutube(query, false);
				const url = `https://youtu.be/${result.videoId}`;

				const response = await downloaderYouTubeMain(url, type);

				resolve({ title: response.title, ...result, ...(type === 'mp3' ? { mp3: response.mp3 } : { mp4: response.mp4 }) });
			}
		} catch (e) {
			reject(e);
		}
	});
