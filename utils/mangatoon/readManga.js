import { cheerioLOAD, fetchTEXT } from '../../helper/index.js';

export const readMangatoon = (id) =>
	new Promise(async (resolve, reject) => {
		try {
			const data = await fetchTEXT(id);
			const $ = cheerioLOAD(data);

			if ($('div.lock-top-text').text() == 'This chapter is not unlocked yet') {
				return resolve({ error: $('div.lock-top-text').text() });
			}

			if (data == 'NOT FOUND') {
				return resolve({ error: 'Manga not found' });
			}

			resolve(
				$('.watch-page > .pictures')
					.find('img.lazyload_img')
					.map((i, el) => $(el).attr('data-original'))
					.get(),
			);
		} catch (err) {
			reject(err);
		}
	});
