import { cheerioLOAD, fetchTEXT } from '../modules/index.js';

const BASE_URL = 'https://mangatoon.mobi';

const isAppOnly = ($) =>
	$('title').text().includes('404') || ($('body').text().includes('copyright') && $('body').text().includes('APP'));

function normalizeSearchItem(el, $) {
	const href = $(el).find('a').attr('href') || '';

	return {
		id: new URL(href, BASE_URL).searchParams.get('content_id') || '',
		title: $(el).find('.recommend-comics-title > span').text(),
		url: `${BASE_URL}${href}`,
		poster: $(el).find('.comics-image > img').attr('data-src') || $(el).find('.comics-image > img').attr('src') || '',
		genres: $(el)
			.find('.comics-type > span')
			.text()
			.trim()
			.split('/')
			.map((v) => v.trim())
			.filter(Boolean)
	};
}

function normalizeEpisode(el, $) {
	const likeViewText = $(el).find('.episode-like-view').text();
	const likeMatch = likeViewText.match(/\u00a0([\d.k]+)\s/);
	const viewMatch = likeViewText.match(/\u00a0([\d.k]+)\s*$/);

	return {
		number: $(el).find('.item-top > .episode-title-new').not('.episode-number').text().trim(),
		time: $(el).find('span.open-date').text().trim(),
		likes: likeMatch ? likeMatch[1] : '',
		views: viewMatch ? viewMatch[1] : '',
		url: `${BASE_URL}${$(el).attr('href')}`
	};
}

class MangaToon {
	constructor({ baseUrl = BASE_URL, fetchImpl = fetchTEXT } = {}) {
		this.baseUrl = baseUrl;
		this.fetchImpl = fetchImpl;
	}

	async search(query) {
		if (!query) {
			return { error: 'Please provide a search query.' };
		}

		const data = await this.fetchImpl(`${this.baseUrl}/en/search?word=${encodeURIComponent(query)}`);
		const $ = cheerioLOAD(data);

		if ($('.no-result').length !== 0) {
			return { error: $('.no-result-word').text() || 'No results found.' };
		}

		const items = $('.recommend-comics > .recommend-item')
			.map((i, el) => normalizeSearchItem(el, $))
			.get();

		return { items };
	}

	async getDetail(id) {
		if (!id) {
			return { error: 'Please provide a manga ID.' };
		}

		const data = await this.fetchImpl(`${this.baseUrl}/en/made-by-nanda?content_id=${id}`);
		const $ = cheerioLOAD(data);

		if (isAppOnly($)) {
			return { error: 'This comic is only available in the MangaToon app.' };
		}

		if ($('.list-item').length !== 0) {
			return { error: 'Manga not found, Try another URL.' };
		}

		const commentsText = $('.detail-episode-num').text();
		const commentsMatch = commentsText.match(/\((.*?)\)/);

		const episodes = $(
			'.episode-content.episode-content-asc > .selected-episodes.selected-tag > .episodes-wrap-new > a.episode-item-new'
		)
			.map((i, el) => normalizeEpisode(el, $))
			.get();

		return {
			id,
			title: $('span.detail-title.select-text').text(),
			author: $('.detail-author-name.select-text').text().trim().split('Author Name: ')[1] || '',
			status: $('.detail-status').text().trim(),
			ratings: $('.detail-score-points.select-text').text(),
			totalEpisodes: episodes.length,
			totalComments: commentsMatch ? commentsMatch[1] : '0',
			totalViews: $('span.view-count').text(),
			totalLikes: $('span.like-count').text(),
			description: $('.detail-description-short > p').text().split('MangaToon got ')[0].trim(),
			genres: $('.detail-tags-info.select-text')
				.text()
				.split('/')
				.map((v) => v.trim())
				.filter(Boolean),
			episodes,
			url: `${this.baseUrl}/en/made-by-nanda?content_id=${id}`
		};
	}

	async getChapter(url) {
		if (!url) {
			return { error: 'Please provide a chapter URL.' };
		}

		const data = await this.fetchImpl(url);
		const $ = cheerioLOAD(data);

		if (isAppOnly($)) {
			return { error: 'This comic is only available in the MangaToon app.' };
		}

		if ($('div.lock-top-text').text() === 'This chapter is not unlocked yet') {
			return { error: 'This chapter is not unlocked yet.' };
		}

		const pages = $('.watch-page > .pictures')
			.find('img.lazyload_img')
			.map((i, el) => $(el).attr('data-src'))
			.get()
			.filter(Boolean);

		if (!pages.length) {
			return { error: 'No pages found for this chapter.' };
		}

		return { pages };
	}
}

export { MangaToon };
