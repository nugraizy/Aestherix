/* eslint-disable camelcase */
import yts from 'yt-search';

import { isURL, fetchJSON } from '../modules/index.js';
import { Cache } from '../../helper/modules/cache.js';

const ajaxUrl = 'https://www.y2mate.com/mates/en865/analyzeV2/ajax';
const convertUrl = 'https://www.y2mate.com/mates/convertV2/index';

const isUrl = (url) =>
	url.match(
		new RegExp(/^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|&v(?:i)?=))([^#&?]*).*/, 'g')
	);

const cache = new Cache();

const req = async (url, formdata) => {
	return await fetchJSON(url, {
		body: new URLSearchParams(formdata),
		method: 'POST',
		headers: {
			'user-agent':
				'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 YaBrowser/23.1.5.750 (beta) Yowser/2.5 Safari/537.36',
			'x-requested-with': 'XMLHttpRequest',
			'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
		}
	});
};

const convert = async (vid, k) => {
	const data = await req(convertUrl, {
		vid,
		k
	});

	return data.dlink;
};

const yt = (url, type) =>
	new Promise(async (resolve, reject) => {
		try {
			const data = await req(ajaxUrl, {
				k_query: url,
				k_page: 'home',
				hl: 'en',
				q_auto: 0
			});

			const obj = Object.entries(data.links[type]);

			const filterType = type === 'mp3' ? '128kbps' : '480p';

			let media = obj.find((v) => filterType.includes(v[1].q));

			if (!media) {
				media = obj.find((v) => v[1].q === '360p');
			}

			media = media[1];

			resolve({
				title: `${data.a} ${data.title}`,
				resolution: media.q,
				id: data.vid,
				file: await convert(data.vid, media.k)
			});
		} catch (error) {
			reject(error);
		}
	});

export const searchYoutube = (query, id, all) =>
	new Promise(async (resolve, reject) => {
		try {
			const res = id
				? await yts({
						videoId: id
				  }) // eslint-disable-line
				: all
				? await yts({ search: query })
				: (await yts(query)).videos?.[0];

			if (!res) {
				reject(new Error('Result of the query is not found.'));
			}

			if (all) {
				return resolve(res.all);
			}

			let {
				videoId,
				url,
				title,
				description,
				image: thumbnail,
				duration: { timestamp, seconds },
				ago: uploaded,
				views,
				author: { name: author, url: urlChannel }
			} = res;

			resolve({ videoId, url, title, description, timestamp, seconds, uploaded, views, author, thumbnail, urlChannel });
		} catch (e) {
			reject(e);
		}
	});

export const youtubeMainDownload = (query, type) =>
	new Promise(async (resolve, reject) => {
		if (cache.has(`${query}-${type}`)) {
			resolve(cache.get(`${query}-${type}`));
		}

		try {
			let container;

			if (isURL(query) && !isUrl(query)) {
				resolve({ error: 'The url you put is not a valid YouTube URL.' });
			}

			if (isUrl(query)) {
				const result = await yt(query, type);
				const response = await searchYoutube(result.title, result.id);

				container = { title: result.title, ...response, resolution: result.resolution, link: result.file };
			} else {
				const result = await searchYoutube(query, false);
				const url = `https://youtu.be/${result.videoId}`;

				const response = await yt(url, type);

				container = { title: response.title, ...result, resolution: response.resolution, link: response.file };
			}

			cache.set(`${query}-${type}`, container);

			resolve(container);
		} catch (e) {
			reject(e);
		}
	});
