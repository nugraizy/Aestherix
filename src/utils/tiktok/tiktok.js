import axios from 'axios';
import asyncRetry from 'async-retry';
import { fetch } from 'undici';
import crypto from 'crypto';
import { v4 } from 'uuid';
import _ from 'lodash';

import { cheerioLOAD, randomChar } from '../modules/index.js';
import { COOKIE } from './cookie.js';
import { _api as API_BASE_URL, appVersion, checkValid, deviceIds, iids, lastInstall, random } from './util.js';
import { Cache } from '../../helper/modules/cache.js';

class ResponseParser {
	/**
	 * @private
	 */
	_parseCrawlerResponse(dataPosts, dataUsers) {
		const container = {};

		const { avatarLarger, signature, verified, bioLink, privateAccount } =
			dataUsers.__DEFAULT_SCOPE__['webapp.user-detail'].userInfo.user;

		if (privateAccount) {
			return { error: 'User is private' };
		}

		const { author, author_user_id } = dataPosts.aweme_list[0]; // eslint-disable-line

		const [x, y] = avatarLarger.match(/(\d+)x(\d+)/gi)?.[0]?.split('x') || [0, 0];

		container.author = {
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
		};

		container.urls = {};

		container.urls.avatar = {
			url: avatarLarger,
			dimension: {
				x,
				y
			}
		};

		bioLink?.link
			? (container.urls.externalUrls = {
					url: bioLink.link
			  }) // eslint-disable-line
			: null;

		container.urls.posts = dataPosts.aweme_list.map((v) => {
			const { music, share_url, statistics, status, video, video_control } = v; // eslint-disable-line

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
					/* eslint-disable */
					download: video_control.allow_download,
					duet: video_control.allow_duet,
					music: video_control.allow_music,
					reacts: video_control.allow_react,
					stitch: video_control.allow_stitch
					/* eslint-enable */
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
					  } // eslint-disable-line
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
				urls: {
					shareUrl: share_url // eslint-disable-line
				}
			};
		});

		return container;
	}

	/**
	 * @private
	 */
	_extractVideoMetadata(data) {
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

		let withWatermarkList = [];

		// eslint-disable-next-line
		if (download_addr) {
			withWatermarkList = download_addr.url_list; // eslint-disable-line
		}

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
			const {
				fps,
				play_addr: { width: ratio, url_list: highestNoWatermarkList }
			} = bitRate[0];

			result.highestNoWatermarkList = highestNoWatermarkList;
			result.ratio = `${ratio}p`;
			result.fps = fps;
		} else if (playAddrByteVC1) {
			const {
				play_addr: { width: ratio, url_list: highestNoWatermarkList }
			} = bitRate[0];

			result.highestNoWatermarkList = highestNoWatermarkList;
			result.ratio = `${ratio}p`;
		}

		return result;
	}

	/**
	 * @private
	 */
	_extractImageMetadata(data) {
		const images = data?.image_post_info?.images;

		return images
			? images.map((v, i) => ({
					url: v.display_image.url_list[0],
					index: i + 1
			  })) /* eslint-disable-line*/
			: [];
	}

	/**
	 * @private
	 */
	_mapDataToResult(data, type) {
		const {
			keyword: /* eslint-disable-line*/ aweme_id,
			author: { /* eslint-disable-line*/ unique_id, uid, signature: biograph, custom_verify: verified, nickname },
			...videoMetadata
		} = this._extractVideoMetadata(data);

		const typeToUse = type || 'video';

		const {
			avatarList,
			videoThumbnailList,
			musicList,
			musicCoverList,
			noWatermarkList,
			withWatermarkList,
			highestNoWatermarkList
		} = videoMetadata;

		delete videoMetadata.avatarList;
		delete videoMetadata.videoThumbnailList;
		delete videoMetadata.musicList;
		delete videoMetadata.musicCoverList;
		delete videoMetadata.noWatermarkList;
		delete videoMetadata.withWatermarkList;
		delete videoMetadata.highestNoWatermarkList;

		const result = {
			keyword: aweme_id /* eslint-disable-line*/,
			author: unique_id /* eslint-disable-line*/,
			uniqueId: uid,
			nickname,
			type: typeToUse,
			biograph: biograph || 'No bio yet.',
			verified: verified !== '',
			...videoMetadata,
			url: {
				profilePicture: avatarList[0],
				videoThumbnail: videoThumbnailList[0],
				music: musicList[0],
				musicCoverPicture: musicCoverList[0]
			}
		};

		if (typeToUse === 'images') {
			result.url.images = this._extractImageMetadata(data);
		} else {
			result.url.withWatermark = _.find(withWatermarkList, _.identity) || null;
			result.url.withNoWatermark = _.find(noWatermarkList, _.identity) || null;
			result.url.withoutWatermarkHighest = _.find(highestNoWatermarkList, _.identity) || null;
		}

		return result;
	}

	/**
	 * @private
	 */
	_parseMediaResponse(data, type) {
		return this._mapDataToResult(data, type);
	}

	/**
	 * @private
	 */
	_parseUserInfo(arr) {
		const {
			id: keyword,
			signature: biography,
			verified: isVerified,
			avatarLarger: profileHD,
			avatarMedium: profileSD,
			avatarThumb: profileLOW,
			nickname: fullName,
			uniqueId: username
		} = arr.__DEFAULT_SCOPE__['webapp.user-detail'].userInfo.user;

		const {
			followerCount: followers,
			followingCount: following,
			heart,
			videoCount: totalVideo
		} = arr.__DEFAULT_SCOPE__['webapp.user-detail'].userInfo.stats;

		return {
			keyword,
			username,
			fullName,
			biography,
			isVerified,
			profileHD,
			profileSD,
			profileLOW,
			followers,
			following,
			heart,
			totalVideo
		};
	}

	/**
	 * @private
	 */
	_parseUsersInfo(dataUsers) {
		const { user_list: userList } = dataUsers;

		return userList.map(({ user_info: userInfo }) => {
			const {
				uid: keyword,
				nickname: fullName,
				unique_id: username,
				signature: biography,
				enterprise_verify_reason: isVerified,
				follower_count: followers,
				following_count: following,
				total_favorited: heart,
				aweme_count: totalVideo,
				avatar_larger: {
					url_list: [, profileHD]
				},
				avatar_medium: {
					url_list: [, profileSD]
				},
				avatar_thumb: {
					url_list: [, profileLOW]
				}
			} = userInfo;

			return {
				keyword,
				fullName,
				username,
				biography,
				isVerified: !!isVerified,
				followers,
				following,
				heart,
				totalVideo,
				profileHD,
				profileSD,
				profileLOW
			};
		});
	}
}

