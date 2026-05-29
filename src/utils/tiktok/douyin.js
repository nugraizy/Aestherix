import { fetch } from 'undici';

const baseVideoUrl = 'https://www.douyin.com/aweme/v1/play/?video_id=%s&ratio=1080p&line=0';
const headers = {
	'User-Agent':
		'Mozilla/5.0 (Linux; Android 11; SAMSUNG SM-G973U) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/14.2 Chrome/87.0.4280.141 Mobile Safari/537.36'
};

/**
 * Extract JSON strings/objects from any text.
 * Returns parsed objects when valid JSON is found.
 */
function extractJSONs(text) {
	const results = [];
	let start = -1;
	let depth = 0;
	let inString = false;
	let escape = false;

	for (let i = 0; i < text.length; i++) {
		const char = text[i];

		if (start === -1) {
			if (char === '{') {
				start = i;
				depth = 1;
			}

			continue;
		}

		if (inString) {
			if (escape) {
				escape = false;
			} else if (char === '\\') {
				escape = true;
			} else if (char === '"') {
				inString = false;
			}

			continue;
		}

		if (char === '"') {
			inString = true;
		} else if (char === '{') {
			depth++;
		} else if (char === '}') {
			depth--;

			if (depth === 0) {
				const jsonString = text.slice(start, i + 1);

				try {
					results.push(JSON.parse(jsonString));
				} catch {
					// Ignore invalid JSON
				}

				start = -1;
			}
		}
	}

	return results;
}

const parseDouyinInfo = (data) => {
	data = data.loaderData['video_(id)/page'] || data.loaderData['note_(id)/page'];

	if (!data || !data.videoInfoRes.item_list || data.videoInfoRes.item_list.length === 0) {
		throw new Error('No video information found in the data');
	}

	const mediaInfo = data.videoInfoRes.item_list[0];
	const userInfo = mediaInfo.author;
	const isImage = mediaInfo.images !== null;
	const mediaStats = mediaInfo.statistics;
	let videoUri = mediaInfo.video.play_addr?.uri;
	const images = [];

	if (isImage) {
		images.push(...mediaInfo.images.map((img) => img.url_list[0]));
	}

	const container = {
		...mediaStats,
		desc: mediaInfo.desc || '',
		cover: mediaInfo.video?.cover?.url_list?.[0] || mediaInfo.video?.dynamic_cover?.url_list?.[0] || null,
		author_statistics: Object.keys(userInfo)
			.filter((v) => userInfo[v] !== null)
			.map((k) => ({ [k]: userInfo[k] }))
			.reduce((a, b) => ({ ...a, ...b }), {}),
		...(videoUri && !videoUri.endsWith('mp3') ? { video: baseVideoUrl.replace('%s', videoUri) } : {}),
		...(images.length > 0 ? { images } : {})
	};

	return container;
};

export const getDouyinInfo = async (url) => {
	const response = await fetch(url, { headers });

	const body = await response.text();

	const jsonObjects = extractJSONs(body);

	const videoInfo = jsonObjects.find((v) => v.loaderData);

	if (videoInfo) {
		return parseDouyinInfo(videoInfo);
	}

	throw new Error('No video info found in the page');
};
