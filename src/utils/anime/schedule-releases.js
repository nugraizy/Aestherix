import axios from 'axios';
import { load } from 'cheerio';
import dayjs from 'dayjs';

import { createDaysContainer, parseSchedule } from './utils.js';

export const animeReleases = () =>
	new Promise(async (resolve, reject) => {
		try {
			const { data } = await axios.get('https://www.livechart.me/timetable');
			const $ = load(data);

			const TODAY_INFO = $('div.timetable > div.timetable-day.today');
			const RAW_DAY = TODAY_INFO.find('div.timetable-day__heading').text().trim() + ' 2023';
			const TODAY_DAY = dayjs(RAW_DAY, { format: 'ddd MMM DD YYYY' }).format('dddd');
			const SCHEDULES = createDaysContainer(RAW_DAY);

			SCHEDULES[TODAY_DAY] = parseSchedule($, TODAY_INFO);

			$('div.timetable > div.timetable-day.future')
				.get()
				.forEach((v) => {
					const day = dayjs($(v).find('div.timetable-day__heading').text().trim() + ' 2023', {
						format: 'ddd MMM DD YYYY'
					}).format('dddd');
					const child = parseSchedule($, $(v));

					SCHEDULES[day] = child;
				});

			$('div.timetable > div.timetable-day.past')
				.get()
				.forEach((v) => {
					const day = dayjs($(v).find('div.timetable-day__heading').text().trim() + ' 2023', {
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
