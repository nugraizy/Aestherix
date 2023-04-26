import axios from 'axios';
import dayjs from 'dayjs';
import FormData from 'form-data';
import fs from 'fs-extra';

/**
 * @typedef {'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'} Days
 * @typedef {{url: string, title: string, totalEpisode: number, totalViews: number, thumbnail: string}[]} ItemsContainer
 * @typedef {ResultParsed[] & {streams: {server: string, items: ItemsContainer}}[]} StreamsContainer
 * @typedef {Record<Days, ResultParsed[]>} ResultParsedSorted
 * @typedef {Record<Days, StreamsContainer>} Results
 */

const query = await fs.readFile('./src/utils/anime/query.graphql', 'utf-8');
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

const _api = (path) => ({
	AL: 'https://allanime.to/anime/' + path,
	GOGO: 'https://gogoanime.cl/' + path
});

/**
 * Sort the days of the week into full circle.
 * @param {ResultParsed} arr
 * @returns {ResultParsedSorted}
 */
const sortDates = (arr) => {
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

/**
 * Get release schedule from anilist.co.
 * @returns {Promise<Results>}
 */
export const animeReleases = () =>
	new Promise(async (resolve, reject) => {
		try {
			let data = [];
			let page = 1;

			for (;;) {
				const {
					data: { data: response }
				} = await axios.post(
					'https://graphql.anilist.co/',
					{
						query,
						variables: {
							season: 'SPRING',
							year: 2023,
							format: 'TV',
							page
						}
					},
					{
						headers: {
							'Content-Type': 'application/json',
							Referer: 'https://anichart.net/',
							'User-Agent':
								'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 YaBrowser/23.1.5.750 (beta) Yowser/2.5 Safari/537.36'
						}
					}
				);

				data = data.concat(response.Page.media);

				page += 1;

				if (!response.Page.pageInfo.hasNextPage) {
					break;
				}
			}

			const container = sortDates(
				convertToDates(
					data
						.filter((v) => v.airingSchedule.nodes.length > 0)
						.map((v) => ({
							titleRomaji: v.title.romaji,
							titleNative: v.title.native,
							id: v.idMal,
							release: parseInt(v.airingSchedule.nodes[0].airingAt * 1000),
							totalEp: v.airingSchedule.nodes[0].episode - 1
						}))
				)
			);

			for (const obj in container) {
				for (const val of container[obj]) {
					const form = new FormData();

					form.append('recomended', val.id);

					const {
						data: { data }
					} = await axios.post('https://animixplay.to/api/search', form, {
						headers: {
							...form.getHeaders(),
							'user-agent':
								'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 YaBrowser/23.1.5.750 (beta) Yowser/2.5 Safari/537.36'
						}
					});

					val.streams = data
						.filter((v) => v.type !== 'RUSH')
						.map((v) => ({
							server: v.type,
							items: v.items
								.filter((w) => !w.url.includes('dub'))
								.map((w) => ({
									url: `${_api(w.url.split('/')[w.url.split('/').length - 1])[v.type]}${
										v.type === 'GOGO' ? `-episode-${val.totalEp}` : ''
									}`,
									title: `${val.titleRomaji} ${val.titleNative}`,
									totalEpisode: val.totalEp,
									totViews: w.views,
									thumbnail: w.img
								}))
						}));
				}
			}

			for (const obj in container) {
				container[obj] = container[obj].filter((v) => v.streams.length > 0);
			}

			resolve(container);
		} catch (error) {
			reject(error);
		}
	});
