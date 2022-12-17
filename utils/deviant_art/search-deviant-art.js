/* global log */
import axios from 'axios';

import { parse } from './utils.js';

const check = (i) => (i == -1 ? undefined : i);
const _api = (input) => `https://www.deviantart.com/search?q=${input}`;

export const searchDeviantArt = (keyword) =>
	new Promise(async (resolve, reject) => {
		try {
			const { data } = await axios.get(_api(keyword), {
				headers: {
					cookie:
						'auth_secure=__22949efc1a2ea35ed595%3B%229bb6ef8963e8021e9483155f65618c53%22; userinfo=__4f832e5d7d96f01b8a45%3B%7B%22username%22%3A%22nugradizy%22%2C%22uniqueid%22%3A%2235d655a1336f1c5c2cd3398846990ce2%22%2C%22dvs9-1%22%3A1%2C%22ab%22%3A%22tao-acs-1-b-6%7Ctao-s2p-1-a-6%7Ctao-515-1-a-5%22%7D; auth=__0bbdedc3de3063c9f646%3B%229813a57950ffb6c93519109b1a66d60d%22; vd=__f4fbdcb154f81b685fce%3B%22Bjg0%5C%2Fl%2CBjmNL%2B%2CA%2CF%2CA%2C%2CB%2CA%2CB%2CBjmNL%2B%2CBjmNQ%2B%2CA%2CA%2CA%2CA%2C13%2CA%2CB%2CA%2CA%2CA%2CA%2CB%2CA%2CA%2C%22; td=7:944%3B12:335x626%3B13:952%3B20:886',
					'user-agent':
						'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.81 Safari/537.36',
				},
				validateStatus: () => true,
			});

			const json = parse(data);

			resolve(
				Object.entries(json['@@entities'].deviation)
					.map((v) => v[1])
					.map((v) => {
						const image = `${v.media.baseUri}${v.media.types[
							check(v.media.types.findIndex((w) => w.t == 'fullview' && w.c != undefined)) ??
								v.media.types.findIndex((w) => w.t == 'social_preview')
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