class RequestModule extends ResponseParser {
	#cookie = COOKIE.TIKTOK_COOKIE.replace(/\n/g, '');
	constructor() {
		super();

		this.commonParameters = {
			/* eslint-disable */
			WebIdLastTime: Date.now(),
			aid: '1988',
			app_language: 'en',
			app_name: 'tiktok_web',
			browser_language: 'en-US',
			browser_name: 'Mozilla',
			browser_online: true,
			browser_platform: 'Win32',
			browser_version:
				'5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0',
			channel: 'tiktok_web',
			cookie_enabled: true,
			device_id: '7340508178566366722',
			device_platform: 'web_pc',
			focus_state: false,
			history_len: 5,
			is_fullscreen: false,
			is_page_visible: true,
			os: 'windows',
			priority_region: 'ID',
			referer: '',
			region: 'ID',
			screen_height: 768,
			screen_width: 1366,
			tz_name: 'Asia/Jakarta',
			webcast_language: 'en'
			/* eslint-enable */
		};
	}

	/**
	 * @private
	 */
	_msToken() {
		const timestamp = Date.now().toString();
		const sha1 = crypto.createHash('sha1').update(timestamp).digest('hex');
		const md5 = crypto.createHash('md5').update(sha1).digest('hex');

		return md5;
	}

	/**
	 * @private
	 */
	_getRequestConfig() {
		return {
			headers: {
				'User-Agent':
					'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 YaBrowser/23.1.5.750 (beta) Yowser/2.5 Safari/537.36',
				Cookie: this.#cookie
			}
		};
	}

	/**
	 * @private
	 */
	_buildApiUrl(params) {
		const queryParams = new URLSearchParams(this._buildRequestParams(params));

		return queryParams.toString();
	}

	/**
	 * @private
	 */
	_buildRequestParams(params) {
		const defaultParams = {
			/* eslint-disable */
			version_name: '30.9.4',
			version_code: '300904',
			build_number: '30.9.4',
			manifest_version_code: '300904',
			update_version_code: '300904',
			iid: '7318518857994389254'

			/* eslint-enable */
		};

		return Object.assign(defaultParams, params);
	}

