import axios from 'axios';

import { cheerioLOAD } from '../../helper/index.js';

const _apiBase = (path = '') => `https://waifuplay.my.id${path}`;

export const wpList = (url) =>
	new Promise(async (resolve, reject) => {
		try {
			switch (url) {
				case url.includes('batch'):
					{
						const { data } = await axios.get(url);
						const $ = cheerioLOAD(data);
						const result = $('div#download > ul > li')
							.get()
							.map((element) => ({
								quality: $(element).find('b').text(),
								url: $(element).find('a').attr('href'),
							}));

						resolve({ type: 'batch', result });
					}

					break;
				default: {
					const { data } = await axios.get(url);
					const $ = cheerioLOAD(data);
					const result = $('.series-episodelist > li')
						.get()
						.map((element) => ({
							episode: Number(
								$(element)
									.find('a > span')
									.map((i, _) => $(_).text())
									.get(0)
									.replace('Episode ', ''),
							),
							url: $(element).find('a').attr('href'),
						}))
						.sort((a, b) => a.episode - b.episode);

					resolve({ type: 'episode', result });
				}
			}
		} catch (err) {
			reject(err);
		}
	});

export const wpSearch = (text) =>
	new Promise(async (resolve, reject) => {
		try {
			const { data } = await axios.get(_apiBase(`/${text}`));
			const $ = cheerioLOAD(data);

			if ($('div.pagenon > h2').text() == 'No Post Found') {
				return resolve({
					error:
						'Anime not found. Try another keyword. If you sure if this keyword belongs to a few Anime title and you see this error keep happening, please report to owner ASAP.',
				});
			}

			const listEpisode = await wpList($('.flexbox2-item').find('a').attr('href'));

			const result = {
				title: $('.flexbox2-item').find('a').attr('title'),
				image: $('.flexbox2-item')
					.find('img')
					.attr('src')
					.replace('?resize=225,310', '')
					.replace('waifuplay.me', 'waifuplay.my.id'),
				score: $('.flexbox2-item').find('.score').text(),
				studio: $('.flexbox2-item')
					.find('.flexbox2-title > span')
					.map((i, el) => $(el).text())
					.get(1),
				season: $('.flexbox2-item').find('.season').text(),
				type: $('.flexbox2-item').find('.type').text(),
				genre: $('.flexbox2-item').find('.genres').text(),
				link: $('.flexbox2-item').find('a').attr('href').replace('waifuplay.me', 'waifuplay.my.id'),
				sysnopsis: $('.flexbox2-item').find('.synops').text(),
				listEpisode,
			};

			resolve(result);
		} catch (err) {
			reject(err);
		}
	});

export const wpDownload = (url) =>
	new Promise(async (resolve, reject) => {
		try {
			const { data } = await axios.get(url);
			const $ = cheerioLOAD(data);
			const result = $('.dlbox2 > a')
				.get()
				.map((element) => {
					return {
						quality: $(element).text() || '',
						url: $(element).attr('href') || '',
					};
				});

			resolve(result);
		} catch (err) {
			reject(err);
		}
	});

export const wpLatest = () =>
	new Promise(async (resolve, reject) => {
		try {
			const { data } = await axios.get(_apiBase('/'));
			const $ = cheerioLOAD(data);

			const container = {
				result: $('.flexbox')
					.map((_, element) => $(element).find('.flexbox-item'))
					.get(1)
					.get()
					.map((element) => ({
						title: $(element).find('.flexbox-title').text(),
						episode: $(element).find('.flexbox-episode').text().replace('Episode', ''),
						image: $(element)
							.find('img')
							.attr('src')
							.replace('?resize=225,310', '')
							.replace('waifuplay.me', 'waifuplay.my.id'),
						status: $(element).find('.flexbox-status').text(),
						type: $(element).find('.flexbox-type').text(),
						link: $(element).find('a').attr('href').replace('waifuplay.me', 'waifuplay.my.id'),
					})),
			};

			resolve(container);
		} catch (err) {
			reject(err);
		}
	});
