import fetch from 'node-fetch';
import axios from 'axios';

import { cheerioLOAD, fetchJSON } from '../../helper/index.js';

const _api = 'https://api2.musical.ly/aweme/v1/feed/?';
const _apiNgutek = (input) => `https://api.ngutek.com/${input}`;
const _apiKeyParser = (input) => _apiNgutek(`video-key?video_url=${input}`);
const _apiDetailParser = (input) => _apiNgutek(`video-details-by-key?key=${input}`);
const _apiBaseDownload = (input) => _apiNgutek(`download?key=${input}&type=video`);
const _apiBaseMusic = (input) => _apiNgutek(`download?key=${input}&type=music`);

const randomChar = (char, range) => {
	let chars = '';

	for (let i = 0; i < range; i++) {
		chars += char[Math.floor(Math.random() * char.length)];
	}

	return chars;
};

const buildHead = (id) => {
	return {
		/* eslint-disable */
		headers: {
			'User-Agent': 'com.ss.android.ugc.trill/260103 (Linux; U; Android 10; en_US; Pixel 4; Build/QQ3A.200805.001; Cronet/58.0.2991.0)',
			Accept: 'application/json',
		},
		params: {
			aweme_id: id,
			version_name: '26.1.3',
			version_code: '260103',
			build_number: '26.1.3',
			manifest_version_code: '260103',
			update_version_code: '260103',
			openudid: randomChar('0123456789abcdef', 16),
			uuid: randomChar('1234567890', 16),
			_rticket: Date.now() * 1000,
			ts: Date.now(),
			device_brand: 'Google',
			device_type: 'Pixel 4',
			device_platform: 'android',
			resolution: '1080*1920',
			dpi: 420,
			os_version: '10',
			os_api: '29',
			carrier_region: 'US',
			sys_region: 'US',
			region: 'US',
			app_name: 'trill',
			app_language: 'en',
			language: 'en',
			timezone_name: 'America/New_York',
			timezone_offset: '-14400',
			channel: 'googleplay',
			ac: 'wifi',
			mcc_mnc: '310260',
			is_my_cn: 0,
			aid: 1180,
			ssmix: 'a',
			as: 'a1qwert123',
			cp: 'cbfhckdckkde1',
		},
		/* eslint-enable */
	};
};

const parseData = async (arr) => {
	const {
		ItemList: {
			video: { keyword },
		},
	} = arr;

	if (arr.ItemModule?.[keyword] == undefined) {
		const datas = await (
			await fetch(_api + new URLSearchParams(buildHead(keyword).params), {
				headers: buildHead().headers,
			})
		).json();
		const actualData = datas.aweme_list.find((v) => v.aweme_id === keyword);

		if (!actualData) {
			throw 'not found';
		}

		const {
			nickname,
			unique_id: author,
			signature: biograph,
			avatar_medium: { url_list: profilePicture },
		} = actualData.author;
		const { digg_count: liked, share_count: shared, comment_count: comment, play_count: view } = actualData.statistics;
		const {
			desc: videoDescription,
			image_post_info: { images },
		} = actualData;
		const music = actualData?.music?.play_url?.uri ?? 'n/a';
		const musicDuration = actualData?.music?.duration ?? 'n/a';
		const authorMusic = actualData?.music?.author ?? 'n/a';
		const musicTitle = actualData?.music?.title ?? 'n/a';

		return {
			keyword,
			nickname,
			type: 'images',
			author,
			liked,
			shared,
			comment,
			view,
			biograph,
			videoDescription,
			music: {
				authorMusic,
				musicTitle,
				musicDuration,
				music,
			},
			profilePicture: profilePicture[0],
			images: images.map((v, i) => ({
				url: v.display_image.url_list[1],
				index: i + 1,
			})),
		};
	}

	const {
		desc: videoDescription,
		createTime: published,
		author,
		stats: { diggCount: liked, shareCount: shared, commentCount: comment, playCount: view },
		authorStats: { followerCount: followers, followingCount: following, heart, videoCount: totalVideo },
		locationCreated,
		nickname,
		avatarThumb: profilePicture,
		video: { downloadAddr: withWatermark, duration: videoDuration, ratio, cover: videoThumbnail },
		music: { title: musicTitle, authorName: authorMusic, playUrl: music, duration: musicDuration },
	} = arr?.ItemModule?.[keyword];
	const { signature: biograph, verified } = arr?.UserModule?.users?.[author];

	return {
		keyword,
		author,
		nickname,
		biograph,
		verified,
		liked,
		shared,
		comment,
		view,
		videoDescription,
		published,
		followers,
		following,
		heart,
		totalVideo,
		locationCreated,
		musicTitle,
		authorMusic,
		videoDuration,
		musicDuration,
		ratio,
		url: {
			profilePicture,
			videoThumbnail,
			music,
			withWatermark,
		},
	};
};

