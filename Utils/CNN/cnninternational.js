import moment from 'moment-timezone';

import { fetchJSON } from '../../Helper/index.js';

moment.tz.setDefault('Asia/Jakarta').locale('id');

const parse = (arr) => {
	return arr.map((v) => {
		return {
			title: v.headline,
			body: v.body,
			published: moment(v.firstPublishDate).format('HH:mm:ss DD/MM/YYYY'),
			image: v.thumbnail || 'No thumbnail',
			link: v.url,
		};
	});
};

export const cnninternational = (keyword) =>
	new Promise(async (resolve, reject) => {
		try {
			const { result: json } = await fetchJSON(`https://search.api.cnn.com/content?${keyword ? `?q=${keyword}&` : ''}size=10`, {
				method: 'GET',
			});

			if (!json) {
				return resolve({ error: 'data not found' });
			}

			resolve(parse(json));
		} catch (err) {
			reject(err);
		}
	});
