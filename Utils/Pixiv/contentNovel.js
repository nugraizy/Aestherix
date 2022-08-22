import { fetchJSON } from "../../Helper/index.js";
import { URL_API_CONTENT_NOVEL } from "./index.js";

export const getNovelContent = (input) =>
	new Promise(async (resolve, reject) => {
		try {
			const { body, error } = await fetchJSON(URL_API_CONTENT_NOVEL(input));
			if (error) {
				resolve({ error: "No novel content found with this keyword." });
			}
			const { title, likeCount, userName, viewCount, userId, content, id } = body;
			resolve({ title, likeCount, userName, viewCount, userId, content, id });
		} catch (err) {
			log(err);
			reject(err);
		}
	});
