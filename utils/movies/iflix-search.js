import { fetchJSON } from '../../helper/index.js';

const BASE_URL = (input) => `https://www.iflix.com/id/play/${input}`;
const BASE_API_URL = (input) => `https://www.iflix.com/api/search?q=${input}`;

const parseEpisodeURL = (title, id, arr1, arr2) =>
	arr1.map(
		(v, i) =>
			`${BASE_URL(id)}-${title.replace(/\s/g, '-')}/${v}-${arr2?.[i]?.title?.replace(/[:]/g, '')?.replace(/\s/g, '-') ?? ''}`,
	);

const parser = (arr) => {
	return arr.map((v) => {
		return {
			title: v.title,
			actressStr: v.leading_actorX.join(', '),
			director: v.director === '' ? 'n/a' : v.director,
			status: v.holly_online_time ?? 'n/a',
			totEpisode: v.episode_all ?? 1,
			thumbnail: v.new_pic_hz_country_calc,
			actressArr: v.leading_actorX,
			episodes: parseEpisodeURL(v.title, v.cover_id, v.video_ids_country, v.videoDetails),
		};
	});
};

export const iflixSearch = (keyword) =>
	new Promise(async (resolve, reject) => {
		try {
			const {
				result: { result },
			} = await fetchJSON(BASE_API_URL(keyword));

			if (result.length === 0) {
				return resolve({ error: 'No result found' });
			}

			resolve(parser(result));
		} catch (err) {
			reject(err);
		}
	});
