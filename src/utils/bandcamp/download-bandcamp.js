import axios from 'axios';

import { cheerioLOAD } from '../modules/index.js';

const parse = (obj) => ({ title: obj?.trackinfo?.[0]?.title || null, mp3: obj?.trackinfo?.[0]?.file?.['mp3-128'] || null });

/**
 * Parsed result definition.
 * @typedef {Object} ResultsBandcamp
 * @property {(string|null)} ResultsBandcamp.title
 * @property {(string|null)} ResultsBandcamp.mp3
 */
/**
 * Download bandcamp tracks.
 * @param {string} url valid bandcamp url.
 * @returns {Promise<ResultsBandcamp> & Promise<{error?: string}>}
 * @throws {Promise<Error>}
 */
export const downloadBandcamp = (url) =>
	new Promise(async (resolve, reject) => {
		try {
			const { data } = await axios({ url, method: 'GET' });
			const $ = cheerioLOAD(data);
			const jsonRaw = JSON.parse(
				$('script[src="https://s4.bcbits.com/bundle/bundle/1/tralbum_head-65e4aa096458ae9743f9f82d6924e998.js"]').attr(
					'data-tralbum'
				)
			);

			const jsonParsed = parse(jsonRaw);

			if (!jsonParsed.mp3) {
				return resolve({ error: 'No data found' });
			}

			resolve(jsonParsed);
		} catch (err) {
			reject(err);
		}
	});
