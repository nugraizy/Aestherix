import Axios from 'axios';
import qs from 'qs';

import { cheerioLOAD } from '../../helper/index.js';

export const getIgtv = (username) =>
	new Promise(async (resolve, reject) => {
		try {
			if (username.startsWith('@')) {
				username = username.replace('@', '');
			}

			let { data } = await Axios.get(`https://www.instagramsave.com/instagram-story-downloader.php?input=${username}`, {
				headers: {
					'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36',
					Cookie: 'PHPSESSID=hj2p3i96va7kqs7csbq16a5tip; _ga=GA1.2.1623964880.1642090612; _gid=GA1.2.553723423.1642090612; _gat=1',
				},
			});
			const $ = cheerioLOAD(data);
			const token = $('input#token').attr('value');

			data = (
				await Axios.post(
					'https://www.instagramsave.com/system/action.php',
					qs.stringify({
						url: `https://www.instagram.com/${username}`,
						action: 'igtvVideos',
						token,
					}),
					{
						headers: {
							'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36',
							origin: 'https://www.instagramsave.com',
							referer: `https://www.instagramsave.com/instagram-story-downloader.php?input=${username}`,
							'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
							Cookie: 'PHPSESSID=hj2p3i96va7kqs7csbq16a5tip; _ga=GA1.2.1623964880.1642090612; _gid=GA1.2.553723423.1642090612; _gat=1',
						},
					},
				)
			).data;
			resolve(data);
		} catch (err) {
			reject(err);
		}
	});
