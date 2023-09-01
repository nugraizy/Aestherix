import fs from 'fs-extra';
import dayjs from 'dayjs';

/**
 * @typedef {'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'} Days
 * @typedef {{url: string, title: string, totalEpisode: number, totalViews: number, thumbnail: string}[]} ItemsContainer
 * @typedef {ResultParsed[] & {streams: {server: string, items: ItemsContainer}}[]} StreamsContainer
 * @typedef {Record<Days, ResultParsed[]>} ResultParsedSorted
 * @typedef {Record<Days, StreamsContainer>} Results
 */

export const query = await fs.readFile('./src/utils/anime/query.graphql', 'utf-8');
const maps = {
	0: [1, 2, 3, 4, 5, 6],
	1: [2, 3, 4, 5, 6, 0],
	2: [3, 4, 5, 6, 0, 1],
	3: [4, 5, 6, 0, 1, 2],
	4: [5, 6, 0, 1, 2, 3],
	5: [6, 0, 1, 2, 3, 4],
	6: [0, 1, 2, 3, 4, 5]
};

/**
 * Convert the release timestamp to readable days of the weeks.
 * @typedef {{title: string, id: string, release: number}} ResultRaw
 * @typedef {{title: string, id: string, release: number, date: string, time: string, indexDate: number}} ResultParsed
 * @param {ResultRaw[]} arr
 * @returns {ResultParsed}
 * @throws {Error}
 */
export const convertToDates = (arr) => {
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
export const sortDates = (arr) => {
	const datesNow = dayjs().day();

	const dates = {};
	const todaySchedule = arr.filter((v) => v.indexDate === datesNow);

	dates[todaySchedule[0].date] = todaySchedule.sort((a, b) =>
		dayjs(a.time, 'HH:mm').unix() > dayjs(b.time, 'HH:mm').unix()
			? 1
			: dayjs(a.time, 'HH:mm').unix() < dayjs(b.time, 'HH:mm').unix()
			? -1
			: 0
	);

	for (const date of maps[datesNow]) {
		const day = dayjs().day(date).format('dddd');

		dates[day] = arr
			.filter((v) => v.indexDate === date)
			.sort((a, b) =>
				dayjs(a.time, 'HH:mm').unix() > dayjs(b.time, 'HH:mm').unix()
					? 1
					: dayjs(a.time, 'HH:mm').unix() < dayjs(b.time, 'HH:mm').unix()
					? -1
					: 0
			);
	}

	return dates;
};
