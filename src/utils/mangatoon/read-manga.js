import { cheerioLOAD, fetchTEXT } from '../modules/index.js';

const isAppOnly = ($) =>
	$('title').text().includes('404') || ($('body').text().includes('copyright') && $('body').text().includes('APP'));

export const readMangatoon = (url) =>
	new Promise(async (resolve, reject) => {
		try {
			const data = await fetchTEXT(url);
			const $ = cheerioLOAD(data);

			if (isAppOnly($)) {
				return resolve({ error: 'This comic is only available in the MangaToon app.' });
			}

			if ($('div.lock-top-text').text() === 'This chapter is not unlocked yet') {
				return resolve({ error: $('div.lock-top-text').text() });
			}

			if (data === 'NOT FOUND') {
				return resolve({ error: 'Manga not found' });
			}

			resolve(
				$('.watch-page > .pictures')
					.find('img.lazyload_img')
					.map((i, el) => $(el).attr('data-src'))
					.get()
			);
		} catch (err) {
			reject(err);
		}
	});