export const tiktokDownloader = (url) =>
	new Promise(async (resolve) => {
		try {
			url = url.includes('vm.tiktok.com') ? url.replace('vm.tiktok.com', 'vt.tiktok.com') : url;
			const data = await fetchJSON(_apiKeyParser(url));

			if (data.status !== 'success') {
				resolve(data);
			}

			const dataResult = await fetchJSON(_apiDetailParser(data.data.key));

			if (dataResult.status !== 'success') {
				resolve(dataResult);
			}

			resolve({
				...dataResult.data.author,
				description: dataResult.data.description,
				withWatermark: _apiBaseDownload(dataResult.data.video.with_watermark),
				noWatermark: _apiBaseDownload(dataResult.data.video.no_watermark),
				noWatermarkRaw: dataResult.data.video.no_watermark_raw,
				music: _apiBaseMusic(dataResult.data.music),
			});
		} catch (e) {
			resolve(e);
		}
	});

/**
 * @typedef {{author: string, nickname: string, liked: number, shared: number, comment: number, view: number, videoDescription: string, biograph: string}} ParsedContainer
 * @typedef {{music?: {authorMusic: string, musicTitle: string, musicDuration: number, music: string}}} MusicContainer
 * @typedef {{url?: {profilePicture: string, videoThumbnail: string, music: string, withNoWatermark: string}, verified?: boolean, heart?: number, totalVideo?: number, locationCreated?: string, musicTitle?: string, authorMusic?: string, videoDuration?: number, musicDuration?: number, ratio?:string}} VideosContainer
 * @typedef {{type?: 'images', images?: {url: string, index: number}[]} & MusicContainer} ImagesContainer
 */
/**
 * Download TikTok using Official API.
 * @param {string} url
 * @returns {Promise<ParsedContainer & ImagesContainer & VideosContainer>}
 * @throws {Error}
 */
export const tiktokAPI = (url) =>
	new Promise(async (resolve, reject) => {
		try {
			url = url.includes('vm.tiktok.com') ? url.replace('vm.tiktok.com', 'vt.tiktok.com') : url;
			let keyword;

			if (/((vt|vm|vk)\.tiktok\.com)/g.test(url) || !url.includes('video')) {
				const req = await fetch(url);
				const { origin, pathname } = new URL(req.url);

				keyword = pathname.split('/').slice(-1)[0];

				url = origin + pathname;
			}

			const { data: res } = await axios.get(url, {
				validateStatus: () => true,
			});

			const $ = cheerioLOAD(res);
			const parsed = await parseData(JSON.parse($('#SIGI_STATE').html()), keyword);

			if (parsed.type == 'images') {
				resolve(parsed);
			}

			const withNoWatermark = (
				await fetchJSON(_api + new URLSearchParams(buildHead(parsed.keyword).params), {
					headers: buildHead().headers,
				})
			).aweme_list.find((v) => v.aweme_id === parsed.keyword).video.play_addr.url_list[Math.floor(Math.random() * 3)];

			parsed.published = Number(parsed.published);
			parsed.url = {
				...parsed.url,
				withNoWatermark,
			};
			resolve(parsed);
		} catch (err) {
			reject(err);
		}
	});
