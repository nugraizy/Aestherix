import { fetchTEXT, isURL } from '../../helper/modules/index.js';

const _apiBase = (input) => `https://tinyurl.com/api-create.php?url=${input}`;

export const tiny = (url) =>
	new Promise(async (resolve) => {
		try {
			if (!isURL(url)) {
				return resolve({ error: 'Invalid URL' });
			}

			const data = await fetchTEXT(_apiBase(url));

			resolve(data);
		} catch (error) {
			resolve(error.message);
		}
	});
