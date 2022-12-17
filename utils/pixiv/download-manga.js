/* global log */
import { fetchJSON } from '../../helper/index.js';
import { URL_API_DOWNLOAD_MANGA, URL_API_DOWNLOAD_MANGA_DETAIL } from './index.js';

export const downloadManga = (input) =>
	new Promise(async (resolve, reject) => {
		try {
			const data = await fetchJSON(URL_API_DOWNLOAD_MANGA_DETAIL(input));
			const { id, title, userId, userName, pageCount } = data.body;
			const { body } = await fetchJSON(URL_API_DOWNLOAD_MANGA(input));

			resolve({
				id,
				title,
				userId,
				userName,
				pageCount,
				url: {
					original: body.map((v) => v.urls.original),
					sd: body.map((v) => v.urls.regular),
					low: body.map((v) => v.urls.thumb_mini),
				},
			});
		} catch (err) {
			log(err);
			reject(err);
		}
	});
