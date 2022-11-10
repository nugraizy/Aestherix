/* eslint-disable */
import axios from 'axios';
import dayjs from 'dayjs';
import FormData from 'form-data';

import { UA } from '../../helper/index.js';

const ua = UA;

const maps = {
	0: [1, 2, 3, 4, 5, 6],
	1: [2, 3, 4, 5, 6, 0],
	2: [3, 4, 5, 6, 0, 1],
	3: [4, 5, 6, 0, 1, 2],
	4: [5, 6, 0, 1, 2, 3],
	5: [6, 0, 1, 2, 3, 4],
	6: [0, 1, 2, 3, 4, 5],
};

const convertToDates = (arr) => {
	const container = [];

	const temp = arr.sort((a, b) => a.release - b.release);
	for (const obj of temp) {
		const date = dayjs(obj.release).format('dddd');
		const time = dayjs(obj.release).format('HH:mm');
		const indexDate = dayjs(obj.release).day();

		container.push({ ...obj, date, time, indexDate });
	}

	return container;
};

const sortDates = (arr) => {
	const datesNow = dayjs().day();

	const dates = {};
	const todaySchedule = arr.filter((v) => v.indexDate === datesNow);

	dates[todaySchedule[0].date] = todaySchedule;

	for (const date of maps[datesNow]) {
		const day = dayjs().day(date).format('dddd');
		dates[day] = arr.filter((v) => v.indexDate === date);
	}

	return dates;
};

export const animixReleases = () =>
	new Promise(async (resolve, reject) => {
		try {
			const { data } = await axios.get('https://animixplay.to/assets/s/schedule.json');

			const container = sortDates(convertToDates(data.map((v) => ({ title: v.name, id: v.malid, release: parseInt(v.time * 1000) }))));

			for (const obj in container) {
				for (const val of container[obj]) {
					const form = new FormData();
					form.append('recomended', val.id);

					const {
						data: { data },
					} = await axios.post('https://animixplay.to/api/search', form, {
						headers: {
							...form.getHeaders(),
							'user-agent': ua(),
						},
					});

					val.streams = data.map((v) => ({
						server: v.type,
						items: v.items.map((w) => ({ url: `https://animixplay.to${w.url}`, title: w.title, totalEpisode: w.ep, totViews: w.views, thumbnail: w.img })),
					}));
				}
			}
			resolve(container);
		} catch (error) {
			reject(error);
		}
	});
