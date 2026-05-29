import axios from 'axios';
import { ResponseParser } from './parsers.js';
import { LOGIN_HEADERS, USER_AGENTS, _apiGraphql, _baseApi, generateDeviceID } from './utils.js';

export class InstagramMethods extends ResponseParser {
	#_apiLoginResponse = null;

	_request() {
		return axios.create({
			baseURL: _baseApi,
			headers: LOGIN_HEADERS
		});
	}

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

	async _getProfile(username, cookie) {
		if (username.startsWith('@')) {
			username = username.replace('@', '');
		}

		const { data } = await axios.get(
			this._appendParams(_apiGraphql, {
				doc_id: '26347858941511777',
				variables: JSON.stringify({ hasQuery: true, query: username })
			}),
			{
				headers: {
					'User-Agent': USER_AGENTS.LOGIN_MOBILE,
					Cookie: cookie,
					'x-ig-app-id': '936619743392459'
				}
			}
		);

		const users = data?.data?.xdt_api__v1__fbsearch__non_profiled_serp?.users || [];
		const user = users.find((u) => u.username?.toLowerCase() === username.toLowerCase());

		if (!user) {
			return { error: `User ${username} not found.` };
		}

		return {
			id: String(user.pk || user.id),
			username: user.username,
			fullName: user.full_name || '',
			full_name: user.full_name || '',
			isPrivate: user.is_private || false,
			is_private: user.is_private || false,
			isVerified: user.is_verified || false,
			is_verified: user.is_verified || false,
			profilePic: user.profile_pic_url || '',
			profile_pic_url: user.profile_pic_url || '',
			follower_count: user.follower_count || 0,
			following_count: user.following_count || 0
		};
	}

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

	async _fetchHighlight(id, cookie) {
		const { data } = await this._requestApi('GET', `/api/v1/feed/reels_media/?reel_ids=highlight:${id}`, {
			config: {
				headers: {
					...Object.assign(LOGIN_HEADERS, { 'User-Agent': USER_AGENTS.LOGIN_MOBILE }),
					Cookie: cookie,
					'x-csrf-token': /csrftoken=([^;]+)/.exec(cookie)[1]
				}
			}
		});

		return this._parseHighlight(data);
	}

	async _getHighlights(input, cookie) {
		if (input.startsWith('@')) {
			input = input.replace('@', '');
		}

		if (this._isInstagramUrl(input)) {
			const user = await this._getProfile(input.split('/')[3] || input, cookie);

			return { user, highlights: [] };
		}

		const user = await this._getProfile(input, cookie);

		const { data } = await this._requestApi('GET', `/api/v1/highlights/${user.id}/highlights_tray/`, {
			config: {
				headers: {
					...Object.assign(LOGIN_HEADERS, { 'User-Agent': USER_AGENTS.LOGIN_MOBILE }),
					Cookie: cookie,
					'x-csrf-token': /csrftoken=([^;]+)/.exec(cookie)[1]
				}
			}
		});

		const tray = data?.tray || [];

		if (!tray.length) {
			return { user, highlights: [] };
		}

		const highlightIds = tray.map((h) => `${h.id}`);

		const { data: reelsData } = await this._requestApi(
			'GET',
			`/api/v1/feed/reels_media/?${highlightIds.map((id) => `reel_ids=${id}`).join('&')}`,
			{
				config: {
					headers: {
						...Object.assign(LOGIN_HEADERS, { 'User-Agent': USER_AGENTS.LOGIN_MOBILE }),
						Cookie: cookie,
						'x-csrf-token': /csrftoken=([^;]+)/.exec(cookie)[1]
					}
				}
			}
		);

		const reels = reelsData?.reels || {};

		return {
			user,
			highlights: tray.map((h) => {
				const reel = reels[`${h.id}`];
				const items = (reel?.items || []).map((item) => {
					const isVideo = item.media_type === 2;

					return {
						parentId: `${h.id}`,
						mediaId: item.pk || item.id,
						mimetype: isVideo ? 'video/mp4' : 'image/jpeg',
						takenAt: item.taken_at,
						type: isVideo ? 'video' : 'image',
						url: isVideo ? item.video_versions?.[0]?.url : item.image_versions2?.candidates?.[0]?.url,
						dimensions: { width: item.original_width, height: item.original_height }
					};
				});

				return {
					title: h.title,
					thumbnail: h.cover_media?.cropped_image_version?.url || '',
					dataHighlight: items
				};
			})
		};
	}

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

		const STORY_ID = isInputURL ? (input[3] === '' ? null : input[3]) : null;
		const USERNAME = isInputURL ? input[2] : input;

		const user = await this._getProfile(USERNAME, cookie);
		const { data } = await this._requestApi('GET', `/api/v1/feed/user/${user.id}/story/`, {
			config: {
				headers: {
					...Object.assign(LOGIN_HEADERS, { 'User-Agent': USER_AGENTS.LOGIN_MOBILE }),
					Cookie: cookie,
					'X-CSRFtoken': /csrftoken=([^;]+)/.exec(cookie)[1],
					'X-ASBD-ID': '129477'
				}
			}
		});

		return this._parseStory({ user, data, isInputURL, STORY_ID });
	}

	async _getHashtag(input, cookie) {
		if (input.includes('#')) {
			input = input.replace('#', '');
		}

		const {
			data: { data }
		} = await this._requestApi('GET', `/api/v1/tags/web_info/?tag_name=${input}`, {
			config: {
				headers: {
					...Object.assign(LOGIN_HEADERS, { 'User-Agent': USER_AGENTS.LOGIN_MOBILE }),
					Cookie: cookie,
					'x-csrf-token': /csrftoken=([^;]+)/.exec(cookie)[1]
				}
			}
		});

		return this._parseHashtag(data);
	}

	_parseCookie() {
		const {
			headers: { 'set-cookie': cookie }
		} = this.#_apiLoginResponse;

		return cookie.map((x) => x.match(/(.*?=.*?);/)?.[1])?.join('; ');
	}

	async _getCookie() {
		const response = await this._requestApi('GET', '/api/v1/si/fetch_headers/?challenge_type=signup');

		return response.headers['set-cookie'].map((x) => x.match(/(.*?=.*?);/)?.[1])?.join('; ');
	}

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
