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
 * @param {import('cheerio').CheerioAPI} $
 * @param {import('cheerio').Cheerio} data
 * @returns
 */
export const parseSchedule = ($, data) => {
	const container = [];

	data
		.find('div.lc-timetable-timeslot')
		.get()
		.forEach((v) => {
			const time = $(v).find('div.lc-timetable-timeslot__time > span.lc-time').text().trim();

			const anime = $(v)
				.find('div.lc-timetable-anime-block')
				.get()
				.map((w) => {
					const info = $(w).find('a[data-schedule-anime-target="preferredTitle"]');
					const episode = $(w).find('span.font-medium').text().trim();
					const thumbnail = $(w).find('img').attr('srcset').split(', ')[1].replace(' 2x', '');
					const title = info.attr('title').trim();
					const link = 'https://www.livechart.me' + info.attr('href');

					return {
						title,
						episode,
						link,
						thumbnail
					};
				});

			if (!anime.length && $(v).has('.lc-timetable-timeslot__note') && time) {
				const title = $(v).find('.truncate > a.lc-timetable-timeslot__note__anime-title').text().trim();
				const note = $(v).find('.lc-markdown-html').text().trim().split('\n').join(' ');
				const source = $(v).find('a:contains(Source)').attr('href');
				const link =
					'https://www.livechart.me' + $(v).find('.truncate > a.lc-timetable-timeslot__note__anime-title').attr('href');

				anime.push({ title, note, link, source });
			}

			if (time !== '') {
				container.push({ [time]: anime.length ? anime : [] });
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
