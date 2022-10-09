/* global log */
import fetch from 'node-fetch';

import { cheerioLOAD, fetchJSON, fetchTEXT } from '../../helper/index.js';

const URL_KEY_PARSER = (input) => `https://api.ngutek.com/video-key?video_url=${input}`;
const URL_DETAIL_PARSER = (input) => `https://api.ngutek.com/video-details-by-key?key=${input}`;
const URL_BASE_DOWNLOAD = (input) => `https://api.ngutek.com/download?key=${input}&type=video`;
const URL_BASE_MUSIC = (input) => `https://api.ngutek.com/download?key=${input}&type=music`;
const URL_API = 'https://api2.musical.ly/aweme/v1/feed/?';

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
			await fetch(URL_API + new URLSearchParams(buildHead(keyword).params), {
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
		const music = actualData?.music?.play_url?.uri ?? 'N/A';
		const musicDuration = actualData?.music?.duration ?? 'N/A';
		const authorMusic = actualData?.music?.author ?? 'N/A';
		const musicTitle = actualData?.music?.title ?? 'N/A';

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
			images: images.map((v, i) => {
				return {
					url: v.display_image.url_list[1],
					index: i + 1,
				};
			}),
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
			const data = await fetchJSON(URL_KEY_PARSER(url));

			if (data.status !== 'success') {
				resolve(data);
			}

			const dataResult = await fetchJSON(URL_DETAIL_PARSER(data.data.key));

			if (dataResult.status !== 'success') {
				resolve(dataResult);
			}

			resolve({
				...dataResult.data.author,
				description: dataResult.data.description,
				withWatermark: URL_BASE_DOWNLOAD(dataResult.data.video.with_watermark),
				noWatermark: URL_BASE_DOWNLOAD(dataResult.data.video.no_watermark),
				noWatermarkRaw: dataResult.data.video.no_watermark_raw,
				music: URL_BASE_MUSIC(dataResult.data.music),
			});
		} catch (e) {
			resolve(e);
		}
	});

