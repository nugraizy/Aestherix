import dayjs from 'dayjs';

import { fetchJSON } from '../../helper/index.js';

const _api = 'https://api.onlinevideoconverter.pro/api/convert';

export const fbDl = (url) =>
	new Promise(async (resolve, reject) => {
		try {
			const data = await fetchJSON(_api, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url }),
			});

			if (data.code === 102) {
				return resolve({ error: data.message });
			}

			let { url: urls, subname } =
				data.url.filter((x) => x.subname === 'HD')?.[0] ?? data.url.filter((x) => x.subname === 'SD')?.[0] ?? data.url[0];
			let { duration, title } = data.meta;
			let { timestamp: datePosted } = data;

			resolve({
				url: urls,
				duration,
				isVideo: title !== 'Photo',
				resolution: subname,
				...(duration ? { duration } : {}),
				datePosted: dayjs(datePosted * 1000).format('DD/MM/YYYY HH:mm:ss'),
				rawDatePosted: datePosted * 1000,
			});
		} catch (err) {
			reject(err);
		}
	});
