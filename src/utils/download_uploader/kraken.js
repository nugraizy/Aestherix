import { fetch } from 'undici';
import { load } from 'cheerio';

import { mime, whatFormat } from '../misc/index.js';

/**
 *
 * @param {string} url
 * @returns {Promise<{filename: string, filesize: string, mimetype: string, filetype: string, uploaded: string, downloads: number, views: number, dlLink: string} & {error?: string}>}
 * @throws {Error}
 */
export const kraken = (url) =>
	new Promise(async (resolve, reject) => {
		try {
			const data = await (await fetch(url)).text();

			const $ = load(data);

			const find = (selector) => $(`.sub-text:contains("${selector}")`).next().text().trim();

			const container = {
				filename: $('span.coin-name').text(),
				filesize: find('File size'),
				uploaded: find('Upload date'),
				filetype: find('Type'),
				views: Number($('.lead-text.views-count').next().text()),
				downloads: Number($('.lead-text.downloads-count > strong').text())
			};

			container.mimetype = mime(container.filetype.replace(/\./g, ''));
			container.filetype = whatFormat(container.mimetype);

			const URL_POST = 'https:' + $('form#dl-form').attr('action');
			const token = $('input#dl-token').val();

			if (!token) {
				resolve({ error: 'Cannot find downloadable link. Please check if the url is valid.' });
			}

			const bodyPost = await (
				await fetch(URL_POST, {
					method: 'POST',
					body: new URLSearchParams({ token }),
					headers: {
						accept: '*/*',
						'accept-encoding': 'gzip, deflate, br',
						'accept-language': 'en,ru;q=0.9',
						'cache-control': 'no-cache',
						'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
						dnt: 1,
						origin: 'https://krakenfiles.com',
						pragma: 'no-cache',
						referer: 'https://krakenfiles.com/',
						'sec-ch-ua': '"Not?A_Brand";v="8", "Chromium";v="108", "Yandex";v="23"',
						'sec-ch-ua-mobile': '?0',
						'sec-ch-ua-platform': 'Linux',
						'sec-fetch-dest': 'empty',
						'sec-fetch-mode': 'cors',
						'sec-fetch-site': 'same-site',
						'sec-gpc': 1,
						'user-agent':
							'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 YaBrowser/23.1.5.750 (beta) Yowser/2.5 Safari/537.36'
					}
				})
			).json();

			container.dlLink = bodyPost.url;

			resolve(container);
		} catch (error) {
			reject(error);
		}
	});
