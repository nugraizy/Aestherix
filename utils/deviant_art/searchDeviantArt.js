/* global log */
import cheerio from 'cheerio';

import { fetchTEXT } from '../../helper/index.js';
import { parse } from './utils.js';

const check = (i) => (i == -1 ? undefined : i);
const _api = (input) => `https://www.deviantart.com/search?q=${input}`;

export const searchDeviantArt = (keyword) =>
	new Promise(async (resolve, reject) => {
		try {
			const data = await fetchTEXT(_api(keyword));
			const $ = cheerio.load(data);

			let json = $('body > script').get(0).firstChild.data;

			json = parse(json);

			resolve(
				Object.entries(json['@@entities'].deviation)
					.map((v) => v[1])
					.map((v) => {
						const image = `${v.media.baseUri}${v.media.types[
							check(v.media.types.findIndex((w) => w.t == 'fullview' && w.c != undefined)) ?? v.media.types.findIndex((w) => w.t == 'social_preview')
						].c?.replace('<prettyName>', v.media.prettyName)}${v.media.token?.[0] ? `?token=${v.media.token[0]}` : ''}`;

						const { pathname } = new URL(v.url);

						const username = pathname.split('/')[1];

						return {
							id: v.deviationId,
							title: v.title,
							author: username,
							authorId: v.author,
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
