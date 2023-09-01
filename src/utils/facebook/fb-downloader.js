import { fetchJSON } from '../modules/index.js';
import { parse } from './utils.js';

const _api = 'https://www.y2mate.com/mates/en/analyzeV2/ajax';

export const fbDl = (url) =>
	new Promise(async (resolve, reject) => {
		try {
			const obj = {
				// eslint-disable-next-line
				k_query: url,
				// eslint-disable-next-line
				k_page: 'Facebook',
				hl: 'en',
				// eslint-disable-next-line
				q_auto: 0
			};

			const data = await fetchJSON(_api, {
				method: 'POST',
				headers: {
					Referer: 'https://www.y2mate.com/en/facebook-downloader',
					'User-Agent':
						'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.81 Safari/537.36'
				},
				body: new URLSearchParams(obj)
			});

			if (data.mess !== '') {
				resolve({ error: data.mess });
			}

			resolve(parse(data));
		} catch (err) {
			reject(err);
		}
	});
