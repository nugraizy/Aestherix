import axios from 'axios';
import cheerio from 'cheerio';

const _api = (input) => `https://3hentai.net/d/${input}`;

export const _3hentai = (code) =>
	new Promise(async (resolve, reject) => {
		try {
			const { data } = await axios.get(_api(code), {
				headers: {
					'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.81 Safari/537.36',
				},
			});

			const $ = cheerio.load(data);

			const getElement = (input) =>
				$(`.tag-container.field-name:contains(${input}:)`)
					.find('a')
					.map((i, el) => $(el).text().trim())
					.get();

			const details = {
				title: $('title').text(),
				uploadDate: $('time').text(),
				tags: getElement('Tags'),
				artists: getElement('Artists'),
				language: getElement('Languages'),
				categories: getElement('Categories'),
				images: $('div.single-thumb-col')
					.map((i, el) => $(el).find('img').attr('data-src'))
					.get()
					.map((v) => v.replace('t.', '.')),
			};

			details.totalPages = details.images.length;

			resolve(details);
		} catch (error) {
			reject(error);
		}
	});