	/**
	 * @private
	 */
	async _awemeRequest(path, { method, body, config = {} }) {
		if (method === 'GET') {
			const data = await fetch(API_BASE_URL + path + body, config);
			const json = await data.json().catch(() => '');

			return json;
		} else if (method === 'POST') {
			const data = await fetch(API_BASE_URL + path + body, { ...config, method: 'POST' });
			const json = await data.json().catch(() => '');

			return json;
		} else if (method === 'OPTIONS') {
			const data = await fetch(API_BASE_URL + path + body, { ...config, method: 'OPTIONS' });
			const json = await data.json().catch(() => '');

			return json;
		}
	}

	/**
	 * @private
	 */
	async _getUserDetail(username) {
		return new Promise(async (resolve, reject) => {
			try {
				username = '@' + username.replace('@', '');

				let data = await axios.get(`https://www.tiktok.com/${username}`, {
					...this._getRequestConfig(),
					validateStatus: () => true
				});

				if (data.status === 404) {
					return { error: 'User not found' };
				}

				data = data.data;

				const rawData = cheerioLOAD(data)('script[id=__UNIVERSAL_DATA_FOR_REHYDRATION__]').html();

				resolve(JSON.parse(rawData));
			} catch (error) {
				reject(error);
			}
		});
	}

	/**
	 * @private
	 */
	async _fetchUserPostsAttempt(userDetails) {
		return new Promise(async (resolve, reject) => {
			try {
				const body = this._buildApiUrl({
					/* eslint-disable */
					version_name: '26.1.3',
					version_code: '260103',
					build_number: '26.1.3',
					manifest_version_code: '260103',
					update_version_code: '260103',

					sec_user_id: userDetails.__DEFAULT_SCOPE__['webapp.user-detail'].userInfo.user.secUid,
					count: 30,
					max_cursor: 0,
					min_cursor: 0,
					device_id: Array.from({ length: 19 }, () => Math.floor(Math.random() * 10).toString()).join(''),
					mas: this._msToken()
					/* eslint-enable */
				});

				const config = this._getRequestConfig();

				config.headers['User-Agent'] =
					'com.ss.android.ugc.trill/260103 (Linux; U; Android 13; en_US; Pixel 7; Build/TD1A.220804.031; Cronet/58.0.2991.0)';
				config.headers['Accept'] = 'application/json';
				config.headers['Host'] = 'api.tiktokv.com';

				const data = await asyncRetry(
					async (bail) => {
						const request = async () => {
							const bodyFetch = await fetch('https://api.tiktokv.com/aweme/v1/aweme/post/?' + body, {
								method: 'GET',
								...config
							});

							if (!bodyFetch.ok || bodyFetch.status !== 200) {
								throw new Error(bodyFetch.statusText);
							}

							try {
								const json = await bodyFetch.json();

								if (!json) {
									throw new Error('No data found');
								}

								return json;
							} catch {
								throw new Error('Something went wrong while processing json');
							}
						};

						const container = [];

						for (let i = 0; i < 200; i++) {
							container.push(request());
						}

						const resultPromises = await Promise.any(container);

						if (resultPromises.status_msg) {
							bail(new Error('User does not have any post'));
						}

						return resultPromises;
					},
					{
						maxRetryTime: 60 * 1000,
						minTimeout: 0,
						retries: 20
					}
				);

				if (data instanceof Error) {
					resolve({
						error: data.message
					});
				}

				resolve(data);
			} catch (error) {
				reject(error);
			}
		});
	}

	/**
	 * @private
	 */
	_fetchSearchUserDataAttempt(username) {
		return new Promise(async (resolve, reject) => {
			try {
				/* eslint-disable */
				const body = this._buildApiUrl({
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
					mas: this._msToken()
					/* eslint-enable */
				});

				const config = this._getRequestConfig();

				const data = await asyncRetry(
					async () => {
						const request = async () => {
							const data = await this._awemeRequest('aweme/v1/discover/search/?', {
								method: 'OPTIONS',
								body,
								config
							});

							if (data === '') {
								throw new Error('No data');
							}

							return data;
						};

						const container = [];

						for (let i = 0; i < 200; i++) {
							container.push(request());
						}

						const resultPromises = await Promise.any(container);

						return resultPromises;
					},
					{
						maxRetryTime: 60 * 1000,
						minTimeout: 0,
						retries: 20
					}
				);

				if (!data) {
					resolve({ error: 'User not found. Please try again later.' });
				}

				resolve(this._parseUsersInfo(data));
			} catch (error) {
				reject(error);
			}
		});
	}

