/* eslint-disable camelcase */
import axios from 'axios';
import { v4 } from 'uuid';
import fs from 'fs-extra';
import { parse } from 'dotenv';
import _ from 'lodash';

const _baseApi = 'https://i.instagram.com';
const _baseUrl = 'https://www.instagram.com';
const _apiUser = (input) => `${_baseApi}/api/v1/users/web_profile_info/?username=${input}`;
const _apiGraphql = `${_baseUrl}/graphql/query/?`;

const USER_AGENTS = {
	LOGIN_AGENT: 'Instagram 134.0.0.26.121 Android',
	LOGIN_MOBILE:
		'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
	NON_LOGIN_AGENT:
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
};
const LOGIN_HEADERS = {
	'User-Agent': USER_AGENTS.LOGIN_AGENT,
	'Content-Type': 'application/x-www-form-urlencoded',
	'Accept-Language': 'en-US,en;q=0.9',
	authority: 'www.instagram.com',
	'content-type': 'application/x-www-form-urlencoded',
	origin: _baseUrl,
	'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
	'sec-fetch-site': 'same-origin',
	'sec-fetch-mode': 'cors',
	'sec-fetch-dest': 'empty',
	'x-ig-app-id': '936619743392459',
	'x-ig-www-claim': 'hmac.AR2uidim8es5kYgDiNxY0UG_ZhffFFSt8TGCV5eA1VYYsMNx',
	'x-requested-with': 'XMLHttpRequest'
};

const generateDeviceID = () => `android-${(Math.random() * 1e24).toString(36)}`;

class ResponseParser {
	/**
	 * @private
	 */
	_parsePost({ data: { xdt_shortcode_media: response } }) {
		let { username, full_name: fullName, is_private: isPrivate, is_verified: isVerified } = response.owner;
		let {
			edge_media_preview_like: { count: likeCount },
			taken_at_timestamp: takenAt,
			edge_media_preview_comment: { count: commentCount },
			__typename: mediaType
		} = response;

		const captions = response.edge_media_to_caption?.edges?.[0]?.node?.text ?? 'No captions';
		const type = mediaType === 'XDTGraphSidecar' ? 'slide' : mediaType === 'XDTGraphVideo' ? 'video' : 'image';

		let result = { username, fullName, isPrivate, isVerified, likeCount, takenAt, commentCount, captions, post: [] };

		if (type === 'slide') {
			let { edges: posts } = response.edge_sidecar_to_children;

			for (const { node: post } of posts) {
				const isVideo = post.__typename === 'XDTGraphVideo';

				result.post.push({
					isVideo: isVideo,
					url: isVideo ? post.video_url : post.display_resources[post.display_resources.length - 1].src,
					urlPost: `https://instagram/p/${post.shortcode}`
				});
			}
		} else {
			const isVideo = type === 'video';

			result.post.push({
				isVideo: isVideo,
				...(isVideo && { duration: response.video_duration }),
				url: isVideo ? response.video_url : response.display_resources[response.display_resources.length - 1].src,
				urlPost: `https://instagram/p/${response.shortcode}`
			});
		}

		return result;
	}

