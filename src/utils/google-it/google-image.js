import axios from 'axios';

import { cheerioLOAD } from '../modules/index.js';

const _api = (query) => `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;

const filter = (arr) => {
	const refs = [];
	const re = /\["(http.+?)",(\d+),(\d+)\]/g;
	let result;

	while ((result = re.exec(arr)) !== null) {
		if (result.length > 3) {
			const url = result[1];

			if (!url.includes('gstatic.com')) {
				refs.push(url);
			}
		}
	}
	return refs[0];
};

export const googleImage = (query, limit = 10) =>
	new Promise(async (resolve, reject) => {
		try {
			if (isNaN(limit)) {
				limit = 10;
			}

			limit = Math.round(limit);

			const { data } = await axios.get(_api(query), {
				headers: {
					'User-Agent':
						'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.81 Safari/537.36'
				}
			});

			const $ = cheerioLOAD(data);

			const scripts = $('script');
			let container = [];

			for (const script of scripts) {
				if (script.children[0]?.length !== 0 && script.children[0]?.data) {
					const str = script.children[0].data;

					if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'].some((v) => str.toLowerCase().includes(v))) {
						container.push(str);
					}
				}
			}

			container = container.map(filter).flat().slice(0, limit);

			if (!container.length) {
				resolve({
					error: `The image you are looking for (${query.capitalize()}) cannot be found.\nPlease try again with another keyword.`
				});
			}

			resolve(container);
		} catch (error) {
			reject(error);
		}
	});
