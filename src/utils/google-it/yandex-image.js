import { cheerioLOAD, fetchTEXT } from '../modules/index.js';

const _api = (query) => `https://yandex.com/images/search?from=tabbar&text=${query}`;

export const yandexImage = async (query) =>
	new Promise(async (resolve, reject) => {
		try {
			const data = await fetchTEXT(_api(query), {
				headers: {
					'User-Agent':
						'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.81 Safari/537.36'
				}
			});

			const $ = cheerioLOAD(data);

			const container = $('.serp-item[role=listitem]')
				.get()
				.map((el) => {
					const obj = $(el).attr('data-bem');

					const parsedObj = JSON.parse(obj)['serp-item'];

					return {
						title: parsedObj.snippet.title,
						url: {
							article: parsedObj.snippet.url,
							image: parsedObj.img_url
						}
					};
				});

			if (!container.length) {
				resolve({
					error: `The image you are looking for (${query.capitalize()}) cannot be found.\nPlease try again with another keyword.`
				});
			}

			resolve(container);
		} catch (err) {
			reject(err);
		}
	});
