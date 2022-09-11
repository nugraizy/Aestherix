import { fetchTEXT, isURL } from '../../Helper/Modules/index.js';

const URL_BASE = (input) => `https://tinyurl.com/api-create.php?url=${input}`;

export const tiny = (url) =>
	new Promise(async (resolve) => {
		try {
			if (!isURL(url)) {
				return resolve({ error: 'Invalid URL' });
			}

			const data = await fetchTEXT(URL_BASE(url));

			resolve(data);
		} catch (error) {
			resolve(error.message);
		}
	});
