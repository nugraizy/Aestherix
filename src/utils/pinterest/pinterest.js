import { fetchJSON } from '../modules/index.js';

const _api = (input) =>
	`https://www.pinterest.com/resource/BaseSearchResource/get/?source_url=%2Fsearch%2Fpins%2F%3Fq%3D${input}&data=%7B%22options%22%3A%7B%22isPrefetch%22%3Afalse%2C%22query%22%3A%22${input}%22%2C%22scope%22%3A%22pins%22%2C%22no_fetch_context_on_resource%22%3Afalse%7D%2C%22context%22%3A%7B%7D%7D&_=1619980301559`;
const _apiBase = (input) => `https://id.pinterest.com/pin/${input}`;

export const pinterest = (query) =>
	new Promise(async (resolve, reject) => {
		try {
			const response = await fetchJSON(_api(query));
			const results = response.resource_response.data.results.filter((v) => v.images?.orig !== undefined);

			if (!results.length) {
				resolve({ error: true, message: 'Original Image Not Available.' });
			}

			resolve(
				results.map((result) => ({
					authorUsername: result.pinner.username,
					authorFullname: result.pinner.full_name,
					follower: result.pinner.follower_count,
					caption: result.grid_title,
					image: result.images.orig.url,
					pinSource: _apiBase(result.id)
				}))
			);
		} catch (err) {
			reject(err);
		}
	});
