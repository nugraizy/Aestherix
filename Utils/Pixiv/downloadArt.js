import { _fetch, URL_API_DOWNLOAD_ARTWORKS, downloadManga } from "./index.js";

export const downloadArtworks = (input) =>
	new Promise(async (resolve, reject) => {
		try {
			const { body } = await _fetch(URL_API_DOWNLOAD_ARTWORKS(input));
			if (body.length == 0) resolve({ error: "No downloadable media found with this keyword." });
			const container = {};
			const { id, title, userId, userName, pageCount } = body;
			container.id = id;
			container.title = title;
			container.userId = userId;
			container.userName = userName;
			container.pageCount = pageCount;
			container.url = pageCount !== 1 ? await downloadManga(input) : [body.urls.original];
			resolve(container);
		} catch (err) {
			log(err);
			reject(err);
		}
	});
