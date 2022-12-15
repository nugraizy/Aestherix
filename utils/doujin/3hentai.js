import axios from 'axios';
import cheerio from 'cheerio';

const _api = (input) => `https://3hentai.net/d/${input}`;

/**
 * @typedef {{title: string, uploadDate: string, tags: string[], artists: string[], language: string[], categories: string[], images: string[], totalPages: number}} _3HentaiResult
 */

/**
 * Search comic from 3hentai.
 * @param {string} code
 * @returns {Promise<_3HentaiResult>}
 * @throws {Error}
 */
export const _3hentai = (code) =>
	new Promise(async (resolve, reject) => {
		try {
			const { data } = await axios.get(_api(code), {
				headers: {
					'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.81 Safari/537.36',
				},
			});

			const $ = cheerio.load(data);

			if ($('#main-content > div.large-container.bg-container.container > h1').text() === '404 - Oh no') {
				resolve({ error: `Code (${code}) you are looking for is not found.` });
			}

			const getElement = (input) =>
				$(`.tag-container.field-name:contains(${input}:)`)
					.find('a')
					.map((i, el) => $(el).text().trim())
					.get();

			const details = {
				title: $('title').text(),
				uploadDate: $('time').text(),
				tags: getElement('Tags'),
				artists: getElement('Artists'),
				language: getElement('Languages'),
				categories: getElement('Categories'),
				images: $('div.single-thumb-col')
					.map((i, el) => $(el).find('img').attr('data-src').replace('t.', '.'))
					.get(),
			};

			details.totalPages = details.images.length;

			resolve(details);
		} catch (error) {
			reject(error);
		}
	});
