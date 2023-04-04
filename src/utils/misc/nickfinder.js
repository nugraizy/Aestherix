import axios from 'axios';

import { cheerioLOAD } from '../modules/index.js';

const _api = (query) => `https://nickfinder.com/${query}`;

/**
 * Find nickname on nickfinder.com.
 * @param {string} query
 * @returns {Promise<string[] & {error?: string}>}
 * @throws {Error}
 */
export const nickname = (query) =>
	new Promise(async (resolve, reject) => {
		try {
			const { data } = await axios.get(_api(query), {
				validateStatus: () => true
			});

			const $ = cheerioLOAD(data);

			const is404 = $('h1:contains(404 – Nickname not found)').text() === '404 – Nickname not found';

			if (is404) {
				resolve({ error: 'Nickname not found. Please try with another query.' });
			}

			const container = $('.one_variant')
				.get()
				.map((element) => $(element).find('.copy_variant').text());

			resolve(container);
		} catch (error) {
			reject(error);
		}
	});
