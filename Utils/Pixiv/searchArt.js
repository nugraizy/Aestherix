/* global log */
import { fetchJSON } from '../../Helper/index.js';
import { URL_API_SEARCH_ARTWORKS } from './index.js';

export const searchArtwork = (keyword) =>
	new Promise(async (resolve, reject) => {
		try {
			const { body } = await fetchJSON(URL_API_SEARCH_ARTWORKS(keyword));

			if (body.illustManga.data.length == 0) {
				resolve({ error: 'No art found with this keyword.' });
			}

			const container = body.illustManga.data.map(({ id, title, userId, userName, pageCount }) => ({ id, title, userId, userName, type: pageCount > 1 ? 'slide' : 'artworks' }));

			resolve(container);
		} catch (err) {
			log(err);
			reject(err);
		}
	});
