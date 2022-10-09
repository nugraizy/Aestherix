/* global log */
import { fetchJSON } from '../../helper/index.js';
import { downloadManga, URL_API_DOWNLOAD_ARTWORKS } from './index.js';

export const downloadArtworks = (input) =>
	new Promise(async (resolve, reject) => {
		try {
			const { body } = await fetchJSON(URL_API_DOWNLOAD_ARTWORKS(input));

			if (body.length == 0) {
				resolve({ error: 'No downloadable media found with this keyword.' });
			}

			const container = {};
			const { id, title, userId, userName, pageCount } = body;

			container.id = id;
			container.title = title;
			container.userId = userId;
			container.userName = userName;
			container.pageCount = pageCount;
			container.url = pageCount !== 1 ? (await downloadManga(input)).url : { original: [body.urls.original], sd: [body.urls.regular], low: [body.urls.thumb] };
			resolve(container);
		} catch (err) {
			log(err);
			reject(err);
		}
	});
