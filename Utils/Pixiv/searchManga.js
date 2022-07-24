import { _fetch, URL_API_SEARCH_MANGA } from "./index.js";

export const searchManga = (keyword) =>
	new Promise(async (resolve, reject) => {
		try {
			const { body } = await _fetch(URL_API_SEARCH_MANGA(keyword));
			if (body.manga.data.length == 0) resolve({ error: "No manga found with this keyword." });
			const container = [];
			for (const { id, title, userId, userName, pageCount } of body.manga.data) {
				container.push({ id, title, userId, userName, pageCount, type: "manga" });
			}
			resolve(container);
		} catch (err) {
			log(err);
			reject(err);
		}
	});
