import axios from 'axios';
import { load } from 'cheerio';
import asyncRetry from 'async-retry';
import { fetch } from 'undici';

import { randomChar, isURL } from '../modules/index.js';
import { COOKIE } from './cookie.js';
import { _api } from './util.js';

const API_BASE_URL = _api;
const regex = (input) => /(?:https:?\/{2})?(?:w{3}|vm|vt|t)?\.?tiktok.com\/([^\s&]+)/gi.test(input);

const checkValid = (url) => {
	if (!isURL(url)) {
		return { error: true, message: 'Please specify a valid url' };
	} else if (!regex(url)) {
		return { error: true, message: 'Please specify a valid TikTok url' };
	}

	return { error: false, message: '' };
};

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
			? (container.urls.externalUrls /* eslint-disable-line */ = {
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
							withoutWatermark: { size: video.play_addr.data_size, url: video.play_addr.url_list[0] }
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
		} = data;

		const musicCoverList =
			data.music[data.music?.cover_hd ? 'cover_hd' : data.music?.cover_large ? 'cover_large' : 'cover_medium'].url_list;

		return {
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
			videoDuration,
			ratio,
			videoThumbnailList,
			musicTitle,
			authorMusic,
			musicList,
			musicDuration,
			musicCoverList
		};
	}

	/**
	 * @private
	 */
	_extractImageMetadata(data) {
		const images = data?.image_post_info?.images;

		return images
			? images.map((v, i) => ({
					url: v.display_image.url_list[1],
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

		const { avatarList, videoThumbnailList, musicList, musicCoverList, noWatermarkList, withWatermarkList } = videoMetadata;

		delete videoMetadata.avatarList;
		delete videoMetadata.videoThumbnailList;
		delete videoMetadata.musicList;
		delete videoMetadata.musicCoverList;
		delete videoMetadata.noWatermarkList;
		delete videoMetadata.withWatermarkList;

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
			result.url.withWatermark = withWatermarkList[0];
			result.url.withNoWatermark = noWatermarkList[0];
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

		// const data =
		// 	Object.keys(arr?.ItemModule || []).length === 0
		// 		? []
		// 		: Object.values(arr.ItemModule).map((v) => ({
		// 				id: v.id,
		// 				uploaded: Number(v.createTime),
		// 				liked: v.stats.diggCount,
		// 				shared: v.stats.shareCount,
		// 				comment: v.stats.commentCount,
		// 				view: v.stats.playCount,
		// 				duration: v.video.duration,
		// 				ratio: v.video.ratio,
		// 				width: v.video.width,
		// 				height: v.video.height,
		// 				url: {
		// 					sourceUrl: _apiBaseVideo(arr.UserPage.uniqueId, v.id),
		// 					music: {
		// 						title: v.music.title,
		// 						author: v.music.authorName,
		// 						duration: v.music.duration,
		// 						album: v.music.album || 'single',
		// 						url: v.music.playUrl,
		// 						[v.music?.coverHd ? 'coverHd' : v.music?.coverLarge ? 'coverLarge' : 'coverMedium']:
		// 							v.music.coverHd || v.music.coverLarge || v.music.coverMedium
		// 					}
		// 				}
		// 		  })); /* eslint-disable-line */

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
			// posts: data
		};
	}
}

class RequestModule extends ResponseParser {
	constructor() {
		super();
	}
	/**
	 * @private
	 */
	_request() {
		return axios.create({
			baseURL: API_BASE_URL
		});
	}

	/**
	 * @private
	 */
	_getRequestConfig() {
		return {
			headers: {
				'User-Agent':
					'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 YaBrowser/23.1.5.750 (beta) Yowser/2.5 Safari/537.36',
				Cookie: COOKIE.TIKTOK_COOKIE.replace(/\n/g, '')
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
			/* eslint-enable */
		};

		return Object.assign(defaultParams, params);
	}

	/**
	 * @private
	 */
	async _awemeRequest(path, { method, body, config = {} }) {
		try {
			if (method === 'GET') {
				const { data } = await this._request().get(path + body, config);

				return data;
			} else {
				const { data } = await this._request().post(path + body, null, config);

				return data;
			}
		} catch (error) {
			if (axios.isAxiosError(error)) {
				return { error: error.message };
			} else {
				throw error;
			}
		}
	}

	/**
	 * @private
	 */
	async _getSigiUser(username) {
		let data = await axios.get(`https://www.tiktok.com/${username}`, {
			...this._getRequestConfig(),
			validateStatus: () => true
		});

		if (data.status === 404) {
			return { error: 'User not found' };
		}

		data = data.data;

		const rawData = load(data)('script[id=__UNIVERSAL_DATA_FOR_REHYDRATION__]').html();

		return JSON.parse(rawData);
	}

	/**
	 * @private
	 */
	async _fetchUserPostsAttempt(userDetails) {
		const body = this._buildApiUrl({
			/* eslint-disable */
			version_name: '20.9.3',
			version_code: '293',
			build_number: '20.9.3',
			manifest_version_code: '293',
			update_version_code: '293',

			user_id: userDetails.__DEFAULT_SCOPE__['webapp.user-detail'].userInfo.user.id,
			count: 30,
			max_cursor: 0,
			min_cursor: 0,
			retry_type: 'no_retry',
			device_id: Array.from({ length: 19 }, () => Math.floor(Math.random() * 10).toString()).join('')
			/* eslint-enable */
		});

		let data;
		const config = this._getRequestConfig();

		config.headers['User-Agent'] =
			'com.ss.android.ugc.trill/100303 (Linux; U; Android 10; en_US; Pixel 4; Build/QQ3A.200805.001; Cronet/58.0.2991.0)';
		try {
			await asyncRetry(
				async (bail) => {
					const bodyFetch = await fetch('https://api.tiktokv.com/aweme/v1/aweme/post/?' + body, {
						method: 'GET',
						...config
					});

					if (bodyFetch.headers.get('content-length') === '0') {
						throw new Error('No data found');
					}

					const dataFinale = await bodyFetch.json();

					console.log(dataFinale);

					if (dataFinale.status_msg) {
						data = {
							error: 'User does not have any post'
						};

						bail(new Error('No data found'));
					}

					console.log(dataFinale);

					if (dataFinale !== '') {
						data = dataFinale;
						return;
					}

					throw new Error('No data found');
				},
				{
					forever: true,
					minTimeout: 0,
					maxTimeout: 0
				}
			);
		} catch (e) {
			console.log(e);
		}

		return data;
	}

	/**
	 * @private
	 */
	async _fetchSearchUserDataAttempt(username) {
		const body = this._buildApiUrl({
			keyword: username,
			cursor: '0',
			count: '30',
			type: '1',
			hot_search: '0' /* eslint-disable-line*/,
			source: 'discover'
		});

		const data = await this._awemeRequest('aweme/v1/discover/search/?', {
			method: 'POST',
			body,
			config: this._getRequestConfig()
		});

		if (data === '') {
			throw new Error('No data found');
		}

		return data;
	}

	/**
	 * @private
	 */
	async _fetchVideoDataAttempt(videoId) {
		const body = this._buildApiUrl({
			aweme_id: videoId, // eslint-disable-line
			version_name: '1.1.9', // eslint-disable-line
			version_code: '2018111632', // eslint-disable-line
			build_number: '1.1.9', // eslint-disable-line
			manifest_version_code: '2018111632', // eslint-disable-line
			update_version_code: '2018111632' // eslint-disable-line
		});

		const data = await this._awemeRequest('aweme/v1/feed/?', {
			method: 'GET',
			body
		});

		return this._mergeMediaResponse(data, videoId);
	}

	/**
	 * @private
	 */
	async _fetchUserDetailAttempt(username) {
		const data = await this._getSigiUser(username);

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
			const req = (await axios.head(url))?.request.res.responseUrl;

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
	async _mergeMediaResponse(dataPosts, videoId) {
		dataPosts = dataPosts.aweme_list.find((v) => v.aweme_id === videoId);

		if (!dataPosts) {
			return { error: 'Download failed. either the access is denied, or other error.' };
		}

		const userData = await this._getSigiUser(`@${dataPosts.author.unique_id}`);

		if (userData.error) {
			return userData;
		}

		dataPosts = this._parseMediaResponse(
			dataPosts,
			dataPosts.image_post_info && dataPosts.image_post_info?.images.length > 0 ? 'images' : undefined
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
	async _fetchSearchUserData(username) {
		return new Promise(async (resolve) => {
			let container = [];

			const timeout = setTimeout(() => {
				resolve({ error: 'User not found. Please try again later.' });
			}, 10000);

			const trySearch = async () => {
				container = [];

				for (let i = 0; i < 200; i++) {
					container.push(this._fetchSearchUserDataAttempt(username));
				}

				try {
					const result = await Promise.any(container);

					clearTimeout(timeout);
					resolve(result);
				} catch (error) {
					return await trySearch();
				}
			};

			return trySearch();
		});
	}

	/**
	 * @private
	 */
	async _fetchUserPosts(username) {
		return new Promise(async (resolve, reject) => {
			try {
				if (!username.startsWith('@')) {
					username = `@${username.replace(/[^a-zA-Z0-9_.]/gi, '')}`;
				}

				const userData = await this._getSigiUser(username);

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
	async _fetchVideoData(url) {
		return new Promise(async (resolve, reject) => {
			try {
				const videoId = await this._getVideoId(url);

				if (videoId.error) {
					resolve(videoId);
				}

				const data = await this._fetchVideoDataAttempt(videoId);

				if (data.error) {
					resolve(data);
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
	constructor() {
		super();

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

							const response = await this._fetchSearchUserData(username);

							result[username] = response;
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

							const response = await this._fetchUserDetail(username);

							result[username] = response;
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

							const response = await this._fetchUserPosts(username);

							result[username] = response;
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

						for (const url of urls) {
							const isValidURL = checkValid(url);

							if (isValidURL.error) {
								result[url] = { error: isValidURL.message };

								continue;
							}

							if (result[url]) {
								continue;
							}

							const response = await this._fetchVideoData(url);

							result[url] = response;
						}

						resolve(result);
					} catch (error) {
						reject(error);
					}
				})
		};
	}
}

export const tiktok = new Tiktok();
