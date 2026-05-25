import { imageToPdf } from '../converter/image.js';
import { cheerioLOAD, fetchTEXT } from '../modules/index.js';

export class KomikCast {
	#base = (input) => `https://komikcast.net${input}`;
	#apiSearch = (input) => this.#base(`/?s=${encodeURIComponent(input)}`);
	constructor() {
		this.search = (keyword) =>
			new Promise(async (resolve, reject) => {
				try {
					const data = await fetchTEXT(this.#apiSearch(keyword));

					const $ = cheerioLOAD(data);

					if ($('h3.notfound').text() !== '') {
						resolve({ error: 'Comic not found. Please try another keyword.' });
					}

					const container = $('.film-list')
						.find('.animepost')
						.map((i, el) => {
							const name = $(el).find('.tt').text().trim();
							const source = $(el).find('a').attr('href');

							return { name, source };
						})
						.get();

					resolve(container);
				} catch (error) {
					reject(error);
				}
			});

		this.getDetails = async (url) =>
			new Promise(async (resolve, reject) => {
				try {
					const data = await fetchTEXT(url);

					const $ = cheerioLOAD(data);

					const getElement = (input) => $('.spe').find(`span:contains(${input})`).text().split(':')[1].trim();

					const container = {
						altTitle: getElement('Judul'),
						onGoing: getElement('Status') !== 'Tamat',
						comicType: getElement('Jenis'),
						releaseDate: getElement('Rilis'),
						serialize: getElement('Serialisasi'),
						views: getElement('Jumlah Pembaca'),
						thumbnail: $('.thumb > img').attr('src'),
						authorStr: getElement('Author'),
						artistsStr: getElement('Artis'),
						authorArr: getElement('Author').split(','),
						artistsArr: getElement('Artis').split(','),
						chapters: $('.bxcl.scrolling')
							.find('ul > li')
							.map((i, el) => $(el).find('span.dt > a').attr('href'))
							.get()
							.reverse()
					};

					resolve(container);
				} catch (error) {
					reject(error);
				}
			});

		this.getPanel = async (url) =>
			new Promise(async (resolve, reject) => {
				try {
					const data = await fetchTEXT(url);

					const $ = cheerioLOAD(data);

					const images = $('div[id=chimg]')
						.find('img')
						.map((i, el) => $(el).attr('src'))
						.get();

					resolve(images);
				} catch (error) {
					reject(error);
				}
			});

		this.toPdf = async (image) =>
			new Promise(async (resolve, reject) => {
				try {
					if (!Array.isArray(image)) {
						image = [image];
					}

					const buffer = await imageToPdf(image);

					resolve(buffer);
				} catch (error) {
					reject(error);
				}
			});
	}
}
