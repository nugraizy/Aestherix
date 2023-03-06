import fetch from 'node-fetch';
import _ from 'lodash';

import { cheerioLOAD, fetchTEXT, isURL, uploadToTelegraph } from '../../helper/index.js';

const _api = (input) => `https://yandex.com/images/search?rpt=imageview&url=${input}`;

const isValidImageURL = async (url) => {
	try {
		const data = await fetch(url.replace('https:', 'http:'));

		if (data.status !== 200) {
			return false;
		}

		return true;
	} catch (error) {
		return false;
	}
};

export const yandex = async (file, { limit = 20 } = {}) =>
	new Promise(async (resolve, reject) => {
		try {
			if (!isURL(file)) {
				file = await uploadToTelegraph(file);
			} else if (isURL(file) && !(await isValidImageURL(file))) {
				return resolve({ error: 'Invalid image URL' });
			}

			const ua = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.81 Safari/537.36';

			const data = await fetchTEXT(`${_api(file)}&cbir_page=similar`, {
				headers: {
					cookie:
						'mda=0; yandex_gid=112665; yandexuid=7619580781668102965; yuidss=7619580781668102965; is_gdpr=0; is_gdpr_b=CIyaHxDUlAEoAg==; i=aV+BsdmB5XW/GOuXKw3lw1JY3DAJJ1DDk9X5cVdJr962Qgfuphh43+iwo/EYmtz/iI/n+8WgcDRuXoCfU5goK69YCdc=; my=YwA=; bltsr=1; KIykI=1; spravka=dD0xNjY4MTEwMjY2O2k9MjAwMTo0NDhhOjEwNDE6YmU4OTo4MGNkOmQ5MTpiMmIyOjMxMGI7RD05MzUzOEE3NDk0MjYxNjkwQkI2NUREQTAzNDhDNjJENURENEMyNUZGQkFGODJERThFMTNEMEZDM0JBQjQxNkFFQzA1RThFQ0M7dT0xNjY4MTEwMjY2MDM3MjkwOTI5O2g9ZmE3ZDUzNDk1ZjE3MjIwMTc5MmE2NjdhNmY2M2IxZjk=; _yasc=prYDVz9hUr5MvE7MO/qvScS4uny1TIr+t4amnRSdf1FHU155d9t41rXlEyZ4PpufIonvBMn9DKVZcYA=; yp=1670694965.ygu.1#1668707775.szm.1:1366x768:767x641',
					'user-agent': ua,
				},
			});

			const $ = cheerioLOAD(data);
			const now = new Date();
			const container = { status: 'OK', responseTime: 0, information: [] };

			const jsonRaw = $('div.serp-list[role=list]')
				.find('div.serp-item[role=listitem]')
				.get()
				.map((el) => JSON.parse($(el).attr('data-bem'))['serp-item']);

			container.information = jsonRaw.map((v) => ({
				title: v.snippet.title || 'n/a',
				description: v.snippet.text || 'n/a',
				domain: v.snippet.domain || 'n/a',
				source: v.snippet.url || 'n/a',
				images: {
					preview: _.uniqBy(v.dups).map((w) => ({ url: w.url, fileSize: w.fileSizeInBytes, width: w.w, height: w.h })),
					original: v.img_href,
				},
			}));
			container.responseTime = (new Date() - now) / 1000;
			resolve(container);
		} catch (error) {
			reject(error);
		}
	});