	/**
	 * @private
	 */
	_parseProfile(response) {
		return {
			id: response.id,
			biography: response.biography,
			followers: response.edge_followed_by.count,
			following: response.edge_follow.count,
			fullName: response.full_name === '' ? 'No Fullname' : response.full_name,
			highlightCount: response.highlight_reel_count,
			isBusinessAccount: response.is_business_account,
			isRecentUser: response.is_joined_recently,
			accountCategory: response.business_category_name,
			linkedFacebookPage: response.connected_fb_page,
			isPrivate: response.is_private,
			isVerified: response.is_verified,
			profilePic: response.profile_pic_url,
			profilePicHD: response.profile_pic_url_hd,
			username: response.username,
			postsCount: response.edge_owner_to_timeline_media.count,
			posts:
				response.edge_owner_to_timeline_media.edges.map((edge) => {
					const hasCaption = edge.node.edge_media_to_caption.edges[0];

					return {
						id: edge.node.id,
						shortCode: edge.node.shortcode,
						url: `https://www.instagram.com/p/${edge.node.shortcode}/`,
						dimensions: edge.node.dimensions,
						isVideo: edge.node.is_video,
						mediaUrl: edge.node.is_video ? edge.node.video_url : edge.node.display_url,
						caption: hasCaption ? hasCaption.node.text : '',
						commentsCount: edge.node.edge_media_to_comment.count,
						commentsDisabled: edge.node.comments_disabled,
						timestamp: edge.node.taken_at_timestamp,
						likesCount: edge.node.edge_liked_by.count,
						location: edge.node.location,
						children: edge.node.edge_sidecar_to_children
							? edge.node.edge_sidecar_to_children.edges.map((edge) => ({
									id: edge.node.id,
									shortCode: edge.node.shortcode,
									dimensions: edge.node.dimensions,
									isVideo: edge.node.is_video,
									mediaUrl: edge.node.is_video ? edge.node.video_url : edge.node.display_url
							  })) /* eslint-disable-line */
							: []
					};
				}) || []
		};
	}

	/**
	 * @private
	 */
	_parseProfiles(response) {
		return response.users.map((v) => ({
			id: v.pk,
			fullName: v.full_name === '' ? 'No Fullname' : v.full_name,
			username: v.username,
			isVerified: v.is_verified,
			isPrivate: v.is_private,
			profilePic: v.profile_pic_url
		}));
	}

	/**
	 * @private
	 */
	_parseCode(input) {
		const parse = input.match(/([-_0-9a-zA-Z]{11})/);

		return parse === null ? false : parse[0];
	}

	/**
	 * @private
	 */
	_parseItemMediaType(data) {
		const isVideo = data.media_type === 2;

		if (isVideo) {
			return { isVideo, duration: data.video_duration, url: data.video_versions[0].url };
		}

		return { isVideo, id: data.pk, url: data.image_versions2.candidates[0].url };
	}

	/**
	 * @private
	 */
	_parseStory({ user, data, isInputURL, STORY_ID }) {
		delete user.posts;
		data = data.reel;
		const result = { ...user, totalStories: data.media_count, stories: [] };

		if (!result.totalStories && !user.isPrivate) {
			return {
				error: `User ${user.username} doesn't have any stories available.`
			};
		}

		if (
			!result.totalStories &&
			!data.user?.friendship_status?.following &&
			!data.user?.friendship_status?.followed_by &&
			user.isPrivate
		) {
			return {
				error: `User ${user.username} is private. And the bot is not following the user.`
			};
		}

		if (isInputURL) {
			const item = data.items.find((item) => item.pk === STORY_ID);

			if (!item) {
				return {
					error: `Story with the id [${STORY_ID}] not found from \`${user.username}\`.`
				};
			}

			result.stories.push(this._parseItemMediaType(item));
			return result;
		}

		for (const item of data.items) {
			result.stories.push(this._parseItemMediaType(item));
		}

		return result;
	}

	/**
	 * @private
	 */
	_parseHighlight(data) {
		return data.data.reels_media[0].items.map((edge) => ({
			parentId: data.data.reels_media[0].id,
			mediaId: edge.id,
			mimetype: edge.is_video ? 'video/mp4' : 'image/jpeg',
			takenAt: edge.taken_at_timestamp,
			type: edge.is_video ? 'video' : 'image',
			url: edge.is_video ? edge.video_resources[0].src : edge.display_url,
			dimensions: edge.dimensions
		}));
	}

