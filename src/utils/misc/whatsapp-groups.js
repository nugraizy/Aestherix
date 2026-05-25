import { cheerioLOAD, fetchTEXT } from '../modules/index.js';
import { UA } from '../../helper/index.js';

let ua = undefined;

/**
 * Find Public WhatsApp group.
 * @param {string} keyword
 * @returns {Promise<{title: string, url: string}[] & {error?: string}>}
 * @throws {Error}
 */
export const searchWAGroups = (keyword) =>
	new Promise(async (resolve, reject) => {
		try {
			if (!ua) {
				ua = { headers: { 'user-agent': UA() } };
			}

			const data = await fetchTEXT(
				`http://ngarang.com/link-grup-wa/daftar-link-grup-wa.php?search=${encodeURI(keyword)}&searchby=name`,
				ua
			);

			const $ = cheerioLOAD(data);

			const container = $('div.wa-chat')
				.get()
				.map((element) => {
					let title = $(element)
						.find('.wa-chat-title-text')
						.text()
						.replace(/\*[0-9]+\. /g, '');

					title = title.slice(0, -1);
					const url = $(element).find('a.URLMessage').text();

					return { title, url };
				});

			if (!container.length) {
				resolve({ error: 'Cannot find publics group' });
			}

			resolve(container);
		} catch (error) {
			reject(error);
		}
	});
