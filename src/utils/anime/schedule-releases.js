import dayjs from 'dayjs';

import { fetchTEXT, cheerioLOAD } from '../modules/index.js';
import { createDaysContainer, parseSchedule } from './utils.js';

const YEAR = dayjs().format('YYYY');

export const animeReleases = () =>
	new Promise(async (resolve, reject) => {
		try {
			const data = await fetchTEXT('https://www.livechart.me/schedule?layout=timetable');
			const $ = cheerioLOAD(data);

			const TODAY_INFO = $('div.lc-timetable > div.lc-timetable-day.lc-today');
			const RAW_DAY = TODAY_INFO.find('div.lc-timetable-day__heading').text().trim() + ` ${YEAR}`;
			const TODAY_DAY = dayjs(RAW_DAY, { format: 'ddd MMM DD YYYY' }).format('dddd');
			const SCHEDULES = createDaysContainer(RAW_DAY);

			SCHEDULES[TODAY_DAY] = parseSchedule($, TODAY_INFO);

			$('div.lc-timetable > div.lc-timetable-day.lc-future')
				.get()
				.forEach((v) => {
					const day = dayjs($(v).find('div.lc-timetable-day__heading').text().trim() + ` ${YEAR}`, {
						format: 'ddd MMM DD YYYY'
					}).format('dddd');
					const child = parseSchedule($, $(v));

					SCHEDULES[day] = child;
				});

			resolve(SCHEDULES);
		} catch (error) {
			reject(error);
		}
	});