	/**
	 * @private
	 */
	_parseHashtag(data) {
		return {
			totalPostFormatted: data.formatted_media_count,
			totalPostRaw: data.media_count,
			thumbnail: data.profile_pic_url,
			posts: data.top.sections
				.map(({ layout_content: layoutContent }) => {
					return layoutContent.medias.map(
						({
							media: {
								taken_at: published,
								code,
								comment_count: commentCount,
								like_count: likeCount,
								media_type: mediaType,
								user: { username, full_name: fullName, profile_pic_url: avatarUrl, is_private: isPrivate },
								caption: { text: caption } = { text: 'No captions' }
							},
							media: medias
						}) => {
							mediaType = mediaType === 8 ? 'slide' : mediaType === 2 ? 'video' : 'image';

							let media;

							if (mediaType === 'slide') {
								media = medias.carousel_media.map((posts) => {
									if (posts.media_type === 1) {
										return { isVideo: false, url: posts.image_versions2.candidates[0].url };
									}

									return { isVideo: true, url: posts.video_versions[0].url, duration: posts.video_duration };
								});
							} else if (mediaType === 'video') {
								media = [{ isVideo: true, url: medias.video_versions[0].url, duration: medias.video_duration }];
							} else {
								media = [{ isVideo: false, url: medias.image_versions2.candidates[0].url }];
							}

							return {
								username,
								fullName,
								avatarUrl,
								isPrivate,
								caption,
								published,
								code,
								source: `${_baseUrl}/p/${code}`,
								commentCount,
								likeCount,
								media,
								mediaType
							};
						}
					);
				})
				.flat()
		};
	}

	/**
	 * @private
	 */
	_isUrl(input) {
		return /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi.test(input);
	}

