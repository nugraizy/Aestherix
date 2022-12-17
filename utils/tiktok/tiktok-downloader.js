import fetch from 'node-fetch';
import got from 'got';

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
		uniqueId: arr?.ItemModule?.[keyword]?.authorId,
		nickname,
		biograph: biograph || 'No bio yet.',
		verified,
		liked,
		shared,
		comment,
		view,
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
 * @typedef {{author: string, uniqueId: string, nickname: string, liked: number, shared: number, comment: number, view: number, videoDescription: string, biograph: string}} ParsedContainer
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
				const req = (await fetch(url))?.url;

				if (!req) {
					resolve({ error: 'download failed. either the access is denied, or other error.' });
					return;
				}

				const { origin, pathname } = new URL(req);

				keyword = pathname.split('/').slice(-1)[0];

				url = origin + pathname;
			}

			const res = (
				await got(url, {
					headers: {
						'user-agent':
							'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.81 Safari/537.36',
					},
					http2: true,
					method: 'GET',
					throwHttpErrors: false,
				})
			).body;

			const $ = cheerioLOAD(res);

			const parsed = await parseData(JSON.parse($('#SIGI_STATE').html()), keyword);

			if (parsed.type == 'images') {
				resolve(parsed);
			}

			/* eslint-disable-next-line */
			const videoRaw = await fetchJSON(_api + new URLSearchParams(buildHead({ aweme_id: parsed.keyword }).params), {
				headers: buildHead().headers,
				Cookie:
					'tt_csrf_token=rnilmZq1-B7Qzbi2LFZWXUtvwo6wUqvbxXXM; tiktok_webapp_theme=light; __tea_cache_tokens_1988={"_type_":"default","user_unique_id":"7177355450844857857","timestamp":1671108307651}; csrf_session_id=438868e5d6992b7098ca485e6f1f71ff; tt_chain_token=Znm+At8/ELjBLJBbFPJ1eg==; _abck=18CA70181BACEFC30479C7E964069ECB~0~YAAQmqwwF7PlbxWFAQAAEhhIGwlwO66d8ByCsxSWnLzF4LvomUBc1h+F94p+TXC5r+SdocIxW7tC/PYhb3IqskpR/J8X6aoNPh6NBvun3Nyx46VLxwKfDu5Ggg9cOzgQDauzW954BaOHLaWFgkeX5axYNW4X+Jy65kVRaJRPLstAZjEYIl5p+2QY+ADFU8UBrHLI/826vfNZ/El35jq18dgoJYu/RnBdXWYKsIR7XmRP9tMzGJKaz0WpqsF72RZIAbG1Va6wdyQ/ej2xH70QTfokWCdKhg+Oo8K2O2TSK4eFscWdNYt58U9LU/7N2n9OPNt01CXBl/w2GZVA9x4ZQ+MmcEklv53NzfvdRj5AQ98TnT3cthLj7wpE57jNoqRJlYWJ1fD+C2UtJlQTXIFKumWf1NDNRqk=~-1~-1~-1; bm_sz=8F61B22309AF25BABEA85D0F139BE94F~YAAQmqwwF7blbxWFAQAAEhhIGxLHcY5T+J3hsDxYk6KAscvpLBr9VP/Pku48s0aKD8LoOKyUO7JkF0cycGPpeDARMYgMi1+wgvFdbHoZf79b43C2ryvyCwPDQ1/2Zklz3H4D1NbKXyf0nn7z2hJMOrNR/v6ASiCnra1pG7SyuFKqxRtI/9jI/eiPFC6kzk6fIGLwqV+58L904P4uI8r3OyaYXyYVjzYwE5JlD88wC0BvRlyVkauH5XaGjfxdRy8RyQ0K0mQ2E+Z2nVq2gfgMFd6sRsVOVCMaZlW9S8RitGh9lOs=~3687234~3551286; _tea_utm_cache_3053={"utm_source":"more","utm_medium":"android","utm_campaign":"client_share"}; _tea_utm_cache_1988={"utm_source":"more","utm_medium":"android","utm_campaign":"client_share"}; _tea_utm_cache_345918={"utm_source":"more","utm_medium":"android","utm_campaign":"client_share"}; passport_csrf_token=863c0d826007554b14c7e57ac830f1d6; passport_csrf_token_default=863c0d826007554b14c7e57ac830f1d6; s_v_web_id=verify_lbqr9jv2_HJT2HbR1_h9Wf_4TmD_ABm9_laYe1gbl6bqs; cmpl_token=IGNORE; sid_guard=5b84b877afba33a3f384b3816a61045a|1671210351|5184000|Tue,+14-Feb-2023+17:05:51+GMT; uid_tt=fc618c770798363bde27a8e326842d0701c5236e2f038b00a16b97004d4de16c; uid_tt_ss=fc618c770798363bde27a8e326842d0701c5236e2f038b00a16b97004d4de16c; sid_tt=5b84b877afba33a3f384b3816a61045a; sessionid=5b84b877afba33a3f384b3816a61045a; sessionid_ss=5b84b877afba33a3f384b3816a61045a; sid_ucp_v1=1.0.0-KDhhNTRmMjAxOTgwNzI3MDFjNTlmOGVmNWJkZjE1NGJiNDAyMDdhNjUKIAiCiK-Qifqyrl4Q78rynAYYswsgDDD9mPPyBTgHQPQHEAMaBm1hbGl2YSIgNWI4NGI4NzdhZmJhMzNhM2YzODRiMzgxNmE2MTA0NWE; ssid_ucp_v1=1.0.0-KDhhNTRmMjAxOTgwNzI3MDFjNTlmOGVmNWJkZjE1NGJiNDAyMDdhNjUKIAiCiK-Qifqyrl4Q78rynAYYswsgDDD9mPPyBTgHQPQHEAMaBm1hbGl2YSIgNWI4NGI4NzdhZmJhMzNhM2YzODRiMzgxNmE2MTA0NWE; store-idc=useast2a; store-country-code=id; store-country-code-src=uid; tt-target-idc=alisg; bm_mi=28EE366197DDA06323DBAC0098F42BE4~YAAQjawwFwm0d/GEAQAAA0fmGxJuvnf8mwwoMt0mW1hG0b2pKjPq94VzAg0pSfknMyWm+epTchnncwIwQg/byXt42lOeHukpm0fPDxdopu1bTIVT35kJlrkqN+7pkZPIT0C3P+rytS1spAe4oYNdc71ZH4eiZsQ3TnEcjhBliG5UUyC8NBnMjMduMeBmiytMEMh+a5bJ5X0CCH09xFwC0q0IlAqc+9U0Vf/KZfuCdtcfmegigg1j15tY8Hs347E6u/JKinCjEThH9ik33TvSddMaWaRiAFYVqEY79D66Y8plpdvTc5UeDyWaE99/BZKJjSiQqGvws3DsJ6CRJBN7XV4OzFXq/lzcFR+yli2evIVdTdE=~1; tt-target-idc-sign=GYpXK5GOpUuwpDv3BYcdPha-JcBIy4EVE8yxta_AF_swxGKUN-qRx5NYnirZKvF_4JC31H8pmtkW8C68dnuh_qxnVPDE0KMxVxNvj4mCbkrlOcaagVUFg_NcNEuUK8YfTb58bOQVY45aQAhkorqxRF8RRe7ekICV81iNqDCS5e6l2tAJu4wG9_n_C1FgJXb_n1B1QDdjFQvPEQc-bn2wDTsVdxDHxqyR5UFu_a_jhrSFHzqb5_wrUnWlzubOKThmX7aoEj4qFqw0Z_p6ctu_fQKfIKCVW3ttfHqkLI_sJpy-9VJRam1LnbrI5ctzUZInXsTNCxFPGQNKGAdWhzRNvFzYVSun9VQkUr8FwbBEJt39MPDz72aj-AEUFU6aDlOZTecCi9HKigZiCrOkt74Zd_1bjzIoQO2YlebI4SFu80y6LT6C2RAEwu4jcW7Did8tui0bkGhMneg-BPxm9z9xQuBQrsjCTZ8ITc4uflryNBiajI4Kiwpwy31dd57ideaZ; ttwid=1|AsvH48d0XoAtAMzp2tm7k_j765J3ar7Nrp76zGH2CuI|1671210359|4ec04db1aab775167af5e8a55ac9a4074ac56d0afe213997415d2b0436640fd0; odin_tt=bfce62a7f2d625ba4270d440ef40d1b125c69c30fe9242c20e31d562203833695ba17d19681b5a9f9ba36fcefb9af0429ce4673a2ac01cae4a9d90fd5ef9fe96e12594972332d28eca546f0ee5c5c125; ak_bmsc=C3C595BFDA0547AF9B465979184ABA0F~000000000000000000000000000000~YAAQjawwFya0d/GEAQAAFV3mGxIOgOrIZpMkZq2Wm4kvx/sttIqtbKFwbquQ23n5PLI4vHUzE2uAfsNyWCJ8mYkj8+WOVp43OpjfW7xdFz5w4DL+ol09bESjDnIxdhtRCD1fyKAu28Jt/jVxmCMjd3KqG3T/ljFAEP22mxfuu7BfOkPZENSJZDgBaDsV3TSWeHHa7XzWu8Toi62bDHX0lgFehVOqnaL0fF4ydvV+0gCBXnzc5m6O+F4olq/zWvRJDYjeS34CreeQB5pEvhYpjFuVUIHeeOW4kR9sI6XcGqVUf/NZSEIPOwbg7cQT5GQIzxbDwLRPm18aSJExRjHJW30JewJthfGKzhdd42ue1uXB7YN4ovbClBZdexZXrdWALXAQqtfrAqQseEVj/9NkH6skkbusquCm4RPknPDOPGA9dYgvBypzZj450gfhN+lqbsO30SdouLk7IKBYpOQOZFc=; bm_sv=C673153EDB189E494303ABB1F9BEA381~YAAQjawwF3+0d/GEAQAAn4DmGxInER+T9VEXyRWihUIXgDWkLp8E9SmMdCrPfZABfBvQWzJwVWxKgUCj9UdAmWusuOeNjGE+cj8HKm5Fz4XGO/RjaxRwSSVPXsvaau6YGOicvjyEL0OIUR+LzeBruBhTMoVeZOF5T7uyVToeTlrOio+Qfs+lKwtyCAo1IsSg/edE+QeqoAEp7FluKe2iegpDwpDIBk6uOk0nYFGuMuGVUPlJgbTduWTIUXJVFW5uYw==~1; msToken=TbWTROQIFLLg_hyIgwVFm6Q3ueBOZH_wTYshcR_ijEARSLEJPc1ISsElfEOj99quJb_d5QUfOEUCCnFLoL4_2ALJXnKkeVtDrXU92UHhTnFmjhSmIQ7fkDFyM033cBXYd5gHaO1xkIKCEySN; msToken=TbWTROQIFLLg_hyIgwVFm6Q3ueBOZH_wTYshcR_ijEARSLEJPc1ISsElfEOj99quJb_d5QUfOEUCCnFLoL4_2ALJXnKkeVtDrXU92UHhTnFmjhSmIQ7fkDFyM033cBXYd5gHaO1xkIKCEySN; passport_fe_beating_status=false',
			});

			const userRaw = await fetchJSON(
				`https://api2.musical.ly/aweme/v1/discover/search/?keyword=${
					parsed.author
				}&cursor=0&count=10&type=1&hot_search=0&search_source=discover${new URLSearchParams(
					buildHead().params_users,
				).toString()}`,
				{
					headers: {
						'User-Agent': buildHead().headers['User-Agent'],
						Cookie:
							'tt_csrf_token=rnilmZq1-B7Qzbi2LFZWXUtvwo6wUqvbxXXM; tiktok_webapp_theme=light; __tea_cache_tokens_1988={"_type_":"default","user_unique_id":"7177355450844857857","timestamp":1671108307651}; csrf_session_id=438868e5d6992b7098ca485e6f1f71ff; tt_chain_token=Znm+At8/ELjBLJBbFPJ1eg==; _abck=18CA70181BACEFC30479C7E964069ECB~0~YAAQmqwwF7PlbxWFAQAAEhhIGwlwO66d8ByCsxSWnLzF4LvomUBc1h+F94p+TXC5r+SdocIxW7tC/PYhb3IqskpR/J8X6aoNPh6NBvun3Nyx46VLxwKfDu5Ggg9cOzgQDauzW954BaOHLaWFgkeX5axYNW4X+Jy65kVRaJRPLstAZjEYIl5p+2QY+ADFU8UBrHLI/826vfNZ/El35jq18dgoJYu/RnBdXWYKsIR7XmRP9tMzGJKaz0WpqsF72RZIAbG1Va6wdyQ/ej2xH70QTfokWCdKhg+Oo8K2O2TSK4eFscWdNYt58U9LU/7N2n9OPNt01CXBl/w2GZVA9x4ZQ+MmcEklv53NzfvdRj5AQ98TnT3cthLj7wpE57jNoqRJlYWJ1fD+C2UtJlQTXIFKumWf1NDNRqk=~-1~-1~-1; bm_sz=8F61B22309AF25BABEA85D0F139BE94F~YAAQmqwwF7blbxWFAQAAEhhIGxLHcY5T+J3hsDxYk6KAscvpLBr9VP/Pku48s0aKD8LoOKyUO7JkF0cycGPpeDARMYgMi1+wgvFdbHoZf79b43C2ryvyCwPDQ1/2Zklz3H4D1NbKXyf0nn7z2hJMOrNR/v6ASiCnra1pG7SyuFKqxRtI/9jI/eiPFC6kzk6fIGLwqV+58L904P4uI8r3OyaYXyYVjzYwE5JlD88wC0BvRlyVkauH5XaGjfxdRy8RyQ0K0mQ2E+Z2nVq2gfgMFd6sRsVOVCMaZlW9S8RitGh9lOs=~3687234~3551286; _tea_utm_cache_3053={"utm_source":"more","utm_medium":"android","utm_campaign":"client_share"}; _tea_utm_cache_1988={"utm_source":"more","utm_medium":"android","utm_campaign":"client_share"}; _tea_utm_cache_345918={"utm_source":"more","utm_medium":"android","utm_campaign":"client_share"}; passport_csrf_token=863c0d826007554b14c7e57ac830f1d6; passport_csrf_token_default=863c0d826007554b14c7e57ac830f1d6; s_v_web_id=verify_lbqr9jv2_HJT2HbR1_h9Wf_4TmD_ABm9_laYe1gbl6bqs; cmpl_token=IGNORE; sid_guard=5b84b877afba33a3f384b3816a61045a|1671210351|5184000|Tue,+14-Feb-2023+17:05:51+GMT; uid_tt=fc618c770798363bde27a8e326842d0701c5236e2f038b00a16b97004d4de16c; uid_tt_ss=fc618c770798363bde27a8e326842d0701c5236e2f038b00a16b97004d4de16c; sid_tt=5b84b877afba33a3f384b3816a61045a; sessionid=5b84b877afba33a3f384b3816a61045a; sessionid_ss=5b84b877afba33a3f384b3816a61045a; sid_ucp_v1=1.0.0-KDhhNTRmMjAxOTgwNzI3MDFjNTlmOGVmNWJkZjE1NGJiNDAyMDdhNjUKIAiCiK-Qifqyrl4Q78rynAYYswsgDDD9mPPyBTgHQPQHEAMaBm1hbGl2YSIgNWI4NGI4NzdhZmJhMzNhM2YzODRiMzgxNmE2MTA0NWE; ssid_ucp_v1=1.0.0-KDhhNTRmMjAxOTgwNzI3MDFjNTlmOGVmNWJkZjE1NGJiNDAyMDdhNjUKIAiCiK-Qifqyrl4Q78rynAYYswsgDDD9mPPyBTgHQPQHEAMaBm1hbGl2YSIgNWI4NGI4NzdhZmJhMzNhM2YzODRiMzgxNmE2MTA0NWE; store-idc=useast2a; store-country-code=id; store-country-code-src=uid; tt-target-idc=alisg; bm_mi=28EE366197DDA06323DBAC0098F42BE4~YAAQjawwFwm0d/GEAQAAA0fmGxJuvnf8mwwoMt0mW1hG0b2pKjPq94VzAg0pSfknMyWm+epTchnncwIwQg/byXt42lOeHukpm0fPDxdopu1bTIVT35kJlrkqN+7pkZPIT0C3P+rytS1spAe4oYNdc71ZH4eiZsQ3TnEcjhBliG5UUyC8NBnMjMduMeBmiytMEMh+a5bJ5X0CCH09xFwC0q0IlAqc+9U0Vf/KZfuCdtcfmegigg1j15tY8Hs347E6u/JKinCjEThH9ik33TvSddMaWaRiAFYVqEY79D66Y8plpdvTc5UeDyWaE99/BZKJjSiQqGvws3DsJ6CRJBN7XV4OzFXq/lzcFR+yli2evIVdTdE=~1; tt-target-idc-sign=GYpXK5GOpUuwpDv3BYcdPha-JcBIy4EVE8yxta_AF_swxGKUN-qRx5NYnirZKvF_4JC31H8pmtkW8C68dnuh_qxnVPDE0KMxVxNvj4mCbkrlOcaagVUFg_NcNEuUK8YfTb58bOQVY45aQAhkorqxRF8RRe7ekICV81iNqDCS5e6l2tAJu4wG9_n_C1FgJXb_n1B1QDdjFQvPEQc-bn2wDTsVdxDHxqyR5UFu_a_jhrSFHzqb5_wrUnWlzubOKThmX7aoEj4qFqw0Z_p6ctu_fQKfIKCVW3ttfHqkLI_sJpy-9VJRam1LnbrI5ctzUZInXsTNCxFPGQNKGAdWhzRNvFzYVSun9VQkUr8FwbBEJt39MPDz72aj-AEUFU6aDlOZTecCi9HKigZiCrOkt74Zd_1bjzIoQO2YlebI4SFu80y6LT6C2RAEwu4jcW7Did8tui0bkGhMneg-BPxm9z9xQuBQrsjCTZ8ITc4uflryNBiajI4Kiwpwy31dd57ideaZ; ttwid=1|AsvH48d0XoAtAMzp2tm7k_j765J3ar7Nrp76zGH2CuI|1671210359|4ec04db1aab775167af5e8a55ac9a4074ac56d0afe213997415d2b0436640fd0; odin_tt=bfce62a7f2d625ba4270d440ef40d1b125c69c30fe9242c20e31d562203833695ba17d19681b5a9f9ba36fcefb9af0429ce4673a2ac01cae4a9d90fd5ef9fe96e12594972332d28eca546f0ee5c5c125; ak_bmsc=C3C595BFDA0547AF9B465979184ABA0F~000000000000000000000000000000~YAAQjawwFya0d/GEAQAAFV3mGxIOgOrIZpMkZq2Wm4kvx/sttIqtbKFwbquQ23n5PLI4vHUzE2uAfsNyWCJ8mYkj8+WOVp43OpjfW7xdFz5w4DL+ol09bESjDnIxdhtRCD1fyKAu28Jt/jVxmCMjd3KqG3T/ljFAEP22mxfuu7BfOkPZENSJZDgBaDsV3TSWeHHa7XzWu8Toi62bDHX0lgFehVOqnaL0fF4ydvV+0gCBXnzc5m6O+F4olq/zWvRJDYjeS34CreeQB5pEvhYpjFuVUIHeeOW4kR9sI6XcGqVUf/NZSEIPOwbg7cQT5GQIzxbDwLRPm18aSJExRjHJW30JewJthfGKzhdd42ue1uXB7YN4ovbClBZdexZXrdWALXAQqtfrAqQseEVj/9NkH6skkbusquCm4RPknPDOPGA9dYgvBypzZj450gfhN+lqbsO30SdouLk7IKBYpOQOZFc=; bm_sv=C673153EDB189E494303ABB1F9BEA381~YAAQjawwF3+0d/GEAQAAn4DmGxInER+T9VEXyRWihUIXgDWkLp8E9SmMdCrPfZABfBvQWzJwVWxKgUCj9UdAmWusuOeNjGE+cj8HKm5Fz4XGO/RjaxRwSSVPXsvaau6YGOicvjyEL0OIUR+LzeBruBhTMoVeZOF5T7uyVToeTlrOio+Qfs+lKwtyCAo1IsSg/edE+QeqoAEp7FluKe2iegpDwpDIBk6uOk0nYFGuMuGVUPlJgbTduWTIUXJVFW5uYw==~1; msToken=TbWTROQIFLLg_hyIgwVFm6Q3ueBOZH_wTYshcR_ijEARSLEJPc1ISsElfEOj99quJb_d5QUfOEUCCnFLoL4_2ALJXnKkeVtDrXU92UHhTnFmjhSmIQ7fkDFyM033cBXYd5gHaO1xkIKCEySN; msToken=TbWTROQIFLLg_hyIgwVFm6Q3ueBOZH_wTYshcR_ijEARSLEJPc1ISsElfEOj99quJb_d5QUfOEUCCnFLoL4_2ALJXnKkeVtDrXU92UHhTnFmjhSmIQ7fkDFyM033cBXYd5gHaO1xkIKCEySN; passport_fe_beating_status=false',
					},
				},
			);
			const userDetails = userRaw.user_list.find((v) => v.user_info.uid === parsed.uniqueId);

			Object.assign(parsed, {
				following: userDetails.user_info.following_count,
				followers: userDetails.user_info.follower_count,
				heart: userDetails.user_info.total_favorited,
				totalVideo: userDetails.user_info.aweme_count,
			});

			const withNoWatermark = videoRaw.aweme_list.find((v) => v.aweme_id === parsed.keyword).video.play_addr.url_list[
				Math.floor(Math.random() * 3)
			];

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
