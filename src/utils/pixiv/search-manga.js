import { fetchJSON } from '../modules/index.js';
import { URL_API_SEARCH_MANGA } from './index.js';

export const searchManga = (keyword) =>
	new Promise(async (resolve, reject) => {
		try {
			const { body } = await fetchJSON(URL_API_SEARCH_MANGA(keyword));

			if (body.manga.data.length === 0) {
				resolve({ error: 'No manga found with this keyword.' });
			}

			const container = body.manga.data.map(({ id, title, userId, userName }) => ({
				id,
				title,
				userId,
				userName,
				type: 'manga'
			}));

			resolve(container);
		} catch (err) {
			log(err);
			reject(err);
		}
	});
