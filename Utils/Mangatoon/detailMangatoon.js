import { cheerioLOAD, fetchTEXT } from '../../Helper/index.js';

const BASE_URL = (id) => `https://mangatoon.mobi/en/made-by-nanda?content_id=${id}`;
const READS_URL = (input) => `https://mangatoon.mobi/en${input}`;

export const getDetailMangatoon = (id) =>
	new Promise(async (resolve, reject) => {
		try {
			const data = await fetchTEXT(BASE_URL(id));
			const $ = cheerioLOAD(data);

			if ($('.list-item').length !== 0) {
				return resolve({ error: 'Manga not found, Try another URL.' });
			}

			resolve({
				title: $('span.detail-title.select-text').text(),
				author: $('.detail-author-name.select-text').text().trim().split('Author Name: ')[1],
				status: $('.detail-status').text().trim(),
				ratings: $('.detail-score-points.select-text').text(),
				totalEpisodes: $('.episode-content.episode-content-asc > .selected-episodes.selected-tag > .episodes-wrap-new > a.episode-item-new')
					.map((i, el) => $(el).attr('href'))
					.get().length,
				totalComments: $('.detail-episode-num')
					.text()
					.match(/\((.*?)\)/)[1],
				totalViews: $('span.view-count').text(),
				totalLikes: $('span.like-count').text(),
				descriptions: $('.detail-description-short > p').text().split('MangaToon got ')[0].trim(),
				genreStr: $('.detail-tags-info.select-text')
					.text()
					.split('/')
					.map((v) => v.trim())
					.join(', '),
				genreArr: $('.detail-tags-info.select-text')
					.text()
					.split('/')
					.map((v) => v.trim()),
				episodes: $('.episode-content.episode-content-asc > .selected-episodes.selected-tag > .episodes-wrap-new > a.episode-item-new')
					.map((i, el) => READS_URL($(el).attr('href')))
					.get(),
			});
		} catch (err) {
			reject(err);
		}
	});
