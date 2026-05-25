import asyncRetry from 'async-retry';
import crypto from 'crypto';
import heic from 'heic-convert';
import { fetch } from 'undici';
import { v4 } from 'uuid';

import { cheerioLOAD, randomChar } from '../modules/index.js';
import { _api as API_BASE_URL, appVersion, checkValid, deviceIds, iids, lastInstall, random } from './util.js';

const CACHE_TTL_MS = 10 * 60 * 1000;
const RETRY_OPTIONS = { minTimeout: 0, retries: 20 };
const MERGE_TIMEOUT_MS = 15000;
const PARALLEL_REQUESTS = 200;

const COOKIE = (process.env.COOKIE_TIKTOK_COM || '').replace(/\n/g, '');

const USER_AGENTS = {
	web: 'Mozilla/5.0 (Linux; Android 11; SAMSUNG SM-G973U) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/14.2 Chrome/87.0.4280.141 Mobile Safari/537.36',
	android: 'com.ss.android.ugc.trill/260103 (Linux; U; Android 13; en_US; Pixel 7; Build/TD1A.220804.031; Cronet/58.0.2991.0)',
	musically:
		'com.zhiliaoapp.musically/300904 (2018111632; U; Android 10; en_US; Pixel 4; Build/QQ3A.200805.001; Cronet/58.0.2991.0)'
};

class TTLCache {
	#store = new Map();

	get(key) {
		const entry = this.#store.get(key);

		if (!entry) {
			return null;
		}

		if (Date.now() > entry.expiry) {
			this.#store.delete(key);
			return null;
		}

		return entry.value;
	}

	set(key, value) {
		this.#store.set(key, { value, expiry: Date.now() + CACHE_TTL_MS });
	}

	has(key) {
		return this.get(key) !== null;
	}
}

function generateMsToken() {
	const timestamp = Date.now().toString();
	const sha1 = crypto.createHash('sha1').update(timestamp).digest('hex');

	return crypto.createHash('md5').update(sha1).digest('hex');
}

function buildParams(overrides = {}) {
	const defaults = {
		version_name: '30.9.4',
		version_code: '300904',
		build_number: '30.9.4',
		manifest_version_code: '300904',
		update_version_code: '300904',
		iid: '7318518857994389254'
	};

	return new URLSearchParams({ ...defaults, ...overrides }).toString();
}

function findFirst(arr) {
	if (!arr) {
		return null;
	}

	return arr.find((v) => v) || null;
}

async function awemeRequest(path, body, method = 'GET') {
	const response = await fetch(API_BASE_URL + path + body, { method });
	const json = await response.json().catch(() => '');

	return json;
}

async function resolveVideoId(url) {
	url = url.includes('vm.tiktok.com') ? url.replace('vm.tiktok.com', 'vt.tiktok.com') : url;

	if (/((vt|vm|vk)\.tiktok\.com)/g.test(url) || !url.includes('video') || !url.includes('photo')) {
		const req = (await fetch(url, { method: 'HEAD', redirect: 'follow' }))?.url;

		if (!req) {
			return { error: 'download failed. either the access is denied, or other error.' };
		}

		return new URL(req).pathname.split('/').pop();
	}

	return new URL(url).pathname.split('/').pop();
}

async function fetchUserDetail(username) {
	username = '@' + username.replace('@', '');

	const response = await fetch(`https://www.tiktok.com/${username}`, {
		headers: { 'User-Agent': USER_AGENTS.web }
	});

	if (response.status === 404) {
		return { error: 'User not found' };
	}

	const html = await response.text();
	const rawData = cheerioLOAD(html)('script[id="__UNIVERSAL_DATA_FOR_REHYDRATION__"]').html();

	return JSON.parse(rawData);
}

async function convertHeicToJpg(url) {
	const res = await fetch(url);

	return heic({ buffer: Buffer.from(await res.arrayBuffer()), format: 'JPEG', quality: 100 });
}

