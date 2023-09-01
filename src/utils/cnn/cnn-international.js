import { fetchJSON } from '../modules/index.js';
import { parseInternational } from './utils.js';

const _api = (input) => `https://search.api.cnn.com/content?${input ? `?q=${input}&` : ''}size=10`;

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
			const { result: json } = await fetchJSON(_api(keyword), {
				method: 'GET'
			});

			if (!json) {
				return resolve({ error: 'data not found' });
			}

			resolve(parseInternational(json));
		} catch (err) {
			reject(err);
		}
	});
