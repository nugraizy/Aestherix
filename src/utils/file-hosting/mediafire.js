import { mime, whatFormat } from '../misc/index.js';
import { cheerioLOAD, fetchTEXT } from '../modules/index.js';

/**
 *
 * @param {string} url
 * @returns {Promise<{filename: string, filesize: string, mimetype: string, filetype: string, uploaded: string, dlLink: string} & {error?: string}>}
 * @throws {Error}
 */
export const mediafire = (url) =>
	new Promise(async (resolve, reject) => {
		try {
			const data = await fetchTEXT(url, {
				headers: {
					'user-agent': 'Mozilla/5.0 (compatible; NetcraftSurveyAgent/1.0; +info@netcraft.com)'
				}
			});

			const $ = cheerioLOAD(data);

			const filename = $('div.dl-btn-label').attr('title');
			const filesize = $('a.input.popsok')
				.text()
				.match(/(\d+\.?\d*\s*(?:GB|MB|KB|B))/i)?.[0];
			const dlLink = $('a.input.popsok').attr('href');
			const filetypes = /[a-zA-Z]+/g.exec($('.filetype > span:last-child').text());
			const mimetype = mime(filetypes?.[0]?.toLowerCase());
			const format = whatFormat(mimetype);

			if (!dlLink) {
				resolve({ error: 'Cannot find downloadable link. Please check if the url is valid.' });
			}

			resolve({ filename, filesize, mimetype, filetype: format, dlLink });
		} catch (error) {
			reject(error);
		}
	});
