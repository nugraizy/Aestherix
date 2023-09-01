import axios from 'axios';

import { parseCookie, parseSearch } from './utils.js';

const _api = 'https://bandcamp.com/api/bcsearch_public_api/1/autocomplete_elastic';

/**
 * Parsed result definition.
 * @typedef {Object[]} ResultsBandcamp
 * @property {string} ResultsBandcamp[].bandId
 * @property {string} ResultsBandcamp[].bandName
 * @property {string} ResultsBandcamp[].title
 * @property {(string|null)} ResultsBandcamp[].albumName
 * @property {(string|null)} ResultsBandcamp[].albumId
 * @property {string} ResultsBandcamp[].urlBase
 * @property {string} ResultsBandcamp[].thumbnailUrl
 */
/**
 *
 * @param {string} keyword search keyword of the band/track.
 * @returns {Promise<ResultsBandcamp> & Promise<{error?: string}>}
 * @throws {Promise<Error>}
 */
export const searchBandcamp = (keyword) =>
	new Promise(async (resolve, reject) => {
		try {
			const { headers } = await axios({ url: 'https://bandcamp.com/', method: 'GET' });
			const { data } = await axios({
				url: _api,
				method: 'POST',
				data: { search_text: keyword, search_filter: '', full_page: true, fan_id: null } /* eslint-disable-line */,
				headers: {
					Cookie: parseCookie(headers['set-cookie']),
					'Content-Type': 'application/json; charset=UTF-8',
					'X-Requested-With': 'XMLHttpRequest',
					'User-Agent':
						'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.81 Safari/537.36',
					Host: 'bandcamp.com',
					Origin: 'https://bandcamp.com',
					Referer: 'https://bandcamp.com/'
				}
			});

			if (data?.auto?.results?.length === 0) {
				return resolve({ error: 'Not Found' });
			}

			const { results } = data.auto;

			resolve(parseSearch(results));
		} catch (err) {
			reject(err);
		}
	});
