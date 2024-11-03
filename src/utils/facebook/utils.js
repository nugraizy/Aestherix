import { load } from 'cheerio';
import { fetchTEXT } from '../modules/index.js';

/**
 * Parse html facebook downloader.
 * @param {string} data
 * @typedef {{timestamp: string, thumbnail: string, links: {quality: string, url: string}[]}} ParsedFacebookResponse
 * @returns {ParsedFacebookResponse}
 */
export const parse = (data) => {
	const $ = load(data);

	const videos = $('tbody tr')
		.filter((_, el) => $(el).find('a[href]').length > 0)
		.map((_, el) => {
			const quality = $(el).find('.video-quality').text().trim();
			const url = $(el).find('a').attr('href');

			return {
				quality,
				url
			};
		})
		.get();

	return {
		timestamp: $('.clearfix > p').text(),
		thumbnail: $('.image-fb.open-popup > img').attr('src'),
		links: videos
	};
};

export const getTokens = async () => {
	const html = await fetchTEXT('https://fdownloader.net/en');

	const $ = load(html);

	const js = $('div.container-app > script').text();

	const tokens = eval(`(() => {
		${js}

		return {
			k_exp,
			k_token
		}
	})()`);

	return tokens;
};