function raceWithTimeout(promise, ms) {
	return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('Merge timeout')), ms))]);
}

function parallelRace(requestFn, count = PARALLEL_REQUESTS) {
	const requests = Array.from({ length: count }, () => requestFn());

	return Promise.any(requests);
}

class ResponseParser {
	parseCrawlerResponse(dataPosts, dataUsers) {
		const { avatarLarger, signature, verified, bioLink, privateAccount } =
			dataUsers.__DEFAULT_SCOPE__['webapp.user-detail'].userInfo.user;

		if (privateAccount) {
			return { error: 'User is private' };
		}

		const { author, author_user_id } = dataPosts.aweme_list[0]; // eslint-disable-line
		const [x, y] = avatarLarger.match(/(\d+)x(\d+)/gi)?.[0]?.split('x') || [0, 0];

		const result = {
			author: {
				id: author_user_id, // eslint-disable-line
				username: author.unique_id,
				nickname: author.nickname,
				...(author.ins_id ? { instagram: author.ins_id } : {}),
				region: author.region,
				bio: signature,
				verified,
				private: privateAccount,
				statistics: {
					follower: author.follower_count,
					following: author.following_count,
					favorite: author.total_favorited
				}
			},
			urls: {
				avatar: { url: avatarLarger, dimension: { x, y } },
				...(bioLink?.link ? { externalUrls: { url: bioLink.link } } : {})
			}
		};

		result.urls.posts = dataPosts.aweme_list.map((v) => {
			const { music, share_url, statistics, status, video, video_control: videoControl } = v; // eslint-disable-line

			return {
				statistic: {
					comment: statistics.comment_count,
					like: statistics.digg_count,
					download: statistics.download_count,
					repost: statistics.forward_count,
					share: statistics.share_count,
					views: statistics.play_count
				},
				status: {
					comment: status.allow_comment,
					share: status.allow_share,
					download: videoControl.allow_download,
					duet: videoControl.allow_duet,
					music: videoControl.allow_music,
					reacts: videoControl.allow_react,
					stitch: videoControl.allow_stitch
				},
				...(music.owner_handle
					? {
							music: {
								username: music.owner_handle,
								nickname: music.owner_nickname,
								duration: music.duration,
								title: music.title,
								verfiedArtist: music.is_author_artist,
								originalMusic: music.is_original_sound,
								urls: {
									avatar: music?.avatar_thumb.url_list.find((v) => v.includes('.jpeg')),
									cover: music?.cover_large.url_list.find((v) => v.includes('.jpeg')),
									musicUrl: music?.play_url.url_list[0]
								}
							}
						}
					: { music: 'copyrighted music' }),
				video: {
					urls: {
						cover: {
							static: video.cover?.url_list?.[0],
							animated: video.animated_cover?.url_list?.[0]
						},
						video: {
							withWatermark: { size: video.download_addr.data_size, url: video.download_addr.url_list[0] },
							withoutWatermark: { size: video.play_addr.data_size, url: video.play_addr.url_list[0] },
							withoutWatermarkHighest: { size: video.bit_rate[0].data_size, url: video.bit_rate[0].play_addr.url_list[0] }
						}
					}
				},
				urls: { shareUrl: share_url } // eslint-disable-line
			};
		});

		return result;
	}

	extractVideoMetadata(data) {
		const {
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
				download_addr, // eslint-disable-line
				play_addr: { url_list: noWatermarkList },
				bit_rate: bitRate,
				play_addr_bytevc1: playAddrByteVC1,
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
		} = data;

		const withWatermarkList = download_addr?.url_list || []; // eslint-disable-line
		const musicCoverList =
			data.music[data.music?.cover_hd ? 'cover_hd' : data.music?.cover_large ? 'cover_large' : 'cover_medium'].url_list;

		const result = {
			keyword: data.aweme_id,
			videoDescription,
			published,
			author,
			liked,
			shared,
			comment,
			view,
			downloaded,
			locationCreated,
			avatarList,
			noWatermarkList,
			withWatermarkList,
			highestNoWatermarkList: null,
			videoDuration,
			ratio,
			videoThumbnailList,
			musicTitle,
			authorMusic,
			musicList,
			musicDuration,
			musicCoverList
		};

		if (bitRate?.[0]) {
			result.highestNoWatermarkList = bitRate[0].play_addr.url_list;
			result.ratio = `${bitRate[0].play_addr.width}p`;
			result.fps = bitRate[0].fps;
		} else if (playAddrByteVC1) {
			result.highestNoWatermarkList = bitRate[0].play_addr.url_list;
			result.ratio = `${bitRate[0].play_addr.width}p`;
		}

		return result;
	}

