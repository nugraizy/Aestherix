/* global log */
import { fetchJSON } from '../../Helper/index.js';
import { URL_API_SEARCH } from './api.js';

const check = (i) => (i == -1 ? undefined : i);

export const searchDeviantArt = (keyword) =>
	new Promise(async (resolve, reject) => {
		try {
			const data = await fetchJSON(URL_API_SEARCH(keyword));

			if ('errorCode' in data) {
				return resolve({ error: 'No art found with this keyword.' });
			}

			resolve(
				data.deviations.map((v) => {
					const image = `${v.media.baseUri}${v.media.types[
						check(v.media.types.findIndex((w) => w.t == 'fullview' && w.c != undefined)) ?? v.media.types.findIndex((w) => w.t == 'social_preview')
					].c?.replace('<prettyName>', v.media.prettyName)}${v.media.token?.[0] ? `?token=${v.media.token[0]}` : ''}`;

					return {
						id: v.deviationId,
						title: v.title,
						author: v.author.username,
						favourites: v.stats.favourites,
						views: v.stats.views,
						source: v.url,
						image,
					};
				}),
			);
		} catch (err) {
			log(err);
			reject(err);
		}
	});
