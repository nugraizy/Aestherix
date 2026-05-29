import { fetchJSON } from '../modules/index.js';
import { bilibiliParseMetadataTv } from './utils.js';

const API_BASE = 'https://api.bilibili.tv/intl/gateway';
const HEADERS = {
	'User-Agent':
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
	Referer: 'https://www.bilibili.tv/'
};

async function callApi(endpoint, params = {}) {
	const query = new URLSearchParams({ platform: 'web', s_locale: 'en_US', ...params });
	const data = await fetchJSON(`${API_BASE}${endpoint}?${query}`, { headers: HEADERS });

	if (data?.code && data.code !== 0) {
		throw new Error(data?.message || `Bilibili API error: ${data.code}`);
	}

	return data?.data;
}

export const bilibiliDetailTv = async ({ aid }) => {
	const playData = await callApi('/web/playurl', { aid, qn: 64, type: 0 });

	if (!playData?.playurl) {
		throw new Error('No playurl data returned');
	}

	const { playurl } = playData;

	const videos = (playurl.video || [])
		.filter((v) => v.video_resource?.url)
		.sort((a, b) => (b.video_resource?.bandwidth || 0) - (a.video_resource?.bandwidth || 0));

	const bestVideo = videos[0];
	const audio = (playurl.audio_resource || []).find((a) => a.url)?.url;

	if (!bestVideo) {
		throw new Error('No video streams available');
	}

	return {
		video: bestVideo.video_resource.url,
		size: bestVideo.video_resource.size,
		resolution: bestVideo.stream_info?.desc_words || `${bestVideo.video_resource.width}x${bestVideo.video_resource.height}`,
		bandwidth: bestVideo.video_resource.bandwidth,
		audio,
		title: playData.title || null,
		cover: playData.cover || null
	};
};

export const bilibiliSearchTv = async (keyword) => {
	const data = await callApi('/web/v2/search_v2', { keyword, pn: 1, ps: 20 });

	if (!data?.modules?.some((v) => v.type === 'ugc')) {
		throw new Error('No video results found');
	}

	const ugcModule = data.modules.find((v) => v.type === 'ugc');

	return (ugcModule?.items || []).map(bilibiliParseMetadataTv);
};
