import fetch from 'node-fetch';

import { cheerioLOAD, fetchTEXT, isURL, UA, uploadToTelegraph } from '../../helper/index.js';

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

			const ua = UA();

			const dataInformation = await fetchTEXT(_api(file), {
				headers: {
					cookie:
						'mda=0; yandex_gid=112665; yandexuid=7619580781668102965; yuidss=7619580781668102965; is_gdpr=0; is_gdpr_b=CIyaHxDUlAEoAg==; i=aV+BsdmB5XW/GOuXKw3lw1JY3DAJJ1DDk9X5cVdJr962Qgfuphh43+iwo/EYmtz/iI/n+8WgcDRuXoCfU5goK69YCdc=; my=YwA=; bltsr=1; KIykI=1; spravka=dD0xNjY4MTEwMjY2O2k9MjAwMTo0NDhhOjEwNDE6YmU4OTo4MGNkOmQ5MTpiMmIyOjMxMGI7RD05MzUzOEE3NDk0MjYxNjkwQkI2NUREQTAzNDhDNjJENURENEMyNUZGQkFGODJERThFMTNEMEZDM0JBQjQxNkFFQzA1RThFQ0M7dT0xNjY4MTEwMjY2MDM3MjkwOTI5O2g9ZmE3ZDUzNDk1ZjE3MjIwMTc5MmE2NjdhNmY2M2IxZjk=; _yasc=prYDVz9hUr5MvE7MO/qvScS4uny1TIr+t4amnRSdf1FHU155d9t41rXlEyZ4PpufIonvBMn9DKVZcYA=; yp=1670694965.ygu.1#1668707775.szm.1:1366x768:767x641',
					'user-agent': ua,
				},
			});
			const dataImages = await fetchTEXT(`${_api(file)}&cbir_page=similar`, {
				headers: {
					cookie:
						'mda=0; yandex_gid=112665; yandexuid=7619580781668102965; yuidss=7619580781668102965; is_gdpr=0; is_gdpr_b=CIyaHxDUlAEoAg==; i=aV+BsdmB5XW/GOuXKw3lw1JY3DAJJ1DDk9X5cVdJr962Qgfuphh43+iwo/EYmtz/iI/n+8WgcDRuXoCfU5goK69YCdc=; my=YwA=; bltsr=1; KIykI=1; spravka=dD0xNjY4MTEwMjY2O2k9MjAwMTo0NDhhOjEwNDE6YmU4OTo4MGNkOmQ5MTpiMmIyOjMxMGI7RD05MzUzOEE3NDk0MjYxNjkwQkI2NUREQTAzNDhDNjJENURENEMyNUZGQkFGODJERThFMTNEMEZDM0JBQjQxNkFFQzA1RThFQ0M7dT0xNjY4MTEwMjY2MDM3MjkwOTI5O2g9ZmE3ZDUzNDk1ZjE3MjIwMTc5MmE2NjdhNmY2M2IxZjk=; _yasc=prYDVz9hUr5MvE7MO/qvScS4uny1TIr+t4amnRSdf1FHU155d9t41rXlEyZ4PpufIonvBMn9DKVZcYA=; yp=1670694965.ygu.1#1668707775.szm.1:1366x768:767x641',
					'user-agent': ua,
				},
			});

			const $images = cheerioLOAD(dataImages);
			const $information = cheerioLOAD(dataInformation);
			const now = new Date();
			const container = { status: 'OK', responseTime: 0, information: [] };

			$information('li.CbirSites-Item')
				.get()
				.forEach((el) => {
					if (container.information.length >= limit && limit !== 'infinite') {
						return;
					}

					const title = $information(el).find('div.CbirSites-ItemInfo > div.CbirSites-ItemTitle').text();
					const description = $information(el).find('div.CbirSites-ItemInfo > div.CbirSites-ItemDescription').text() || 'n/a';

					container.information.push({ images: '', title, description });
				});
			$images('div > a.serp-item__link > img.serp-item__thumb.justifier__thumb').each((i, el) => {
				if (container.information[i] === undefined) {
					return;
				}

				const images = `https:${$images(el).attr('src')}`;

				container.information[i].images = images;
			});
			container.responseTime = (new Date() - now) / 1000;
			resolve(container);
		} catch (error) {
			reject(error);
		}
	});
