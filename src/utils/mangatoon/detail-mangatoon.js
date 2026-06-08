import { cheerioLOAD, fetchTEXT } from '../modules/index.js';

const BASE_URL = (id) => `https://mangatoon.mobi/en/made-by-nanda?content_id=${id}`;
const READS_URL = (input) => `https://mangatoon.mobi${input}`;

const isAppOnly = ($) =>
	$('title').text().includes('404') || ($('body').text().includes('copyright') && $('body').text().includes('APP'));

export const getDetailMangatoon = (id) =>
	new Promise(async (resolve, reject) => {
		try {
			const data = await fetchTEXT(BASE_URL(id));
			const $ = cheerioLOAD(data);

			if (isAppOnly($)) {
				return resolve({ error: 'This comic is only available in the MangaToon app.' });
			}

			if ($('.list-item').length !== 0) {
				return resolve({ error: 'Manga not found, Try another URL.' });
			}

			resolve({
				title: $('span.detail-title.select-text').text(),
				author: $('.detail-author-name.select-text').text().trim().split('Author Name: ')[1],
				status: $('.detail-status').text().trim(),
				ratings: $('.detail-score-points.select-text').text(),
				totalEpisodes: $(
					'.episode-content.episode-content-asc > .selected-episodes.selected-tag > .episodes-wrap-new > a.episode-item-new'
				)
					.map((i, el) => $(el).attr('href'))
					.get().length,
				totalComments: $('.detail-episode-num')
					.text()
					.match(/\((.*?)\)/)[1],
				totalViews: $('span.view-count').text(),
				totalLikes: $('span.like-count').text(),
				description: $('.detail-description-short > p').text().split('MangaToon got ')[0].trim(),
				genre: $('.detail-tags-info.select-text')
					.text()
					.split('/')
					.map((v) => v.trim()),
				episodes: $(
					'.episode-content.episode-content-asc > .selected-episodes.selected-tag > .episodes-wrap-new > a.episode-item-new'
				)
					.map((i, el) => {
						const likeViewText = $(el).find('.episode-like-view').text();
						const likeMatch = likeViewText.match(/\u00a0([\d.k]+)\s/);

						const viewMatch = likeViewText.match(/\u00a0([\d.k]+)\s*$/);

						return {
							episode: $(el).find('.item-top > .episode-title-new').not('.episode-number').text().trim(),
							time: $(el).find('span.open-date').text().trim(),
							likes: likeMatch ? likeMatch[1] : '',
							views: viewMatch ? viewMatch[1] : '',
							url: READS_URL($(el).attr('href'))
						};
					})
					.get()
			});
		} catch (err) {
			reject(err);
		}
	});
