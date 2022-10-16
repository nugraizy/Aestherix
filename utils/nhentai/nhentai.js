import axios from 'axios';
import cheerio from 'cheerio';
import fs from 'fs-extra';

import { getCookie } from './cookies.js';

let cookie = '';

export const nhentai = async (code) =>
	new Promise(async (resolve, reject) => {
		try {
			if (!fs.existsSync('./config/nh_cookies.txt')) {
				cookie = await getCookie();
			} else if (cookie == '') {
				cookie = await getCookie();
			}

			const { data } = await axios.get(`https://nhentai.net/g/${code}/`, {
				headers: {
					Cookie: cookie,
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36',
					Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
				},
			});

			const $ = cheerio.load(data);

			const json = eval($('script').get()[2].children[0].data.replace('window._gallery = ', ''));

			const details = {
				titles: json.title,
				uploadDate: json.upload_date,
				totPages: json.num_pages,
				totFavorites: json.num_favorites,
				tags: json.tags.map((v) => v.name),
				images: json.images.pages.map((v, i) => `https://i.nhentai.net/galleries/${json.media_id}/${i + 1}.${v.t == 'j' ? 'jpg' : 'png'}`),
			};

			resolve(details);
		} catch (err) {
			reject(err);
		}
	});