	async buildMediaResult(data, type, wait) {
		const {
			keyword: aweme_id, // eslint-disable-line
			author: { unique_id, uid, signature: biograph, custom_verify: verified, nickname }, // eslint-disable-line
			...meta
		} = this.extractVideoMetadata(data);

		const typeToUse = type || 'video';

		const result = {
			keyword: aweme_id, // eslint-disable-line
			author: unique_id, // eslint-disable-line
			uniqueId: uid,
			nickname,
			type: typeToUse,
			biograph: biograph || 'No bio yet.',
			verified: verified !== '',
			videoDescription: meta.videoDescription,
			published: meta.published,
			liked: meta.liked,
			shared: meta.shared,
			comment: meta.comment,
			view: meta.view,
			downloaded: meta.downloaded,
			locationCreated: meta.locationCreated,
			videoDuration: meta.videoDuration,
			ratio: meta.ratio,
			fps: meta.fps,
			musicTitle: meta.musicTitle,
			authorMusic: meta.authorMusic,
			musicDuration: meta.musicDuration,
			url: {
				profilePicture: meta.avatarList[0],
				videoThumbnail: meta.videoThumbnailList[0],
				music: meta.musicList[0],
				musicCoverPicture: meta.musicCoverList[0]
			}
		};

		if (typeToUse === 'images') {
			await wait.update(
				`Preparing TikTok ${data?.image_post_info?.images.length} Images. Converting HEIC to JPG if needed. Please wait...`
			);

			const images = data.image_post_info.images;

			result.url.images = await Promise.all(
				images.map(async (v, i) => ({
					url: v.display_image.url_list[0],
					urlWithWatermark: images[i].owner_watermark_image.url_list[0],
					buffer: await convertHeicToJpg(v.display_image.url_list[0]),
					index: i + 1
				}))
			);
		} else {
			result.url.withWatermark = findFirst(meta.withWatermarkList);
			result.url.withNoWatermark = findFirst(meta.noWatermarkList);
			result.url.withoutWatermarkHighest = findFirst(meta.highestNoWatermarkList);
		}

		return result;
	}

	parseUserInfo(data) {
		const { user, stats } = data.__DEFAULT_SCOPE__['webapp.user-detail'].userInfo;

		return {
			keyword: user.id,
			username: user.uniqueId,
			fullName: user.nickname,
			biography: user.signature,
			isVerified: user.verified,
			profileHD: user.avatarLarger,
			profileSD: user.avatarMedium,
			profileLOW: user.avatarThumb,
			followers: stats.followerCount,
			following: stats.followingCount,
			heart: stats.heart,
			totalVideo: stats.videoCount
		};
	}

	parseUsersInfo(dataUsers) {
		return dataUsers.user_list.map(({ user_info: u }) => ({
			keyword: u.uid,
			fullName: u.nickname,
			username: u.unique_id,
			biography: u.signature,
			isVerified: !!u.enterprise_verify_reason,
			followers: u.follower_count,
			following: u.following_count,
			heart: u.total_favorited,
			totalVideo: u.aweme_count,
			profileHD: u.avatar_larger.url_list[1],
			profileSD: u.avatar_medium.url_list[1],
			profileLOW: u.avatar_thumb.url_list[1]
		}));
	}
}

