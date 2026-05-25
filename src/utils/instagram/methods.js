import axios from 'axios';
import _ from 'lodash';

import { ResponseParser } from './parsers.js';
import { LOGIN_HEADERS, USER_AGENTS, _apiGraphql, _apiUser, _baseApi, generateDeviceID } from './utils.js';

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
		const { data } = await axios.get(
			this._appendParams(_apiGraphql, {
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
			}),
			{
				method: 'GET',
				headers: {
					...Object.assign(LOGIN_HEADERS, { 'User-Agent': USER_AGENTS.LOGIN_MOBILE }),
					Cookie: cookie,
					'x-csrf-token': /csrftoken=([^;]+)/.exec(cookie)[1]
				}
			}
		);

		return this._parseHighlight(data);
	}

	async _getHighlights(input, cookie) {
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

		if (input.startsWith('@')) {
			input = input.replace('@', '');
		}

		if (this._isInstagramUrl(input)) {
			return await this._handleInstagramUrl(input, cookie, defaultPayload);
		}

		const user = await this._getProfile(input, cookie);
		const { data } = await axios.get(
			this._appendParams(_apiGraphql, {
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
		const container = { items: data.data.reels_media[0].items.find((v) => v.id === mediaId) };
		const highlights = this._parseHighlight(data);
		const highlightsData = highlights.find((v) => v.mediaId === container.items.id);

		return {
			user,
			highlights: [{ thumbnail: container.items.display_url, dataHighlight: [highlightsData] }]
		};
	}

	_extractHighlightId(input) {
		const url = new URL(input);
		const storyMediaId = url.searchParams.get('story_media_id');

		if (storyMediaId) {
			return { mediaId: storyMediaId.split('_')[0], key: 'highlight_reel_ids' };
		}

		return { key: 'reel_ids', mediaId: url.pathname.split('/')[3] };
	}

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
