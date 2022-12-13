import axios from 'axios';
import cheerio from 'cheerio';

const _imageType = (input) => {
	if (input === 'p' || input === 'png') {
		return 'png';
	} else if (['j', 'jpg', 'jpeg'].includes(input)) {
		return 'jpeg';
	} else if (input === 'g' || input === 'gif') {
		return 'gif';
	}
};

export const nhentai = async (code) =>
	new Promise(async (resolve, reject) => {
		try {
			const { data } = await axios.get(`http://138.2.77.198:3002/g/${code}/`);

			const $ = cheerio.load(data);

			const json = eval($('script').get()[2].children[0].data.replace('window._gallery = ', ''));

			const details = {
				titles: json.title,
				uploadDate: json.upload_date,
				totPages: json.num_pages,
				totFavorites: json.num_favorites,
				tags: json.tags.map((v) => v.name),
				images: json.images.pages.map((v, i) => `https://i.nhentai.net/galleries/${json.media_id}/${i + 1}.${_imageType(v.t)}`),
			};

			resolve(details);
		} catch (err) {
			reject(err);
		}
	});
