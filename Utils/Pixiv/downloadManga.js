import { _fetch, URL_API_DOWNLOAD_MANGA, URL_API_DOWNLOAD_MANGA_DETAIL } from "./index.js";

export const downloadManga = (input) =>
	new Promise(async (resolve, reject) => {
		try {
			const data = await _fetch(URL_API_DOWNLOAD_MANGA_DETAIL(input));
			const { id, title, userId, userName, pageCount } = data.body;
			const { body } = await _fetch(URL_API_DOWNLOAD_MANGA(input));
			resolve({ id, title, userId, userName, pageCount, url: body.map((v) => v.urls.original) });
		} catch (err) {
			log(err);
			reject(err);
		}
	});
