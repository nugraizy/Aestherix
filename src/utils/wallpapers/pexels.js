import { fetchJSON } from '../modules/index.js';

const TOKEN = process.env.PEXEL_TOKEN;
const _apiBase = 'https://api.pexels.com/v1/search';

/**
 * Find Stock Images from Pexels.com
 * @param {string} query
 * @returns {Promise<string[]>}
 * @throws {Error}
 */
export const stockImagesPexel = (query) =>
	new Promise(async (resolve, reject) => {
		try {
			const url = new URL(_apiBase);
			url.searchParams.set('query', query);
			url.searchParams.set('size', 'large');
			url.searchParams.set('per_page', '80');

			const data = await fetchJSON(url.toString(), {
				headers: {
					Authorization: TOKEN
				}
			});

			resolve(data?.photos?.map((v) => v.src.original));
		} catch (err) {
			reject(err);
		}
	});