	/**
	 * @private
	 */
	_isInstagramUrl(input) {
		return /(https?:\/\/(?:www\.)?instagram\.com\/(p|reel|tv|s|stories)\/([^/?#&]+)).*/.test(input);
	}

	/**
	 * @private
	 */
	_appendParams(url, params) {
		const urls = new URLSearchParams(params);

		return url + urls.toString();
	}
}

class InstagramMethods extends ResponseParser {
	/**
	 * @private
	 */
	#_apiLoginResponse = null;

	/**
	 * @private
	 */
	_request() {
		return axios.create({
			baseURL: _baseApi,
			headers: LOGIN_HEADERS
		});
	}

	/**
	 * @private
	 */
	async _login(username, password, { uuid, deviceId }) {
		const cookie = await this._getCookie();

		const response = await this._requestApi('POST', '/api/v1/accounts/login/', {
			body: {
				username: username,
				enc_password: password,
				guid: uuid,
				adid: generateDeviceID(),
				device_id: deviceId,
				login_attempt_count: 0,
				phone_id: '6289522534401',
				_csrftoken: /csrftoken=([^;]+)/.exec(cookie)[1],
				google_tokens: '[]',
				country_codes: '[{"country_code":"62","source":["default"]}]'
			},
			config: {
				headers: {
					'x-csrftoken': /csrftoken=([^;]+)/.exec(cookie)[1]
				}
			}
		});

		this.#_apiLoginResponse = response;

		return this;
	}

	/**
	 * @private
	 */
	async _getPost(url, cookie) {
		const errors = {
			noUrl: 'Argument "url" must be specified',
			notValidUrl: 'Argument "url" must be a valid URL',
			notInstagramUrl: 'Argument "url" must be a valid Instagram URL'
		};

		if (!url) {
			return { error: errors.noUrl };
		}

		if (!this._isUrl(url)) {
			return { error: errors.notValidUrl };
		}

		if (!this._isInstagramUrl(url)) {
			return { error: errors.notInstagramUrl };
		}

		const code = this._parseCode(url);

		const { data } = await axios.get(
			this._appendParams(_apiGraphql, {
				doc_id: '8845758582119845',
				variables: JSON.stringify({
					shortcode: code,
					child_comment_count: 20,
					fetch_comment_count: 100,
					parent_comment_count: 24,
					has_threaded_comments: true
				})
			}),
			{
				headers: {
					'x-ig-app-id': '936619743392459',
					'user-agent':
						'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
					cookie
				}
			}
		);

		return this._parsePost(data);
	}

	/**
	 * @private
	 */
	async _getProfile(username, cookie) {
		if (username.startsWith('@')) {
			username = username.replace('@', '');
		}

		const {
			data: {
				data: { user }
			}
		} = await axios.get(_apiUser(username), {
			headers: {
				'User-Agent': USER_AGENTS.NON_LOGIN_AGENT,
				Cookie: cookie,
				'x-ig-app-id': '936619743392459'
			}
		});

		if (!user) {
			return { error: `User ${username} not found.` };
		}

		return this._parseProfile(user);
	}

	/**
	 * @private
	 */
	async _searchProfile(username, cookie) {
		if (username.startsWith('@')) {
			username = username.replace('@', '');
		}

		const timezone = String(new Date().getTimezoneOffset() * -60);

		const { data } = await this._requestApi(
			'GET',
			`/api/v1/users/search/?timezone_offset=${timezone}&q=${username}&count=20`,
			{
				config: {
					headers: {
						...LOGIN_HEADERS,
						Cookie: cookie,
						'X-CSRFToken': /csrftoken=([^;]+)/.exec(cookie)[1]
					}
				}
			}
		);

		return this._parseProfiles(data);
	}

	/**
	 * @private
	 */
	async _fetchHighlight(id, cookie) {
		const { data } = await axios.get(
			this._appendParams(_apiGraphql, {
				/* eslint-disable */
				query_hash: '0a85e6ea60a4c99edc58ab2f3d17cfdf',
				variables: JSON.stringify({
					reel_ids: [],
					tag_names: [],
					location_ids: [],
					highlight_reel_ids: [id],
					precomposed_overlay: false,
					show_story_viewer_list: true,
					story_viewer_fetch_count: 50,
					story_viewer_cursor: '',
					stories_video_dash_manifest: false
				})
				/* eslint-enable */
			}),
			{
				method: 'GET',
				headers: {
					...Object.assign(LOGIN_HEADERS, {
						'User-Agent': USER_AGENTS.LOGIN_MOBILE
					}),
					Cookie: cookie,
					'x-csrf-token': /csrftoken=([^;]+)/.exec(cookie)[1]
				}
			}
		);

		return this._parseHighlight(data);
	}

	/**
	 * @private
	 */
	async _getHighlights(input, cookie) {
		/* eslint-disable */
		const defaultPayload = {
			query_hash: '0a85e6ea60a4c99edc58ab2f3d17cfdf',
			variables: {
				reel_ids: [],
				tag_names: [],
				location_ids: [],
				highlight_reel_ids: [],
				precomposed_overlay: false,
				show_story_viewer_list: true,
				story_viewer_fetch_count: 50,
				story_viewer_cursor: '',
				stories_video_dash_manifest: false
			}
		};
		/* eslint-enable */

		if (input.startsWith('@')) {
			input = input.replace('@', '');
		}

		if (this._isInstagramUrl(input)) {
			return await this._handleInstagramUrl(input, cookie, defaultPayload);
		}

		const user = await this._getProfile(input, cookie);
		const { data } = await axios.get(
			this._appendParams(_apiGraphql, {
				/* eslint-disable */
				query_hash: 'c9100bf9110dd6361671f113dd02e7d6',
				variables: JSON.stringify({
					user_id: user.id,
					include_chaining: false,
					include_reel: true,
					include_suggested_users: false,
					include_logged_out_extras: false,
					include_highlight_reels: true,
					include_live_status: false
				})
				/* eslint-enable */
			}),
			{
				headers: {
					'User-Agent':
						'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
					Cookie: cookie,
					'X-CSRFToken': /csrftoken=([^;]+)/.exec(cookie)[1],
					'x-ig-app-id': '936619743392459'
				}
			}
		);

		return await this._processHighlightData(data, user, cookie);
	}

	/**
	 * @private
	 */
	async _handleInstagramUrl(input, cookie, payload) {
		const { data: html } = await axios.get(input);
		const initialHighlightData = /"id":"(\d+)"/.exec(html);

		if (!initialHighlightData) {
			throw new Error('No highlights present');
		}

		const { key, mediaId } = this._extractHighlightId(input);

		payload.variables[key].push(initialHighlightData[1]);
		payload.variables = JSON.stringify(payload.variables);

		const { data } = await axios.get(this._appendParams(_apiGraphql, payload), {
			method: 'GET',
			headers: {
				'User-Agent': USER_AGENTS.LOGIN_MOBILE,
				Cookie: cookie,
				'x-csrf-token': /csrftoken=([^;]+)/.exec(cookie)[1]
			}
		});

		const user = await this._getProfile(data.data.reels_media[0].owner.username, cookie);
		const container = {
			items: data.data.reels_media[0].items.find((v) => v.id === mediaId)
		};

		const highlights = this._parseHighlight(data);
		const highlightsData = highlights.find((v) => v.mediaId === container.items.id);

		return {
			user,
			highlights: [
				{
					thumbnail: container.items.display_url,
					dataHighlight: [highlightsData]
				}
			]
		};
	}

	/**
	 * @private
	 */
	_extractHighlightId(input) {
		const url = new URL(input);
		const storyMediaId = url.searchParams.get('story_media_id');

		if (storyMediaId) {
			return { mediaId: storyMediaId.split('_')[0], key: 'highlight_reel_ids' };
		}

		return { key: 'reel_ids', mediaId: url.pathname.split('/')[3] };
	}

	/**
	 * @private
	 */
	async _processHighlightData(data, user, cookie) {
		const container = {
			items: _.chunk(
				data.data.user.edge_highlight_reels.edges.map((edge) => ({
					title: edge.node.title,
					highlightId: edge.node.id,
					cover: edge.node.cover_media.thumbnail_src
				})),
				7
			)
		};

		let highlights = [];

		for (const highlight of container.items) {
			const fetchedHighlights = await Promise.all(highlight.map((v) => this._fetchHighlight(v.highlightId, cookie)));

			highlights.push(...fetchedHighlights.flat());
		}

		highlights = highlights.flat();
		const flatItems = container.items.flat();

		return {
			user,
			highlights: flatItems.map((v) => ({
				title: v.title,
				thumbnail: v.cover,
				dataHighlight: highlights.filter((w) => w.parentId === v.highlightId)
			}))
		};
	}

	/**
	 * @private
	 */
	async _getStory(input, cookie) {
		if (input.startsWith('@')) {
			input = input.replace('@', '');
		}

		if (this._isUrl(input) && !this._isInstagramUrl(input)) {
			return { error: 'Argument "url" must be a valid Instagram url' };
		}

		const isInputURL = this._isUrl(input) && this._isInstagramUrl(input);

		if (isInputURL) {
			input = new URL(input);
			input = input.pathname.split('/');
		}

		const STORY_ID = isInputURL ? input[3] : input;
		const USERNAME = isInputURL ? input[2] : input;
		const user = await this._getProfile(USERNAME, cookie);
		const { data } = await this._requestApi('GET', `/api/v1/feed/user/${user.id}/story/`, {
			config: {
				headers: {
					...Object.assign(LOGIN_HEADERS, {
						'User-Agent': USER_AGENTS.LOGIN_MOBILE
					}),
					Cookie: cookie,
					'X-CSRFtoken': /csrftoken=([^;]+)/.exec(cookie)[1],
					'X-ASBD-ID': '129477'
				}
			}
		});

		return this._parseStory({
			user,
			data,
			isInputURL,
			STORY_ID
		});
	}

	/**
	 * @private
	 */
	async _getHashtag(input, cookie) {
		if (input.includes('#')) {
			input = input.replace('#', '');
		}

		const {
			data: { data }
		} = await this._requestApi('GET', `/api/v1/tags/web_info/?tag_name=${input}`, {
			config: {
				headers: {
					...Object.assign(LOGIN_HEADERS, {
						'User-Agent': USER_AGENTS.LOGIN_MOBILE
					}),
					Cookie: cookie,
					'x-csrf-token': /csrftoken=([^;]+)/.exec(cookie)[1]
				}
			}
		});

		return this._parseHashtag(data);
	}

	/**
	 * @private
	 */
	_parseCookie() {
		const {
			headers: { 'set-cookie': cookie }
		} = this.#_apiLoginResponse;

		return cookie.map((x) => x.match(/(.*?=.*?);/)?.[1])?.join('; ');
	}

	/**
	 * @private
	 */
	async _getCookie() {
		const response = await this._requestApi('GET', '/api/v1/si/fetch_headers/?challenge_type=signup');

		return response.headers['set-cookie'].map((x) => x.match(/(.*?=.*?);/)?.[1])?.join('; ');
	}

	/**
	 * @private
	 */
	async _requestApi(method, path, { body = null, config = null } = {}) {
		try {
			if (method === 'GET') {
				return await this._request().get(path, config);
			}

			if (method === 'POST') {
				return await this._request().post(path, body, config);
			}
		} catch (error) {
			if (axios.isAxiosError(error)) {
				if (error?.response?.data?.two_factor_required) {
					throw new Error('Login failed, two factor auth required. Please disable 2FA.');
				}

				switch (error?.response?.data?.error_type) {
					case 'bad_password': {
						throw error?.response?.data;
					}
					case 'invalid_user': {
						throw error?.response?.data;
					}
					default: {
						throw error;
					}
				}
			} else {
				throw error;
			}
		}
	}
}

/**
 * @type {import('instagram').InstagramAPI}
 */
export class InstagramApi extends InstagramMethods {
	/**
	 * @private
	 */
	#_username;

	/**
	 * @private
	 */
	#_password;

	/**
	 * @private
	 */
	#_encPassword;

	/**
	 * @private
	 */
	#_cookie;

	#_uuid;

	#_deviceId;
	constructor(username, password, { uuid = v4(), deviceId = generateDeviceID(), cookie = null } = {}) {
		super();

		/**
		 * @private
		 */
		this.#_username = username;

		/**
		 * @private
		 */
		this.#_password = password;

		/**
		 * @private
		 */
		this.#_encPassword = this._encryptPassword();

		/**
		 * @private
		 */
		this.#_cookie = cookie;

		/**
		 * @private
		 */
		this.#_uuid = uuid;

		/**
		 * @private
		 */
		this.#_deviceId = deviceId;

		this.account = {
			login: () =>
				new Promise(async (resolve, reject) => {
					try {
						await this._login(this.#_username, this.#_encPassword, {
							uuid: this.#_uuid,
							deviceId: this.#_deviceId
						});

						delete this.account.login;

						resolve(this);
					} catch (error) {
						reject(error);
					}
				}),

			parseCookie: () => this._parseCookie(),

			writeLoginInfo: () => {
				const loginInfo = `USERNAME="${this.#_username}"\nPASSWORD="${
					this.#_password
				}"\nCOOKIE="${this.account.parseCookie()}"\nUUID="${this.#_uuid}"\nDEVICE_ID="${this.#_deviceId}"`;

				fs.writeFileSync('./.instagram.env', loginInfo);
			}
		};

		this.download = {
			post: (...urls) =>
				new Promise(async (resolve, reject) => {
					try {
						if (!this.#_cookie) {
							throw new Error('Cookie not found. Please login first.');
						}

						urls = urls.flat();

						let result = {};

						for (const url of urls) {
							if (result[url]) {
								continue;
							}

							const response = await this._getPost(url, this.#_cookie);

							result[url] = response;
						}

						resolve(result);
					} catch (error) {
						reject(error);
					}
				})
		};

		this.search = {
			user: (...usernames) =>
				new Promise(async (resolve, reject) => {
					try {
						if (!this.#_cookie) {
							throw new Error('Cookie not found. Please login first.');
						}

						usernames = usernames.flat();

						let result = {};

						for (const username of usernames) {
							if (result[username]) {
								continue;
							}

							const response = await this._getProfile(username, this.#_cookie);

							result[username] = response;
						}

						resolve(result);
					} catch (error) {
						reject(error);
					}
				}),

			users: (...usernames) =>
				new Promise(async (resolve, reject) => {
					try {
						if (!this.#_cookie) {
							throw new Error('Cookie not found. Please login first.');
						}

						usernames = usernames.flat();

						let result = {};

						for (const username of usernames) {
							if (result[username]) {
								continue;
							}

							const response = await this._searchProfile(username, this.#_cookie);

							result[username] = response;
						}

						resolve(result);
					} catch (error) {
						reject(error);
					}
				}),

			highlight: (...usernames) =>
				new Promise(async (resolve, reject) => {
					try {
						if (!this.#_cookie) {
							throw new Error('Cookie not found. Please login first.');
						}

						usernames = usernames.flat();

						let result = {};

						for (const username of usernames) {
							if (result[username]) {
								continue;
							}

							const response = await this._getHighlights(username, this.#_cookie);

							result[username] = response;
						}

						resolve(result);
					} catch (error) {
						reject(error);
					}
				}),

			story: (...usernames) =>
				new Promise(async (resolve, reject) => {
					try {
						if (!this.#_cookie) {
							throw new Error('Cookie not found. Please login first.');
						}

						usernames = usernames.flat();

						let result = {};

						for (const username of usernames) {
							if (result[username]) {
								continue;
							}

							const response = await this._getStory(username, this.#_cookie);

							result[username] = response;
						}

						resolve(result);
					} catch (error) {
						reject(error);
					}
				}),

			hashtag: (...hashtags) =>
				new Promise(async (resolve, reject) => {
					try {
						if (!this.#_cookie) {
							throw new Error('Cookie not found. Please login first.');
						}

						hashtags = hashtags.flat();

						let result = {};

						for (const hashtag of hashtags) {
							if (result[hashtag]) {
								continue;
							}

							const response = await this._getHashtag(hashtag, this.#_cookie);

							result[hashtag] = response;
						}

						resolve(result);
					} catch (error) {
						reject(error);
					}
				})
		};
	}

	static init() {
		let err;

		if (!fs.existsSync('./.instagram.env')) {
			err = new Error(
				'`.instagram.env` file not found. Use the constructor to login and create file. ex: `new InstagramApi(username, password).login()`'
			);
			console.log(err);
			process.exit(0);
		}

		const loginInfo = parse(fs.readFileSync('./.instagram.env', 'utf-8'));
		let { USERNAME, PASSWORD, UUID, DEVICE_ID, COOKIE } = loginInfo;

		if (!USERNAME) {
			err = new Error('`USERNAME` not found in `.instagram.env`');
			console.log(err);
			process.exit(0);
		}

		if (!PASSWORD) {
			err = new Error('`PASSWORD` not found in `.instagram.env`');
			console.log(err);
			process.exit(0);
		}

		if (!COOKIE) {
			COOKIE = !!COOKIE;
		}

		if (!UUID) {
			UUID = !!UUID;
		}

		if (!DEVICE_ID) {
			DEVICE_ID = !!DEVICE_ID;
		}

		return new InstagramApi(USERNAME, PASSWORD, { uuid: UUID, deviceId: DEVICE_ID, cookie: COOKIE });
	}

	/**
	 * @private
	 */
	_encryptPassword() {
		return `#PWD_INSTAGRAM_BROWSER:0:${Date.now()}:${this.#_password}`;
	}
}

export const instagram = InstagramApi.init();
