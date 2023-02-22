/**
 * @typedef {Object} Options
 * @property {Object?} Options.proxy Proxy Agent
 * @property {String} Options.proxy.url URL Proxy
 *
 */

/**
 *
 * @param {Options} a
 */
import fetch from 'node-fetch';

import { fetchJSON } from '../../helper/index.js';

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

const buildHead = (args) => {
	return {
		/* eslint-disable */
		headers: {
			'User-Agent':
				'com.ss.android.ugc.trill/260103 (Linux; U; Android 10; en_US; Pixel 4; Build/QQ3A.200805.001; Cronet/58.0.2991.0)',
			Accept: 'application/json',
		},
		params: {
			...args,
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
		params_users: {
			device_id: '6158568364873266588',
			version_code: '100303',
			build_number: '10.3.3',
			version_name: '10.3.3',
			aid: '1233',
			app_name: 'musical_ly',
			app_language: 'en',
			channel: 'googleplay',
			device_platform: 'android',
			device_brand: 'Google',
			device_type: 'Pixel',
			os_version: '9.0.0',
		},
		/* eslint-enable */
	};
};

const parseData = async (obj, type) => {
	let {
		desc: videoDescription,
		create_time: published,
		author,

		statistics: {
			digg_count: liked,
			share_count: shared,
			comment_count: comment,
			play_count: view,
			download_count: downloaded,
		},

		author: {
			region: locationCreated,
			avatar_medium: { url_list: avatarList },
		},

		video: {
			download_addr: { url_list: withWatermarkList },
			play_addr: { url_list: noWatermarkList },
			duration: videoDuration,
			ratio,
			cover: { url_list: videoThumbnailList },
		},

		music: {
			title: musicTitle,
			author: authorMusic,
			play_url: { url_list: musicList },
			duration: musicDuration,
		},
	} = obj;

	const musicCoverList =
		obj.music[obj.music?.cover_hd ? 'cover_hd' : obj.music?.cover_large ? 'cover_large' : 'cover_medium'].url_list;

	const images = obj?.image_post_info?.images;

	const [profilePicture, musicCoverPicture, music, withNoWatermark, withWatermark, videoThumbnail] = [
		avatarList[0],
		musicCoverList[0],
		musicList[0],
		noWatermarkList[0],
		withWatermarkList[0],
		videoThumbnailList[0],
	];
	const { signature: biograph, custom_verify: verified, nickname } = author;

	return {
		keyword: obj?.aweme_id,
		author: author.unique_id,
		uniqueId: author.uid,
		nickname,
		type: type ? type : 'video',
		biograph: biograph || 'No bio yet.',
		verified: verified !== '',
		liked,
		shared,
		comment,
		view,
		downloaded,
		videoDescription,
		published,
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
			musicCoverPicture,
			...(type === 'images'
				? {
						images: images.map((v, i) => ({
							url: v.display_image.url_list[1],
							index: i + 1,
						})),
				  } /* eslint-disable-line */
				: { withWatermark, withNoWatermark }),
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
 * @typedef {{author: string, uniqueId: string, nickname: string, liked: number, shared: number, comment: number, view: number, videoDescription: string, biograph: string}} ParsedContainer
 * @typedef {{music?: {authorMusic: string, musicTitle: string, musicDuration: number, music: string}}} MusicContainer
 * @typedef {{url?: {profilePicture: string, videoThumbnail: string, music: string, withNoWatermark?: string, withWatermark?: string, images?: string[]}, verified?: boolean, heart?: number, totalVideo?: number, locationCreated?: string, musicTitle?: string, authorMusic?: string, videoDuration?: number, musicDuration?: number, ratio?:string}} VideosContainer
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
				const req = (await fetch(url, { method: 'HEAD' }))?.url;

				if (!req) {
					resolve({ error: 'download failed. either the access is denied, or other error.' });
					return;
				}

				const { origin, pathname } = new URL(req);

				keyword = pathname.split('/').slice(-1)[0];

				url = origin + pathname;
			} else {
				const { pathname } = new URL(url);

				keyword = pathname.split('/').slice(-1)[0];
			}

			let json = await fetchJSON(
				_api + new URLSearchParams(buildHead({ /* eslint-disable-line */ aweme_id: keyword }).params),
				{
					headers: buildHead().headers,
				},
			);

			json = json.aweme_list.find((v) => v.aweme_id === keyword);

			json = await parseData(json, json.image_post_info && json.image_post_info?.images.length > 0 ? 'images' : undefined);

			const userRaw = await fetchJSON(
				`https://api2.musical.ly/aweme/v1/discover/search/?keyword=${
					json.author
				}&cursor=0&count=10&type=1&hot_search=0&search_source=discover${new URLSearchParams(
					buildHead().params_users,
				).toString()}`,
				{
					headers: {
						'User-Agent': buildHead().headers['User-Agent'],
						Cookie:
							'tt_csrf_token=rnilmZq1-B7Qzbi2LFZWXUtvwo6wUqvbxXXM; tiktok_webapp_theme=light; csrf_session_id=438868e5d6992b7098ca485e6f1f71ff; _tea_utm_cache_3053={"utm_source":"more","utm_medium":"android","utm_campaign":"client_share"}; s_v_web_id=verify_lbqr9jv2_HJT2HbR1_h9Wf_4TmD_ABm9_laYe1gbl6bqs; passport_fe_beating_status=true; tt_chain_token=Znm+At8/ELjBLJBbFPJ1eg==; _abck=18CA70181BACEFC30479C7E964069ECB~0~YAAQd6s0F35nH3OGAQAA85zbeAmZ38OZ3cTNXfQMMfI7Rv5IcsWkXbVCBaoPqJmJcPlFgo90huh/6cwE2YOSGqk+GCzye8MT25qrLpoLGvdviPG24wtbYwwt8cBXVWdN0MejDQy3U2Aya1baGaG9gEGopJWYXC+MZMajLjJcFf5mwtkwiVV0vGCvalLvQGEIt5rHrOmumLSuIbPv3saTgN4Ss4wT4Mnt0oHzFG67mfWpUCJxKWX1wTDsX6rOtYgtupxlBgcdYrFfMaEfyoXay4rE9UgrDGIxdaf9/UookQSN3Tka6Eduuj48ebTbgL477VEMos9qSRbUUObxnv+w7bDNQLILDGxeK0y0gRwXDhkRsNeyBsz+dXmdttJTzJfe1LCRMFqeSLr/x+g1A5kNCin4sg3gzCA=~-1~-1~-1; bm_sz=A1B3372661EB5E49C58792E74C5BF7EF~YAAQd6s0F4FnH3OGAQAA85zbeBIiF7bi7YI6erlMBZddleQePAimRc6c0qhctkQ3ANfc0IRlgeNVrcUPD4YWf8WwgNXGbcZlH2Xer51hECyRoCYyvzCuX2FeQP3uyUvS46R+pPQ0kfSeglnpiX8PmLSY4yQJnc1VjCe4wRagYG0so8o/RfLokAEj7MQD9nTO13AG2/Qeo36qxh11TuJB/skjBMH/JRfmo3D6yMQGV5oaf1nKfipmngtmLhvlaF40T+tw1cASVJqABlOn8M4X2wMZ2340LvE9e0LUSheFmC0TkC0=~3487282~3618100; __tea_cache_tokens_1988={"_type_":"default","user_unique_id":"7177355450844857857","timestamp":1671108307651}; ak_bmsc=05728369ED84D4BC5BD854EBA2CDA66A~000000000000000000000000000000~YAAQd6s0F5hnH3OGAQAAE7rbeBKdykKwDgZw/3PO4Mtvem6gq3H37RBTurad8RHaSz7Se+mEbEgg4pX57aK5R9e1/TshX49VCLFvrNkaFTEY+/WZ3pWatmt2vqdBbf1kx1C1Wb34nWV5wDYIVQ7g+tYUg63fj+jX+XOhiuuhrbN/keFCsO4bhJvfE0KRl+N2hEF3qMnMhCtaX9XvM7GKUGo0ynSh9fS86FLK8ckR1Bb6R++81y8mNFr38NR4hH3ATbO119Ie67c2lL5YlBEXH6TJr7KFEOLJQRMT7jwrm4kXV7GTAynotz1w88NftqC55aTfyA8IUSd7q98+93ercNJn7baoWQC1lsmxCAqwhXSWdvhCgaOqzNQb8BQXUtB6Qu9YRPDXiwqdFdrBxDzt20Y52dLibHBL4UZQB5/zRWw3KxEM81gxrfwu0PdtEBQtevspG3c/JsWeBUQaXT7EG63q745gIJ/wmaYV5VJNgyljpAReEImaRps=; ttwid=1|AsvH48d0XoAtAMzp2tm7k_j765J3ar7Nrp76zGH2CuI|1677064913|dcc58a594f45eb25fbbf1121a06e10e0ba0e6bd6916ec6691d9745c0d187d3e2; passport_csrf_token=c9651411e7e34be912eb0317dcb8d222; passport_csrf_token_default=c9651411e7e34be912eb0317dcb8d222; bm_sv=55A70185E9DFE1BBAAFB8FAE3CB0EF0E~YAAQd6s0F7xnH3OGAQAA6djbeBK9B7SC3QtNT7gx+/uyg8DsMmFFmiF9AY4teETBUW05C/8NO+kYUFSZymBQFaMfCOzh+wp7iF3lZdxmHUAZsLJ3VoqxlDIseyZvzlLg0WhXb+p1K9a0rgerUoaS8OIWcmNx2EnOn6jTC09rNn38XRP5a+bQ14goc1ssZITBCjDaw0PYvM4/smo89vKTg1V0Fv/v8HO5jZ45Q+FJc+JaSJSfIz2ZMVrngXmyOeDe~1; msToken=05RjCHZD3E_lqVtLqTNKkXEai2zZZpAvbYedkcTJeQRiLUMbX2Xy6GpCzkhMGG5Mx7N54e9OjAG9x_BH7XsJiuXIrWNpjTrgbqekbpSorVFz8akOrKXIUQpNYUgH5-P1wzZzWZGuADxJLWvC; cmpl_token=AgQQAPPdF-RO0o5iJXcaOR07-fqP8vXNf4MrYMnnHg; sid_guard=46a98cca78b3b082d53b6217d6f302b4|1677064945|5184000|Sun,+23-Apr-2023+11:22:25+GMT; uid_tt=52382197069737729197ea45ee067092afc679915711177a99a18f2ab4966c5e; uid_tt_ss=52382197069737729197ea45ee067092afc679915711177a99a18f2ab4966c5e; sid_tt=46a98cca78b3b082d53b6217d6f302b4; sessionid=46a98cca78b3b082d53b6217d6f302b4; sessionid_ss=46a98cca78b3b082d53b6217d6f302b4; sid_ucp_v1=1.0.0-KGM2NjdjNmUzNTI5YTA2ZDFkZTMyNzE5YmNmN2IwNTFiMDdhNGQ5ZWQKIAiCiK-Qifqyrl4Q8fXXnwYYswsgDDD9mPPyBTgHQPQHEAMaBm1hbGl2YSIgNDZhOThjY2E3OGIzYjA4MmQ1M2I2MjE3ZDZmMzAyYjQ; ssid_ucp_v1=1.0.0-KGM2NjdjNmUzNTI5YTA2ZDFkZTMyNzE5YmNmN2IwNTFiMDdhNGQ5ZWQKIAiCiK-Qifqyrl4Q8fXXnwYYswsgDDD9mPPyBTgHQPQHEAMaBm1hbGl2YSIgNDZhOThjY2E3OGIzYjA4MmQ1M2I2MjE3ZDZmMzAyYjQ; store-idc=useast2a; store-country-code=id; store-country-code-src=uid; tt-target-idc=alisg; tt-target-idc-sign=pj1nkp4fK5Arllt8m_N3oV3UH6wu8EWF10GOnv8BzjMOxRo0ns5qspRVEK_8Jd1BI5DIswk2PIrWnRg2wB_dvpNYOElNvIEaXWNHhnQ-H3ClMsPYgc3tCqcbGeVRs2G4gOrF4-_UoARpdFxrSsJgu-KINbcHTmLW5FcaoYMD-KVUXZL3xxxImCLxAe8D9fGhtvaheLN9SmOnASK1LyAsJzk5zrEMoVgBJhMyrUb6OsRsvUDvgFchoyP9mNNM7P6OcskcXLI528nmmJgP9NkYzI27pfkOXFAQHTeWf4YxC64QRk04n8IUS0-9JjxKb7za7TQ5f3LZj0B_ovpUWoehfMwQoP1j4cBwAip4jKUEgD157VHWqHM5phtSvIU6bJJ-9e5zzIcQKnBjFBI0L0IY5giB7PvV_vkvQ0B0dmEwUN6-aZVaMSsNA4Yd4GERI21GT704r-WTfpewdOx5Zx38IcSfQx5QJIHQDsvcF_cKT7fBf0qZKMTRYI4nKJTTTMxD; msToken=zJ1zb_6EWRZxTkZWP-_mZCoCMZL1zqDLoZ7061N_FLD15xWerKCo8mhdVj9vi9fVixRjxY04BqbxEhIMrkYZm3CsmAG8-t_jGT2CjfZYNn9oIhnYGI17fMcOpbtN-te5AHv4iAf9a_1n1jF-; odin_tt=ff0436354b98716cfdc178074c6abf320e4396386f1b0de82c3952c0d317da482ad09624397b279ce67f603c36ce4942d9792dd55fcf165aa630e0a4370ddf9dabdaa2bd49b48eee6563b7b9d3b86ae5',
					},
				},
			);

			const userDetails = userRaw.user_list.find((v) => v.user_info.uid === json.uniqueId);

			const tempJson = { ...json };
			delete tempJson.url;

			Object.assign(tempJson, {
				following: userDetails.user_info.following_count,
				followers: userDetails.user_info.follower_count,
				heart: userDetails.user_info.total_favorited,
				totalVideo: userDetails.user_info.aweme_count,
				url: json.url,
			});
			resolve(tempJson);
		} catch (err) {
			reject(err);
		}
	});