export const tiktokAPI = (url) =>
	new Promise(async (resolve) => {
		try {
			url = url.includes('vm.tiktok.com') ? url.replace('vm.tiktok.com', 'vt.tiktok.com') : url;
			let keyword;

			if (/((vt|vm|vk)\.tiktok\.com)/g.test(url) || !url.includes('video')) {
				const req = await fetch(url);
				const { origin, pathname } = new URL(req.url);

				keyword = pathname.split('/').slice(-1)[0];

				url = origin + pathname;
			}

			const res = await fetchTEXT(url, {
				headers: {
					'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.81 Safari/537.36',
					cookie:
						'_tea_utm_cache_3053={%22utm_source%22:%22copy%22%2C%22utm_medium%22:%22android%22%2C%22utm_campaign%22:%22client_share%22}; tt-target-idc-sign=F9Yol7_ni-MiRB12CyraOKcEgoeqrd-1emtzPJhTVKVJ5DW9FkDkSeAJub4gLSuhXQbkCi3E_dhnD1Fy6G4z-vzI7_32OS5sVWD-VoiJ_Ya3Ur-NF8qR5HTsjvDwKlh8c_0PwKsRBX5UiFFbeu4m8GqzVg-D4yobENVpPWDXsuEZu-PCGaud12w2bt1lzPT8tmjfuftGq4yVG3acxzpNWY4n9MystGcIY5O1HOIUogGb8bc2UOwNTh4sztONRInOnUsUAm5LFl65a1SKWWELEWmm8TW2ott4HxdPVFMmkOd8TzlH6nRO3qwRFwCpykh8PpXGpDUsn7fsgUR9NVDljoQrlspTWu4OBelO0iXLpt4M8-5V9Y0k9wpj8587tF5OWGB5__dXKLejzydmZR0etvRF5MyFEeB-mBvPW3AE-op09v3iFOOBiswJXCYlhgIX4mZOoPUdX3ZJyb4wnUQQfE0rzwXMU2g34HeWcGEDVifEHC81Nnib-s6L5WMinETo; _abck=9D869441311411707B35BF27A6F89EDF~-1~YAAQ7as0FyW7vn+DAQAAUp/0ogj84jRi6KQLw3Nf6cVar+I6Uxui9LTVPXgK6wCdLSLDSQX1mMkPlDbyD1oioF8QcnZaUk28YgWFR3BRpEHlroj8EEBdGCE/ZeFj+E+LFKErRWMt/2Ze/X+YvUdur8onlC0oeppIGU7a6t+OjoNohGrmN5yFD3GvWrbmYlRuR2CEK/12h9lM2Rdb+CgkR2LmOuNS6i4JVn5VezL+rF1tJcPTlkD4hlDuHy0cXlgaRsDlhSsh0q2OxY+YU/saGIz3YtbtZklBGt1CwGg3spFbwDon+qRhGeXqCl0cbzRzItHlbgieX/q0ZBr6DNhkJK1E+Avm/kPn4aTLa+B6X4+P+48y6uRww4AEWqs40a/ESuLk6QtTOU6P~-1~-1~-1; csrf_session_id=19f5a8c6c0174e53b5ae9bcb33e756bd; msToken=HfMn5TufeF0M5Sd57T8-5t1wTo9Xm0CMODUalyo3HoiOs6pPQcS_kGNtSI16QDPDzHaeuzeau1A4KsKZ1hyDnkVscvff4PTmQSgMUfTpT9BLgvCdZMt5lxUt-Bbbnj_W5m53bKMptp_nmLRZ; _tea_utm_cache_345918={%22utm_source%22:%22copy%22%2C%22utm_medium%22:%22android%22%2C%22utm_campaign%22:%22client_share%22}; sid_guard=9d36073a2c919fb961adfe5819a0f6fb%7C1664388230%7C5184000%7CSun%2C+27-Nov-2022+18%3A03%3A50+GMT; ttwid=1%7C7q3fc31_hbkUj7GoI2xcD5baijjoOwUMPePzwMlaDno%7C1664894699%7Cc2e648a1e8fa1b3035242bd5da50c782d6b80504738448316a9c8461a8146ca5; store-country-code-src=uid; uid_tt=4778947824c972f4ae948da66a41db3ee6335f7c8dc178c89707e0c88f74bc77; passport_csrf_token_default=7591e7deba97bfd5824f5b086d74da55; msToken=HfMn5TufeF0M5Sd57T8-5t1wTo9Xm0CMODUalyo3HoiOs6pPQcS_kGNtSI16QDPDzHaeuzeau1A4KsKZ1hyDnkVscvff4PTmQSgMUfTpT9BLgvCdZMt5lxUt-Bbbnj_W5m53bKMptp_nmLRZ; s_v_web_id=verify_l8lxr5ow_NhayPoZU_kZWt_402p_A1FE_WR6GTMoQSLFb; store-idc=useast2a; ssid_ucp_v1=1.0.0-KDk3OTU1YjZlNTlhZTY1YzA4NDNjZWI3ZGRlNDQwZWI4Yzg2ZDdjZjkKIAiCiK-Qifqyrl4QhpnSmQYYswsgDDD9mPPyBTgHQPQHEAMaBm1hbGl2YSIgOWQzNjA3M2EyYzkxOWZiOTYxYWRmZTU4MTlhMGY2ZmI; __tea_cache_tokens_1988={%22_type_%22:%22default%22%2C%22user_unique_id%22:%227137277833173501442%22%2C%22timestamp%22:1661777205206}; _tea_utm_cache_1988={%22utm_source%22:%22copy%22%2C%22utm_medium%22:%22android%22%2C%22utm_campaign%22:%22client_share%22}; bm_sz=EF5C07D5C3C8403DBD8055815858B732~YAAQ7as0Fya7vn+DAQAAUp/0ohH58SOPw5vVwR/x5svtBZQp2KhWJSMc33aQXi2UNMAGrgPscvudZe6JaUrs+d6CRxpxqDehv0l7nXA3AUbwkltkO3gKp+decqUQwkmaTj+DI9+A/twoDh6ugf+VeSHnIAndHd2Xmb7SRSKMshLZjAWgMIie0eKkbJjKxU7YMy1YHQrVYwoDLOup0l+Qvq0JRC1EJF4sFph0/o17ROFk6wHyMNU95gQV+wIf2Etm8UikOK1cfte61E/4g9MydKgN3YXH6wNG9MkYI+o5QLOlo60=~4601905~3687732; cmpl_token=IGNORE; odin_tt=d29b75dbfa8a5cb76ea47ab5e69017f81b1a8265121634cbf4a55c5b4d358c74db19ab3c8a4d5ad91cdac7a5c4b52e499bd6c9f75a053402ed9c4151f27c00572f9bc246c8e577a75dd7119c9288159c; passport_csrf_token=7591e7deba97bfd5824f5b086d74da55; passport_fe_beating_status=true; sessionid=9d36073a2c919fb961adfe5819a0f6fb; sessionid_ss=9d36073a2c919fb961adfe5819a0f6fb; sid_tt=9d36073a2c919fb961adfe5819a0f6fb; sid_ucp_v1=1.0.0-KDk3OTU1YjZlNTlhZTY1YzA4NDNjZWI3ZGRlNDQwZWI4Yzg2ZDdjZjkKIAiCiK-Qifqyrl4QhpnSmQYYswsgDDD9mPPyBTgHQPQHEAMaBm1hbGl2YSIgOWQzNjA3M2EyYzkxOWZiOTYxYWRmZTU4MTlhMGY2ZmI; store-country-code=id; tt-target-idc=alisg; tt_csrf_token=ZJsDh46a-ZjdBchFES-jl9Y8itac37VkXdNw; uid_tt_ss=4778947824c972f4ae948da66a41db3ee6335f7c8dc178c89707e0c88f74bc77',
				},
			});

			const $ = cheerioLOAD(res);
			const parsed = await parseData(JSON.parse($('#SIGI_STATE').html()), keyword);

			if (parsed.type == 'images') {
				resolve(parsed);
			}

			const withNoWatermark = (
				await fetchJSON(URL_API + new URLSearchParams(buildHead(parsed.keyword).params), {
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
			log(err);
			resolve({ error: err.message });
		}
	});
