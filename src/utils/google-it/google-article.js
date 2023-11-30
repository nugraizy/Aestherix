import axios from 'axios';

import { cheerioLOAD } from '../modules/index.js';

const _api = (query) => `https://search.brave.com/search?q=${encodeURIComponent(query)}&source=desktop`;

/**
 * Find articles from Google.
 * @param {string} query article keyword.
 * @returns {Promise<{title: string, description: string, url: string, date: string | null}[] & {error?: string}>}
 */
export const googleArticle = (query) =>
	new Promise(async (resolve, reject) => {
		try {
			const { data } = await axios.get(_api(query), {
				headers: {
					'User-Agent':
						'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.81 Safari/537.36'
				}
			});

			const $ = cheerioLOAD(data);

			let container = $('div.section').find('div.snippet.fdb').get();

			container = container
				.map((v) => {
					const detail = {
						description: $(v).find('div.snippet-content > p.snippet-description').text().trim().split('-'),
						date: null
					};

					if (detail.description.length > 1) {
						detail.date = detail.description[0];
						detail.description = detail.description[1].trim();
					} else {
						detail.description = detail.description[0].trim();
					}

					return {
						url: $(v).find('a').attr('href'),
						title: $(v).find('span.snippet-title').text().trim(),
						...detail
					};
				})
				.filter((v) => v.description);

			if (!container.length) {
				resolve({ error: 'Article not found.' });
			}

			resolve(container);
		} catch (error) {
			reject(error);
		}
	});