	/**
	 * @private
	 */
	async _fetchVideoDataAttempt(videoId) {
		return new Promise(async (resolve, reject) => {
			try {
				const ranVersion = random(appVersion);
				const versionCode = ranVersion
					.split('.')
					.map((v) => String(v).padStart(2, '0'))
					.join('');

				const mainParams = {
					app_name: 'musical_ly', // eslint-disable-line
					manifest_app_version: '2023501030' // eslint-disable-line
				};

				const body = this._buildApiUrl({
					/* eslint-disable */
					aweme_id: videoId,

					iid: random(iids),
					device_id: random(deviceIds),
					channel: 'googleplay',
					aid: '1233',
					app_name: mainParams.app_name,
					version_code: versionCode,
					version_name: ranVersion,
					device_platform: 'android',

					os: 'android',
					ssmix: 'a',
					_rticket: Date.now(),
					cdid: v4(),
					update_version_code: mainParams.manifest_app_version,
					update_version_code: mainParams.manifest_app_version,
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
					/* eslint-enable */
				});

				const config = this._getRequestConfig();

				config.headers = {
					'User-Agent':
						'com.zhiliaoapp.musically/300904 (2018111632; U; Android 10; en_US; Pixel 4; Build/QQ3A.200805.001; Cronet/58.0.2991.0)'
				};

				delete config.headers.Cookie;

				const request = async () => {
					const data = await this._awemeRequest('aweme/v1/feed/?', {
						method: 'OPTIONS',
						body,
						config
					});

					if (data === '') {
						throw new Error('No data');
					}

					return data;
				};

				const resultPromises = await request();

				const data = this._mergeMediaResponse(resultPromises, videoId, 'aweme_list');

				if (!data) {
					resolve({ error: 'Post not found. Please try again later.' });
				}

				resolve(data);
			} catch (error) {
				reject(error);
			}
		});
	}

	/**
	 * @private
	 */
	async _fetchUserDetailAttempt(username) {
		const data = await this._getUserDetail(username);

		if (data.error) {
			return data;
		}

		return this._parseUserInfo(data);
	}

	/**
	 * @private
	 */
	async _getVideoId(url) {
		url = url.includes('vm.tiktok.com') ? url.replace('vm.tiktok.com', 'vt.tiktok.com') : url;
		let videoId;

		if (/((vt|vm|vk)\.tiktok\.com)/g.test(url) || !url.includes('video')) {
			const req = (
				await axios.head(url, {
					validateStatus: () => true
				})
			)?.request.res.responseUrl;

			if (!req) {
				return { error: 'download failed. either the access is denied, or other error.' };
			}

			const { origin, pathname } = new URL(req);

			videoId = pathname.split('/').slice(-1)[0];

			url = origin + pathname;
		} else {
			const { pathname } = new URL(url);

			videoId = pathname.split('/').slice(-1)[0];
		}

		return videoId;
	}

	/**
	 * @private
	 */
	async _mergeMediaResponse(dataPosts, videoId, property) {
		if (dataPosts.status_code !== 0) {
			return { error: dataPosts.status_msg };
		}

		dataPosts = dataPosts?.[property]?.find((v) => v.aweme_id === videoId);

		if (!dataPosts) {
			return { error: 'Download failed. either the access is denied, or other error.' };
		}

		const userData = await this._getUserDetail(dataPosts.author.unique_id);

		if (userData.error) {
			return userData;
		}

		dataPosts = this._parseMediaResponse(
			dataPosts,
			dataPosts.image_post_info && dataPosts.image_post_info?.images.length ? 'images' : undefined
		);

		const dataClone = { ...dataPosts };

		delete dataClone.url;

		Object.assign(dataClone, {
			following: userData.__DEFAULT_SCOPE__['webapp.user-detail'].userInfo.stats.followingCount,
			followers: userData.__DEFAULT_SCOPE__['webapp.user-detail'].userInfo.stats.followerCount,
			heart: userData.__DEFAULT_SCOPE__['webapp.user-detail'].userInfo.stats.heart,
			totalVideo: userData.__DEFAULT_SCOPE__['webapp.user-detail'].userInfo.stats.videoCount,
			urls: dataPosts.url
		});

		return dataClone;
	}
}

class TiktokUtils extends RequestModule {
	constructor() {
		super();
	}

