import axios from 'axios';
import { contentType } from 'mime-types';

import { mime, whatFormat } from '../misc/index.js';
import { cheerioLOAD } from '../../helper/index.js';

/**
 *
 * @param {string} url
 * @returns {Promise<{filename: string, filesize: string, mimetype: string, filetype: string, uploaded: string, dlLink: string} & {error?: string}>}
 * @throws {Error}
 */
export const mediafire = (url) =>
	new Promise(async (resolve, reject) => {
		try {
			const { data } = await axios.get(url, {
				headers: {
					'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.81 Safari/537.36',
				},
			});

			const $ = cheerioLOAD(data);

			const detail = $('ul.details');

			const filename = $('.filename').text();
			const filesize = detail.find('li > span').get(0).children[0].data;
			const uploaded = detail.find('li > span').get(1).children[0].data;
			const dlLink = $('a.input.popsok').attr('href');
			const filetypes = /[a-zA-Z]+/g.exec($('.filetype').find('span').get(1).children[0].data);
			const mimetype = mime(filetypes?.[0]?.toLowerCase());
			const format = whatFormat(contentType(filetypes?.[0]?.toLowerCase()));

			if (!dlLink) {
				resolve({ error: 'Cannot find downloadable link. Please check if the url is valid.' });
			}

			resolve({ filename, filesize, mimetype, filetype: format, uploaded, dlLink });
		} catch (error) {
			reject(error);
		}
	});
