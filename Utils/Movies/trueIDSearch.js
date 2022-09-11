import { fetchJSON } from '../../Helper/index.js';

const BASE_URL = (input) => `https://trueid.id/series/${input}/${input}`;
const BASE_API_URL_SEARCH = (input) => `https://trueid.id/cmsProxy/search/searches?keyword=${input}&content_type=movie`;
const BASE_API_URL_DETAIL = (input) => `https://trueid.id/cmsProxy/contents/vod-contents/${input}`;
const BASE_URL_EPISODES = (idVideo, idItems, idEpisode, idSeries, slugTitle) => `https://trueid.id/watch/series/${idVideo}/${idItems}/${idEpisode}/${idSeries}/${slugTitle}`;

const parseEpisode = async (url) => {
	const { data } = await fetchJSON(url);

	return {
		category: data.article_category,
		views: data.count_views,
		published: data?.publish_date ?? 'N/A',
		actressStr: data.actor?.join(', ') ?? 'N/A',
		actressArr: data?.actor ?? [],
		director: data.director?.join(', ') ?? 'N/A',
		genre: data.genres.join(', '),
		totEpisode: Number(data.ep_total) || 1,
		episodes:
			data.vod_items.map((v) => {
				const idItems = v.id;

				return v.vod_items.map((w) => BASE_URL_EPISODES(data.id, idItems, w.id, w.ep_items[0].id, data.slug_title));
			})?.[0] ?? [],
	};
};

const parse = async (arr) => {
	return await Promise.all(
		arr.map(async (v) => {
			const data = await parseEpisode(BASE_API_URL_DETAIL(v.id));

			return {
				title: v.title,
				id: v.id,
				releaseDate: v.release_year,
				thumbnail: v.thumb_list.trueid_landscape,
				sourceMovie: BASE_URL(v.id),
				detailed: data,
			};
		}),
	);
};

export const trueidSearch = (keyword) =>
	new Promise(async (resolve, reject) => {
		try {
			const { data } = await fetchJSON(BASE_API_URL_SEARCH(keyword));

			if (data.length == 0) {
				return resolve({ error: 'No result found' });
			}

			resolve(await parse(data));
		} catch (err) {
			reject(err);
		}
	});
