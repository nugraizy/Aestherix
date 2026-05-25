import { fetchJSON } from '../modules/index.js';
import { parse, getTokens } from './utils.js';

const _api = 'https://v3.fdownloader.net/api/ajaxSearch?lang=en';

/**
 * Download Facebook videos.
 * @param {string} url Facebook URL
 * @returns {Promise<import('./utils.js').ParsedFacebookResponse>}
 */
export const facebook = (url) =>
	new Promise(async (resolve, reject) => {
		try {
			const { k_token: kToken, k_exp: kExp } = await getTokens();

			const payload = {
				k_exp: +kExp,
				k_token: kToken,
				q: url,
				lang: 'en',
				web: 'fdownloader.net',
				v: 'v2',
				w: ''
			};

			const json = await fetchJSON(_api, {
				method: 'POST',
				body: new URLSearchParams(payload),
				headers: {
					accept: '*/*',
					'content-type': 'application/x-www-form-urlencoded',
					origin: 'https://fdownloader.net',
					referer: 'https://fdownloader.net/',
					'sec-ch-ua': '"Chromium";v="130", "Brave";v="130", "Not?A_Brand";v="99"',
					'sec-ch-ua-mobile': '?0',
					'sec-ch-ua-platform': 'Windows',
					'sec-fetch-dest': 'empty',
					'sec-fetch-mode': 'cors',
					'sec-fetch-site': 'same-site',
					'sec-gpc': 1,
					'user-agent':
						'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
				}
			});

			if (!json.v) {
				resolve({
					error: 'No Data.'
				});

				return;
			}

			resolve(parse(json.data));
		} catch (error) {
			reject(error);
		}
	});
