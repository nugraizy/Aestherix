import dayjs from 'dayjs';

const maps = {
	0: [1, 2, 3, 4, 5, 6],
	1: [2, 3, 4, 5, 6, 0],
	2: [3, 4, 5, 6, 0, 1],
	3: [4, 5, 6, 0, 1, 2],
	4: [5, 6, 0, 1, 2, 3],
	5: [6, 0, 1, 2, 3, 4],
	6: [0, 1, 2, 3, 4, 5]
};
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * @param {import('cheerio').Cheerio} $
 * @param {import('cheerio').Cheerio} data
 * @returns
 */
export const parseSchedule = ($, data) => {
	const container = [];

	data
		.find('div.timetable-timeslot')
		.get()
		.forEach((v) => {
			const time = $(v).find('div.timetable-timeslot__time > span.time').text().trim();

			const anime = $(v)
				.find('div.timetable-anime-block')
				.get()
				.map((w) => {
					const info = $(w).find('a.title');
					const episode = $(w).find('div.footer').text().trim();
					const thumbnail = $(w).find('div.poster > img').attr('srcset').split(', ')[1].replace(' 2x', '');
					const title = info.attr('title').trim();
					const link = 'https://www.livechart.me' + info.attr('href');

					return {
						title,
						episode,
						link,
						thumbnail
					};
				});

			if (time !== '') {
				container.push({ [time]: anime });
			}
		});

	return container;
};

export const createDaysContainer = (day) => {
	const TODAY = dayjs(day, { format: 'ddd MMM DD YYYY' }).format('dddd');

	const DAYS_ASCENDING = maps[DAYS.indexOf(TODAY)];

	const DAYS_SORTED = {};

	DAYS_ASCENDING.forEach((day, i) => {
		if (i === 0) {
			DAYS_SORTED[TODAY] = [];
		}

		DAYS_SORTED[DAYS[day]] = [];
	});

	return DAYS_SORTED;
};
