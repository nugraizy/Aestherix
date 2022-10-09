import { fetchJSON } from '../../helper/index.js';

const URL_VISUAL = (input) => `https://akcdn.detik.net.id/visual/${input}`;

const parse = (arr) => {
	return arr.map((v) => {
		v.strisi = v.strisi.replace(/<[^>]*>/g, '');
		return {
			title: v.strjudul,
			body: v.strisi,
			places: v.strnmkota,
			published: v.dtnewsdate,
			image: URL_VISUAL(`${v.image[0].strnmfile + v.image[0].extension}?w=1080`),
			link: v.url,
		};
	});
};

export const cnnindonesia = (keyword) =>
	new Promise(async (resolve, reject) => {
		try {
			const { data: json } = await fetchJSON('https://www.cnnindonesia.com/api', {
				method: 'POST',
				headers: {
					'Accept-Action': 'search',
				},
				body: JSON.stringify({
					query: keyword,
					limit: 10,
					typechannel: 5,
					type: 3,
				}),
			});

			if (!json) {
				return resolve({ error: 'data not found' });
			}

			resolve(parse(json));
		} catch (err) {
			reject(err);
		}
	});
