/* eslint-disable */
import axios from 'axios';
import dayjs from 'dayjs';
import FormData from 'form-data';

import { UA } from '../../helper/index.js';

const ua = UA;

/**
 * @typedef {'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'} Days
 * @typedef {{url: string, title: string, totalEpisode: number, totalViews: number, thumbnail: string}[]} ItemsContainer
 * @typedef {ResultParsed[] & {streams: {server: string, items: ItemsContainer}}[]} StreamsContainer
 * @typedef {Record<Days, ResultParsed[]>} ResultParsedSorted
 * @typedef {Record<Days, StreamsContainer>} Results
 */

const maps = {
	0: [1, 2, 3, 4, 5, 6],
	1: [2, 3, 4, 5, 6, 0],
	2: [3, 4, 5, 6, 0, 1],
	3: [4, 5, 6, 0, 1, 2],
	4: [5, 6, 0, 1, 2, 3],
	5: [6, 0, 1, 2, 3, 4],
	6: [0, 1, 2, 3, 4, 5],
};

/**
 * Convert the release timestamp to readable days of the weeks.
 * @typedef {{title: string, id: string, release: number}} ResultRaw
 * @typedef {{title: string, id: string, release: number, date: string, time: string, indexDate: number}} ResultParsed
 * @param {ResultRaw[]} arr
 * @returns {ResultParsed}
 * @throws {Error}
 */
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

/**
 * Sort the days of the week into full circle.
 * @param {ResultParsed} arr
 * @returns {ResultParsedSorted}
 */
const sortDates = (arr) => {
	const datesNow = dayjs().day();

	const dates = {};
	const todaySchedule = arr.filter((v) => v.indexDate === datesNow);

	dates[todaySchedule[0].date] = todaySchedule.sort((lhs, rhs) =>
		dayjs(lhs.time, 'HH:mm').hour() > dayjs(rhs.time, 'HH:mm').hour() ? 1 : dayjs(lhs.time, 'HH:mm').hour() < dayjs(rhs.time, 'HH:mm').hour() ? -1 : 0,
	);

	for (const date of maps[datesNow]) {
		const day = dayjs().day(date).format('dddd');
		dates[day] = arr
			.filter((v) => v.indexDate === date)
			.sort((lhs, rhs) => (dayjs(lhs.time, 'HH:mm').hour() > dayjs(rhs.time, 'HH:mm').hour() ? 1 : dayjs(lhs.time, 'HH:mm').hour() < dayjs(rhs.time, 'HH:mm').hour() ? -1 : 0));
	}

	return dates;
};

/**
 * Get release schedule from animixplay.to.
 * @returns {Promise<Results>}
 */
export const animixReleases = () =>
	new Promise(async (resolve, reject) => {
		try {
			const { data } = await axios.get('https://animixplay.to/assets/s/schedule.json');

			const container = sortDates(convertToDates(data.map((v) => ({ title: v.name, id: v.malid, release: parseInt(v.time * 1000 + 2 * 60 * 60 * 1000) }))));

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
