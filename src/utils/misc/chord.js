import { cheerioLOAD, fetchJSON } from '../modules/index.js';

const domain = 'http://app.chordindonesia.com/?json=';

const _api = (query, id) => (id ? `${domain}get_post&id=${id}` : `${domain}get_search_results&search=${encodeURI(query)}`);

/**
 * Search chord music's.
 * @param {string} query
 * @returns {Promise<{title: string, chord: string} & {error?: string}>}
 * @throws {Error}
 */
export const chords = (query) =>
	new Promise(async (resolve, reject) => {
		try {
			let data = await fetchJSON(_api(query));

			if (data.count_total === 0) {
				resolve({ error: 'Cannot find the chords that you are looking for.' });
			}

			data = await fetchJSON(_api(undefined, data.posts[0].id));

			const { content, url, title } = data.post;

			if (!content) {
				resolve({ error: 'Cannot find the chords that you are looking for.' });
			}

			const $ = cheerioLOAD(content.replace(new RegExp(url, 'g'), ''));

			const chord = $('pre').text();

			resolve({ title, chord });
		} catch (error) {
			reject(error);
		}
	});