class Tiktok {
	#cache = new TTLCache();
	#parser = new ResponseParser();

	get search() {
		return {
			users: (...usernames) => this.#batchOperation(usernames.flat(), (u) => this.#fetchSearchUsers(u)),
			lookup: (...usernames) => this.#batchOperation(usernames.flat(), (u) => this.#fetchUserLookup(u))
		};
	}

	get users() {
		return {
			posts: (...usernames) => this.#batchOperation(usernames.flat(), (u) => this.#fetchUserPosts(u))
		};
	}

	get download() {
		return {
			post: (urls, wait) => this.#downloadPosts(urls, wait)
		};
	}

	async #batchOperation(keys, fetchFn) {
		const result = {};

		for (const key of keys) {
			if (result[key]) {
				continue;
			}

			const cached = this.#cache.get(key);

			if (cached) {
				result[key] = cached;
				continue;
			}

			const response = await fetchFn(key);

			result[key] = response;
			this.#cache.set(key, response);
		}

		return result;
	}

	async #downloadPosts(urls, wait) {
		const result = {};

		for (let url of [...urls.flat()]) {
			const validation = checkValid(url);

			if (validation.error) {
				result[url] = { error: validation.message };
				continue;
			}

			url = new URL(url).origin + new URL(url).pathname;

			if (result[url]) {
				continue;
			}

			const cached = this.#cache.get(url);

			if (cached) {
				result[url] = cached;
				continue;
			}

			const response = await this.#fetchVideoData(url, wait);

			result[url] = response;
			this.#cache.set(url, response);
		}

		return result;
	}

	async #fetchVideoData(url, wait) {
		const videoId = await resolveVideoId(url);

		if (videoId.error) {
			return videoId;
		}

		return this.#fetchVideoDataWithRetry(videoId, wait);
	}

	async #fetchVideoDataWithRetry(videoId, wait) {
		const ranVersion = random(appVersion);
		const versionCode = ranVersion
			.split('.')
			.map((v) => String(v).padStart(2, '0'))
			.join('');

		const body = buildParams({
			aweme_id: videoId,
			iid: random(iids),
			device_id: random(deviceIds),
			channel: 'googleplay',
			aid: '1233',
			app_name: 'musical_ly',
			version_code: versionCode,
			version_name: ranVersion,
			device_platform: 'android',
			os: 'android',
			ssmix: 'a',
			_rticket: Date.now(),
			cdid: v4(),
			update_version_code: '2023501030',
			ab_version: ranVersion,
			resolution: '1080*2400',
			dpi: 420,
			device_type: 'Pixel 7',
			device_brand: 'Google',
			language: 'en',
			os_api: '29',
			os_version: '14',
			ac: 'wifi',
			is_pad: '0',
			current_region: 'US',
			app_type: 'normal',
			sys_region: 'US',
			last_install_time: lastInstall(),
			timezone_name: 'America/New_York',
			residence: 'US',
			app_language: 'en',
			timezone_offset: '-14400',
			host_abi: 'armeabi-v7a',
			locale: 'en',
			ac2: 'wifi5g',
			uoo: '1',
			carrier_region: 'US',
			op_region: 'US',
			build_number: ranVersion,
			region: 'US',
			ts: Math.floor(Date.now() / 1000)
		});

		const data = await asyncRetry(async () => {
			const result = await parallelRace(async () => {
				const data = await awemeRequest('aweme/v1/feed/?', body, 'OPTIONS');

				if (data === '') {
					throw new Error('No data');
				}

				return data;
			});

			const response = await raceWithTimeout(this.#mergeMediaResponse(result, videoId, 'aweme_list', wait), MERGE_TIMEOUT_MS);

			if (response?.error) {
				throw new Error(response.error);
			}

			return response;
		}, RETRY_OPTIONS);

		return data || { error: 'Post not found. Please try again later.' };
	}

	async #mergeMediaResponse(dataPosts, videoId, property, wait) {
		if (dataPosts.status_code !== 0) {
			return { error: dataPosts.status_msg };
		}

		const post = dataPosts?.[property]?.find((v) => v.aweme_id === videoId);

		if (!post) {
			return { error: 'Download failed. either the access is denied, or other error.' };
		}

		const userData = await fetchUserDetail(post.author.unique_id);

		if (userData.error) {
			return userData;
		}

		const type = post.image_post_info?.images?.length ? 'images' : undefined;
		const mediaResult = await this.#parser.buildMediaResult(post, type, wait);
		const { url: urls, ...rest } = mediaResult;
		const userStats = userData.__DEFAULT_SCOPE__['webapp.user-detail'].userInfo.stats;

		return {
			...rest,
			following: userStats.followingCount,
			followers: userStats.followerCount,
			heart: userStats.heart,
			totalVideo: userStats.videoCount,
			urls
		};
	}

	async #fetchSearchUsers(username) {
		const body = buildParams({
			version_name: '10.3.3',
			version_code: '100303',
			build_number: '10.3.3',
			manifest_version_code: '100303',
			update_version_code: '100303',
			openudid: randomChar('0123456789abcdef', 16),
			uuid: randomChar('1234567890', 16),
			_rticket: Date.now() * 1000,
			ts: Date.now(),
			device_brand: 'Google',
			device_type: 'Pixel 7',
			device_platform: 'android',
			resolution: '1080*2400',
			dpi: 420,
			os_version: '13',
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
			keyword: username,
			cursor: '0',
			count: '30',
			type: '1',
			hot_search: '0',
			source: 'discover',
			mas: generateMsToken()
		});

		const data = await asyncRetry(async () => {
			const result = await parallelRace(async () => {
				const data = await awemeRequest('aweme/v1/discover/search/?', body, 'OPTIONS');

				if (data === '') {
					throw new Error('No data');
				}

				return data;
			});

			return result;
		}, RETRY_OPTIONS);

		if (!data) {
			return { error: 'User not found. Please try again later.' };
		}

		return this.#parser.parseUsersInfo(data);
	}

	async #fetchUserLookup(username) {
		if (!username.startsWith('@')) {
			username = `@${username.replace(/[^a-zA-Z0-9_.]/gi, '')}`;
		}

		const data = await fetchUserDetail(username);

		if (data.error) {
			return data;
		}

		return this.#parser.parseUserInfo(data);
	}

	async #fetchUserPosts(username) {
		const userData = await fetchUserDetail(username);

		if (userData.error) {
			return userData;
		}

		const body = buildParams({
			version_name: '26.1.3',
			version_code: '260103',
			build_number: '26.1.3',
			manifest_version_code: '260103',
			update_version_code: '260103',
			sec_user_id: userData.__DEFAULT_SCOPE__['webapp.user-detail'].userInfo.user.secUid,
			count: 30,
			max_cursor: 0,
			min_cursor: 0,
			device_id: Array.from({ length: 19 }, () => Math.floor(Math.random() * 10).toString()).join(''),
			mas: generateMsToken()
		});

		const data = await asyncRetry(async (bail) => {
			const result = await parallelRace(async () => {
				const response = await fetch('https://api.tiktokv.com/aweme/v1/aweme/post/?' + body, {
					method: 'GET',
					headers: {
						'User-Agent': USER_AGENTS.android,
						Accept: 'application/json',
						Host: 'api.tiktokv.com',
						Cookie: COOKIE
					}
				});

				if (!response.ok) {
					throw new Error(response.statusText);
				}

				const json = await response.json();

				if (!json) {
					throw new Error('No data found');
				}

				return json;
			});

			if (result.status_msg) {
				bail(new Error('User does not have any post'));
			}

			return result;
		}, RETRY_OPTIONS);

		if (data instanceof Error) {
			return { error: data.message };
		}

		return this.#parser.parseCrawlerResponse(data, userData);
	}
}

export const tiktok = new Tiktok();
