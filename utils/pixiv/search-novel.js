/* global log */
import { fetchJSON } from '../../helper/index.js';
import { URL_API_SEARCH_NOVEL } from './index.js';

export const searchNovel = (keyword) =>
	new Promise(async (resolve, reject) => {
		try {
			const { body } = await fetchJSON(URL_API_SEARCH_NOVEL(keyword));

			if (body.novel.data.length === 0) {
				resolve({ error: 'No novel found with this keyword.' });
			}

			const container = body.novel.data.map(({ id, title, userId, userName }) => ({
				id,
				title,
				userId,
				userName,
				type: 'novel',
			}));

			resolve(container);
		} catch (err) {
			log(err);
			reject(err);
		}
	});
