import axios from 'axios';

const TOKEN = process.env.PEXEL_TOKEN;
const _apiBase = 'https://api.pexels.com/v1/search';

/**
 * Find Stock Images from Pexels.com
 * @param {string} query
 * @returns {Promise<string[]>}
 * @throws {Error}
 */
export const stockImagesPexel = (query) =>
	new Promise(async (resolve, reject) => {
		try {
			const { data } = await axios.get(_apiBase, {
				params: {
					query,
					size: 'large',
					per_page: 80 /* eslint-disable-line */,
				},
				headers: {
					Authorization: TOKEN,
				},
			});

			resolve(data?.photos?.map((v) => v.src.original));
		} catch (err) {
			reject(err);
		}
	});
