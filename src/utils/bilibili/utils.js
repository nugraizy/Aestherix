import { convertSecondstoTime, formatViews } from '../modules/index.js';

export const _api = {
	en: {
		base: (code) => `https://www.bilibili.com/video/${code}`,
		search: (keyword) =>
			`https://api.bilibili.com/x/web-interface/search/type?keyword=${keyword}&page=1&pagesize=3&search_type=video&order=totalrank`,
		detail: (aid) => `https://api.bilibili.com/x/web-interface/view?aid=${aid}&bvid=`,
		file: (aid, cid) =>
			`https://api.bilibili.com/x/player/playurl?cid=${cid}&avid=${aid}&qn=0&type=&otype=json&fnver=0&fnval=4048&fourk=1`
	},
	id: {
		base: (code) => `https://www.bilibili.tv/id/video/${code}`,
		search: (keyword) =>
			`https://api.bilibili.tv/intl/gateway/web/v2/search_v2?keyword=${keyword}&platform=web&s_locale=id_ID&pn=1&ps=20`,
		file: (aid) =>
			`https://api.bilibili.tv/intl/gateway/web/playurl?s_locale=id_ID&platform=web&aid=${aid}&qn=112&type=0&device=wap&tf=0&spm_id=bstar-web.ugc-video-detail.0.0&from_spm_id=bstar-web.search-result.0.0`
	}
};

export const bilibiliParseMetadataEn = (obj) => {
	const {
		title,
		owner: { name: author, mid: authorId },
		stat: { like, favorite, share, view },

		pic: thumbnail,
		desc: description,
		bvid,
		dash: {
			duration,
			video: [{ baseUrl: videoUrl }],
			audio: [{ baseUrl: audioUrl }]
		}
	} = obj;

	return {
		title,
		author,
		authorId,
		like,
		share,
		duration: convertSecondstoTime(duration),
		favorite,
		view,
		description: description === '' ? 'No Description' : description,
		originalVideoLink: _api.en.base(bvid),
		thumbnail,
		videoUrl,
		audioUrl
	};
};

export const bilibiliParseMetadataTv = (obj) => {
	const { title, aid, cover, author, duration, view } = obj;

	return {
		title,
		aid,
		cover,
		source: _api.id.base(aid),
		author: author.nickname,
		view: formatViews(view),
		duration
	};
};
