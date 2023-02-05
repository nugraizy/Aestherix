/* global log */
import cheerio from 'cheerio';

import { fetchTEXT } from '../../helper/index.js';
import { parse } from './utils.js';

const check = (i) => (i === -1 ? undefined : i);

export const downloadDeviantArt = (input) =>
	new Promise(async (resolve, reject) => {
		try {
			const { pathname } = new URL(input);

			const deviantid = pathname.split('/').slice(-1)[0].split('-').slice(-1)[0];

			const data = await fetchTEXT(input);
			const $ = cheerio.load(data);

			let json = $('body > script').get(0).firstChild.data;

			json = parse(json);

			const deviation = json['@@entities'].deviation[deviantid];
			const image = `${deviation.media.baseUri}${deviation.media.types[
				check(deviation.media.types.findIndex((w) => w.t === 'fullview' && w.c != undefined)) ??
					deviation.media.types.findIndex((w) => w.t === 'social_preview')
			].c?.replace('<prettyName>', deviation.media.prettyName)}${
				deviation.media.token?.[0] ? `?token=${deviation.media.token[0]}` : ''
			}`;

			resolve({
				id: deviation.deviationId,
				title: deviation.title,
				author: deviation.author.username,
				favourites: deviation.stats.favourites,
				views: deviation.stats.views,
				source: deviation.url,
				image,
			});
		} catch (err) {
			log(err);
			reject(err);
		}
	});
