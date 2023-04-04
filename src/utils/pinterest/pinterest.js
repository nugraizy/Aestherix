import { fetchJSON } from '../modules/index.js';

const _api = (input) =>
	`https://www.pinterest.com/resource/BaseSearchResource/get/?source_url=%2Fsearch%2Fpins%2F%3Fq%3D${input}&data=%7B%22options%22%3A%7B%22isPrefetch%22%3Afalse%2C%22query%22%3A%22${input}%22%2C%22scope%22%3A%22pins%22%2C%22no_fetch_context_on_resource%22%3Afalse%7D%2C%22context%22%3A%7B%7D%7D&_=1619980301559`;
const _apiBase = (input) => `https://id.pinterest.com/pin/${input}`;

export const pinterest = (query) =>
	new Promise(async (resolve) => {
		try {
			const RAW_DATA = await fetchJSON(_api(query));
			const container = [];
			let RAW_RESULTS = RAW_DATA.resource_response.data.results;

			RAW_RESULTS = RAW_RESULTS.filter((v) => v.images?.orig !== undefined);

			if (RAW_RESULTS.length === 0) {
				resolve({ error: true, message: 'Original Image Not Available.' });
			}

			for (const result of RAW_RESULTS) {
				container.push({
					authorUsername: result.pinner.username,
					authorFullname: result.pinner.full_name,
					follower: result.pinner.follower_count,
					caption: result.grid_title,
					image: result.images.orig.url,
					pinSource: _apiBase(result.id)
				});
			}

			resolve(container);
		} catch (err) {
			resolve({ error: err });
		}
	});
