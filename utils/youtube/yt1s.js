import fileSize from 'filesize-parser';
import yts from 'ytsr';

import { fetchJSON, isURL } from '../../helper/index.js';

const _apiIndex = 'https://yt1s.com/api/ajaxSearch/index';
const _apiConvert = 'https://yt1s.com/api/ajaxConvert/convert';

const isUrl = (url) =>
	url.match(
		new RegExp(/^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|&v(?:i)?=))([^#&?]*).*/, 'g'),
	);

const convertStreams = (vid, el) =>
	new Promise(async (resolve) => {
		const data = await fetchJSON(_apiConvert, {
			method: 'POST',
			body: `vid=${vid}&k=${encodeURIComponent(el.k)}`,
			headers: {
				Accept: 'application/json, text/plain, */*',
				'Content-Type': 'application/x-www-form-urlencoded',
			},
		});

		resolve({
			filesizeF: el.size,
			filesize: fileSize(el.size, { base: 2 }),
			quality: el.q,
			dlUrl: data.dlink,
		});
	});

export const downloaderYouTubeMain = (url, type) =>
	new Promise(async (resolve, reject) => {
		try {
			const data = await fetchJSON(_apiIndex, {
				method: 'POST',
				body: `q=${encodeURIComponent(url)}&vt=home`,
				headers: {
					Accept: '*/*',
					'Content-Type': 'application/x-www-form-urlencoded',
					'X-Requested-With': 'XMLHttpRequest',
					'User-Agent':
						'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.81 Safari/537.36',
				},
			});
			const rawData = (filter) =>
				Object.entries(data.links)
					.filter(filter)
					.map((v) => data.links[v[0]])
					.reduce((r, c) => Object.assign(r, c), [])
					.filter((v) => v.size !== '');

			const response = {
				title: data.title,
				id: data.vid,
			};
			if (type === 'mp4') {
				response.mp4 = await Promise.all(
					rawData((v) => !['mp3', 'm4a'].includes(v[0])).map((v) => convertStreams(data.vid, v)),
				);
			} else if (type === 'mp3') {
				response.mp3 = await Promise.all(
					rawData((v) => ['mp3', 'm4a'].includes(v[0])).map((v) => convertStreams(data.vid, v)),
				);
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
				author: { name: author, url: urlChannel },
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
