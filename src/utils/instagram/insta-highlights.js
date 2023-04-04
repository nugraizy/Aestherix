import qs from 'qs';

import { cheerioLOAD, fetchJSON, fetchTEXT } from '../modules/index.js';

const _apiBase = (input) => `https://www.instagramsave.com/instagram-story-downloader.php?input=${input}`;
const _api = 'https://www.instagramsave.com';
const _apiPost = 'https://www.instagramsave.com/system/action.php';
const _instagramBase = (input) => `https://www.instagram.com/${input}`;

export const getHighlights = (username) =>
	new Promise(async (resolve) => {
		try {
			if (!username) {
				return resolve({ status: false, error: 'Insert username!' });
			}

			if (username.startsWith('@')) {
				username = username.replace('@', '');
			}

			const data = await fetchTEXT(_apiBase(username), {
				headers: {
					'user-agent':
						'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36',
					Cookie:
						'PHPSESSID=hj2p3i96va7kqs7csbq16a5tip; _ga=GA1.2.1623964880.1642090612; _gid=GA1.2.553723423.1642090612; _gat=1'
				}
			});
			const $ = cheerioLOAD(data);
			const token = $('input#token').attr('value');
			const dataResult = await fetchJSON(_apiPost, {
				method: 'POST',
				headers: {
					'user-agent':
						'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36',
					origin: _api,
					referer: _apiBase(username),
					'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
					Cookie:
						'PHPSESSID=hj2p3i96va7kqs7csbq16a5tip; _ga=GA1.2.1623964880.1642090612; _gid=GA1.2.553723423.1642090612; _gat=1'
				},
				body: qs.stringify({ url: _instagramBase(username), action: 'highlights', token })
			});

			resolve(dataResult);
		} catch (err) {
			resolve({ status: false, error: err.message });
		}
	});