	/**
	 * @private
	 */
	async _fetchVideoData(url) {
		return new Promise(async (resolve, reject) => {
			try {
				const videoId = await this._getVideoId(url);

				if (videoId.error) {
					resolve(videoId);
				}

				resolve(await this._fetchVideoDataAttempt(videoId));
			} catch (error) {
				reject(error);
			}
		});
	}

	/**
	 * @private
	 */
	async _fetchSearchUserData(username) {
		return new Promise(async (resolve, reject) => {
			try {
				resolve(await this._fetchSearchUserDataAttempt(username));
			} catch (error) {
				reject(error);
			}
		});
	}

	/**
	 * @private
	 */
	async _fetchUserPosts(username) {
		return new Promise(async (resolve, reject) => {
			try {
				const userData = await this._getUserDetail(username);

				if (userData.error) {
					resolve(userData);
				}

				const data = await this._fetchUserPostsAttempt(userData);

				if (data.error) {
					resolve(data);
				}

				resolve(this._parseCrawlerResponse(data, userData));
			} catch (error) {
				reject(error);
			}
		});
	}

	/**
	 * @private
	 */
	async _fetchUserDetail(username) {
		return new Promise(async (resolve, reject) => {
			try {
				if (!username.startsWith('@')) {
					username = `@${username.replace(/[^a-zA-Z0-9_.]/gi, '')}`;
				}

				const data = await this._fetchUserDetailAttempt(username);

				if (data.error) {
					resolve(data);
				}

				resolve(data);
			} catch (error) {
				reject(error);
			}
		});
	}
}

class Tiktok extends TiktokUtils {
	/**
	 * @private
	 */
	#cache;
	constructor() {
		super();

		/**
		 * @private
		 */
		this.#cache = new Cache();

		this.search = {
			users: async (...usernames) =>
				new Promise(async (resolve, reject) => {
					try {
						usernames = usernames.flat();

						let result = {};

						for (const username of usernames) {
							if (result[username]) {
								continue;
							}

							if (this._isCacheExist(username)) {
								result[username] = this._getFromCache(username);
								continue;
							}

							const response = await this._fetchSearchUserData(username);

							result[username] = response;
							this._setToCache(username, response);
						}

						resolve(result);
					} catch (error) {
						reject(error);
					}
				}),
			lookup: async (...usernames) =>
				new Promise(async (resolve, reject) => {
					try {
						usernames = usernames.flat();

						let result = {};

						for (const username of usernames) {
							if (result[username]) {
								continue;
							}

							if (this._isCacheExist(username)) {
								result[username] = this._getFromCache(username);
								continue;
							}

							const response = await this._fetchUserDetail(username);

							result[username] = response;
							this._setToCache(username, response);
						}

						resolve(result);
					} catch (error) {
						reject(error);
					}
				})
		};

		this.users = {
			posts: async (...usernames) =>
				new Promise(async (resolve, reject) => {
					try {
						usernames = usernames.flat();

						let result = {};

						for (const username of usernames) {
							if (result[username]) {
								continue;
							}

							if (this._isCacheExist(username)) {
								result[username] = this._getFromCache(username);
								continue;
							}

							const response = await this._fetchUserPosts(username);

							result[username] = response;
							this._setToCache(username, response);
						}

						resolve(result);
					} catch (error) {
						reject(error);
					}
				})
		};

		this.download = {
			post: async (...urls) =>
				new Promise(async (resolve, reject) => {
					try {
						urls = urls.flat();

						let result = {};

						for (let url of urls) {
							const isValidURL = checkValid(url);

							if (isValidURL.error) {
								result[url] = { error: isValidURL.message };
								continue;
							}

							url = this._clearUrl(url);

							if (result[url]) {
								continue;
							}

							if (this._isCacheExist(url)) {
								result[url] = this._getFromCache(url);

								continue;
							}

							const response = await this._fetchVideoData(url);

							result[url] = response;
							this._setToCache(url, response);
						}

						resolve(result);
					} catch (error) {
						reject(error);
					}
				})
		};
	}

	/**
	 * @private
	 */
	_isCacheExist(input) {
		return this.#cache.has(input);
	}

	/**
	 * @private
	 */
	_getFromCache(input) {
		return this.#cache.get(input);
	}

	/**
	 * @private
	 */
	_setToCache(input, data) {
		return this.#cache.set(input, data);
	}

	/**
	 * @private
	 */
	_clearUrl(url) {
		url = new URL(url);
		url = url.origin + url.pathname;

		return url;
	}
}

export const tiktok = new Tiktok();
