import dayjs from 'dayjs';

import { fetchJSON } from '../../helper/index.js';

const parse = (arr) => {
	return arr.map((v) => {
		return {
			title: v.headline,
			body: v.body,
			published: dayjs(v.firstPublishDate).format('HH:mm:ss DD/MM/YYYY'),
			image: v.thumbnail || 'No thumbnail',
			link: v.url,
		};
	});
};

/**
 * Parsed result definition.
 * @typedef {Object[]} ResultsCNN
 * @property {string} ResultsCNN[].title
 * @property {string} ResultsCNN[].body
 * @property {(string|number)} ResultsCNN[].published
 * @property {string} ResultsCNN[].image
 * @property {string} ResultsCNN[].link
 */

/**
 * Find news from CNN Internationals.
 * @param {string} keyword search specific news from CNN.
 * @returns {Promise<ResultsCNN> & Promise<{error?: string}>}
 */
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
