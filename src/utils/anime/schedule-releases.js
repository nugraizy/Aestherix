import axios from 'axios';
import FormData from 'form-data';

import { convertToDates, query, sortDates } from './utils.js';

const _api = (path) => ({
	AL: 'https://allanime.to/anime/' + path,
	GOGO: 'https://gogoanime.cl/' + path
});

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
