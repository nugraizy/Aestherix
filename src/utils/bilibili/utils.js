import { formatViews } from '../modules/index.js';

export const _api = {
	id: {
		base: (code) => `https://www.bilibili.tv/id/video/${code}`,
		search: (keyword) =>
			`https://api.bilibili.tv/intl/gateway/web/v2/search_v2?keyword=${keyword}&platform=web&s_locale=id_ID&pn=1&ps=20`,
		file: (aid) =>
			`https://api.bilibili.tv/intl/gateway/web/playurl?s_locale=id_ID&platform=web&aid=${aid}&qn=112&type=0&device=wap&tf=0&spm_id=bstar-web.ugc-video-detail.0.0&from_spm_id=bstar-web.search-result.0.0`
	}
};

export const bilibiliParseMetadataTv = (obj) => {
	const { title, aid, cover, author, duration, view } = obj;

	return {
		title,
		aid,
		cover,
		source: _api.id.base(aid),
		author: author.nickname,
		views: formatViews(view.match(/\d+/g).join('')),
		duration
	};
};
