import fetch from 'node-fetch';

import { fetchJSON } from '../modules/index.js';

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
			Accept: 'application/json'
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
			cp: 'cbfhckdckkde1'
		},
		params_users: {
			device_id: '6158568364873266588',
			version_code: '119',
			build_number: '10.3.3',
			version_name: '10.3.3',
			aid: '1233',
			app_name: 'musical_ly',
			app_language: 'en',
			channel: 'googleplay',
			device_platform: 'android',
			device_brand: 'Google',
			device_type: 'Pixel',
			os_version: '9.0.0'
		}
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
			download_count: downloaded
		},

		author: {
			region: locationCreated,
			avatar_medium: { url_list: avatarList }
		},

		video: {
			download_addr: { url_list: withWatermarkList },
			play_addr: { url_list: noWatermarkList },
			duration: videoDuration,
			ratio,
			cover: { url_list: videoThumbnailList }
		},

		music: {
			title: musicTitle,
			author: authorMusic,
			play_url: { url_list: musicList },
			duration: musicDuration
		}
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
		videoThumbnailList[0]
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
							index: i + 1
						}))
				  } /* eslint-disable-line */
				: { withWatermark, withNoWatermark })
		}
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
				music: _apiBaseMusic(dataResult.data.music)
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
					headers: buildHead().headers
				}
			);

			json = json.aweme_list.find((v) => v.aweme_id === keyword);

			json = await parseData(json, json.image_post_info && json.image_post_info?.images.length > 0 ? 'images' : undefined);

			const userRaw = await fetchJSON(
				`https://api2.musical.ly/aweme/v1/discover/search/?keyword=${
					json.author
				}&cursor=0&count=10&type=1&hot_search=0&search_source=discover&${new URLSearchParams(
					buildHead().params_users
				).toString()}`,
				{
					headers: {
						'User-Agent': buildHead().headers['User-Agent'],
						Cookie:
							'tt_csrf_token=DVi5xNeA-tPyYdnHdJujPvKHnh9ZPrM0ml8A; tt_chain_token=yukZlao/UXhCZRv5zQ/pFA==; passport_csrf_token=4a8548b9281379c59776ed8f41adb269; passport_csrf_token_default=4a8548b9281379c59776ed8f41adb269; s_v_web_id=verify_lkdq3yeq_aeH6R8iG_fR5S_46lr_8nQz_22CBCj6hTRrq; tt-target-idc=alisg; cmpl_token=AgQQAPPdF-RO0o5iJXcaOR07_lHHV_AQv4MrYM5SEA; passport_auth_status=6bc9ff111811e73ce26678e511618fef,; passport_auth_status_ss=6bc9ff111811e73ce26678e511618fef,; sid_guard=a73866b2293de2fb49b4e3bdd8087ac0|1690013067|15552000|Thu,+18-Jan-2024+08:04:27+GMT; uid_tt=6d922f3ff82a316bd815adf94fb0007af92e9a9323d8ee7b24dd83b64b04e5cc; uid_tt_ss=6d922f3ff82a316bd815adf94fb0007af92e9a9323d8ee7b24dd83b64b04e5cc; sid_tt=a73866b2293de2fb49b4e3bdd8087ac0; sessionid=a73866b2293de2fb49b4e3bdd8087ac0; sessionid_ss=a73866b2293de2fb49b4e3bdd8087ac0; sid_ucp_v1=1.0.0-KDgyNDMwYjM1MGYxYTUyOWIxMTI1NGYwN2VhZThhMTE0M2RmNGEwYTkKHwiCiK-Qifqyrl4Qi5vupQYYswsgDDD9mPPyBTgIQBIQAxoGbWFsaXZhIiBhNzM4NjZiMjI5M2RlMmZiNDliNGUzYmRkODA4N2FjMA; ssid_ucp_v1=1.0.0-KDgyNDMwYjM1MGYxYTUyOWIxMTI1NGYwN2VhZThhMTE0M2RmNGEwYTkKHwiCiK-Qifqyrl4Qi5vupQYYswsgDDD9mPPyBTgIQBIQAxoGbWFsaXZhIiBhNzM4NjZiMjI5M2RlMmZiNDliNGUzYmRkODA4N2FjMA; store-idc=maliva; store-country-code=id; store-country-code-src=uid; tt-target-idc-sign=bOVfqoFzfCqrsdRBNKkGzPTxYaKqzobIVjHJmxsr1vik68zduHmata8mqZ9gHAvhND1VvJHaKD8zBwG4Dradpi4_xYPHmnAvHcYCNXwOMYOgn5yEjfkDvz4BzoWwLFyGnSzVy2cxzESDDFrl33Ry3yqWdKwyAdZYyH9d9e5yuTXCgmS95G5TJN6AGK1Qj7qc8CLBACu9zejXIvfdRJz0hr7UdIf4_h07s0kDSiFAaDi2nw1wnrrir6kYowRzLuljkqLCzQuIl_RzfAz6ctwcZdiKB__glc5vgkBN7G-qfuQdDDaBX4lz5RMs05dSFczvvrFhlwKKjQFrN_Je2I7PuRuGWoJVeX8K670ligISbDDBIrdOPoqWmvX0bPKy-6dqymTnGYBZLN3j0fLdvFY0kcCjWJiH0XCf5DS2DywBtMpnLKsPpvN2jqD3h94-fGTKZw_9rGN4T8RsljExpe6-_EsEUy2DYBM-k0naXRdMF7udPYAz-s7ASpvNA8NWhSln; odin_tt=b472792b03bc401f31da961703616aef30a6f8a6e915806daa390d47454f80acad2a597f9882424aa03b943710f91137458af484e99d6e54e4dd93b5730d0fa34f02d9013c1f9b211bf3da62ddb7b594; ttwid=1|cQoQ3DlZ-k6P_im3X7blvQoJaZqvNSlvUHV0N-h88ko|1690013076|f253d693933f867453f0cd40870e7ae71330f333ea105b26e9680b2f179d9bbe; msToken=v01R-dt9npFEbqJuj-mKHj1Owd-62gb5l9uN0ywfjKubBJHoRxSjJHnrkCqOgz2cDYQSA3gFSf6sRpEHy1UXbyOymEG333X77x0gJv9kllv91zmNJurYxux6X-6dhvPlGbFsGA=='
					}
				}
			);

			const userDetails = userRaw.user_list.find((v) => v.user_info.uid === json.uniqueId);

			const tempJson = { ...json };

			delete tempJson.url;

			Object.assign(tempJson, {
				following: userDetails.user_info.following_count,
				followers: userDetails.user_info.follower_count,
				heart: userDetails.user_info.total_favorited,
				totalVideo: userDetails.user_info.aweme_count,
				url: json.url
			});
			resolve(tempJson);
		} catch (err) {
			reject(err);
		}
	});
