import axios from 'axios';

import { cheerioLOAD, UA } from '../../helper/index.js';

let ua = undefined;

/**
 * Select h2 tags that contains `str`
 * @param {import('cheerio').Cheerio} $
 * @param {string} str
 * @returns {import('cheerio').Cheerio}
 */
const findh2 = ($, str) => $(`div > h2:contains(${str})`);

/**
 * Scrape details layarkaca21.
 * @param {string} url
 * @typedef {{country: string, quality: string, director: string, ratings: string, thumbnail: string, released: string, translateBy: string | 'n/a', genreArr: string[], castArr: string[], genreStr: (seperator: string) => string, castStr: (seperator: string) => string}} Details
 * @returns {Promise<Details>}
 * @throws {Error}
 */
const getDetailsMovies = (url) =>
	new Promise(async (resolve, reject) => {
		try {
			const { data } = await axios.get(url, ua);
			const $ = cheerioLOAD(data);
			const thumbnail = `https:${$('img.img-thumbnail').attr('src')}`;
			const country = findh2($, 'Negara').next().text();
			const quality = findh2($, 'Kualitas').next().text();
			const director = findh2($, 'Sutradara').next().find('a').text();
			const released = findh2($, 'Diterbitkan').next().text();
			const genreArr = findh2($, 'Genre')
				.next()
				.find('a')
				.get()
				.map((v) => $(v).text());
			const genreStr = (seperator) => genreArr.join(`${seperator?.trim()} ` || ', ');
			const castArr = findh2($, 'Bintang film')
				.next()
				.find('a')
				.get()
				.map((v) => $(v).text());
			const castStr = (seperator) => castArr.join(`${seperator?.trim()} ` || ', ');
			let ratings = findh2($, 'IMDb')
				.nextAll()
				.get()
				.map((v) => $(v).text());

			ratings = `${ratings[0]}/${ratings[1]} from ${ratings[2]} users.`;

			resolve({ country, quality, director, ratings, thumbnail, released, genreArr, castArr, genreStr, castStr });
		} catch (error) {
			reject(error);
		}
	});

/**
 * Find movies from layarkaca21.
 * @param {string} keyword
 * @returns {Promise<{ title: string, source: string}[] & Details[] & {error?: string}>}
 * @throws {Error}
 */
export const layarkaca21 = (keyword) =>
	new Promise(async (resolve, reject) => {
		try {
			if (!ua) {
				ua = { headers: { 'user-agent': UA() } };
			}

			const { data } = await axios.get(`https://lk21official.org/?s=${keyword}#gsc.tab=0`, ua);

			const $ = cheerioLOAD(data);

			const container = $('.search-wrapper > .search-item')
				.get()
				.slice(0, 3)
				.map(async (v) => {
					const data = $(v).find('h2 > a');
					const title = data.attr('title');
					const source = data.attr('href');

					const { country, quality, director, ratings, thumbnail, released, genreArr, castArr, genreStr, castStr } = await getDetailsMovies(source);

					return {
						title,
						country,
						quality,
						director,
						ratings,
						thumbnail,
						released,

						genreArr,
						castArr,
						genreStr,
						castStr,

						source,
					};
				});

			if (container.length === 0) {
				resolve({ error: 'Cannot the movie you are looking for. Try another keyword.' });
			}

			resolve(await Promise.all(container));
		} catch (error) {
			reject(error);
		}
	});
