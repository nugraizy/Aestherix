/* eslint-disable camelcase */

import { Cache } from '../../helper/modules/cache.js';

export const CACHE_MANAGER = new Cache({
	limit: 40
});

export const extractVideoId = (url) => {
	const match = url.match(/(?:youtube\.com\/(?:shorts\/)?(?:watch\?.*(?:|&)v=|embed\/|v\/)|youtu\.be\/)?\/(.+)/);

	return match?.[1];
};

export const filterQualities = (items, format) => {
	const qualities =
		format === 'mp4' ? ['480p', '360p', '240p', '144p', '720p', '1080p'] : ['128kbps', '64kbps', '256kbps', '320kbps'];

	let video = null;

	while (!video) {
		const quality = qualities.shift();

		video = items.find((item) => item.quality === quality);
	}

	return video;
};

const genericConvertParser = (data) => {
	const { dlink, ftype, title, vid } = data;

	return {
		title,
		vid,
		type: ftype,
		file: dlink
	};
};
const genericAjaxParser = (data) => {
	const { a: author, links, title, vid } = data;

	const mp4Props = links.mp4;
	const mp3Props = links.mp3;

	const combinedProps = {
		...mp4Props,
		...mp3Props
	};

	const items = Object.keys(combinedProps)
		.filter((key) => {
			return key !== 'auto' && !/\.m4a/.test(mp3Props?.[key]?.q);
		})
		.map((key) => {
			const prop = combinedProps[key];

			return {
				size: prop.size,
				type: prop.f,
				quality: prop.q,
				k: prop.k
			};
		});

	return {
		author,
		title,
		vid,
		items
	};
};

export const constant = {
	v1: {
		urlBase: 'https://www.y2mate.com',
		search: {
			path: '/mates/analyzeV2/ajax',
			form: {
				k_query: '',
				k_page: 'home',
				hl: 'en',
				q_auto: 0
			},
			parser: (data) => data.vitems
		},
		ajax: {
			path: '/mates/analyzeV2/ajax',
			form: {
				k_query: '',
				k_page: 'home',
				hl: 'en',
				q_auto: 0
			},
			parser: (data) => genericAjaxParser(data)
		},
		convert: {
			path: '/mates/convertV2/index',
			form: {
				k: '',
				vid: ''
			},
			parser: (data) => genericConvertParser(data)
		}
	},
	v2: {
		urlBase: 'https://tomp3.cc',
		search: { path: '/api/ajax/search?hl=en', form: { query: '', vt: 'mp3' }, parser: (data) => data.items },
		ajax: { path: '/api/ajax/search', form: { query: '', vt: 'downloader' }, parser: (data) => genericAjaxParser(data) },
		convert: { path: '/api/ajax/convert', form: { vid: '', k: '' }, parser: (data) => genericConvertParser(data) }
	}
};
