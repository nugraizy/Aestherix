import { cheerioLOAD, fetchTEXT } from '../modules/index.js';

const BASE_URL = (input) => `https://mangatoon.mobi${input}`;

export const searchMangatoon = (query) =>
	new Promise(async (resolve, reject) => {
		try {
			const data = await fetchTEXT(BASE_URL(`/en/search?word=${query}`));
			const $ = cheerioLOAD(data);

			if ($('.no-result').length !== 0) {
				return resolve({ error: $('.no-result-word').text() });
			}

			resolve(
				$('.recommend-comics > .recommend-item')
					.map((i, el) => ({
						title: $(el).find('.recommend-comics-title > span').text(),
						source: BASE_URL($(el).find('a').attr('href')),
						imagePoster: $(el).find('.comics-image > img').attr('data-src') || $(el).find('.comics-image > img').attr('src'),
						genreStr: $(el).find('.comics-type > span').text().trim().split('/').join(', '),
						genreArr: $(el).find('.comics-type > span').text().trim().split('/')
					}))
					.get()
			);
		} catch (err) {
			reject(err);
		}
	});
