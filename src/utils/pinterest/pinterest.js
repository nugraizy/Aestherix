import { fetch } from 'undici';

const _apiBase = (input) => `https://id.pinterest.com/pin/${input}`;
const _regex = new RegExp(
	'https?://(?:[^/]+.)?pinterest.(?:com|fr|de|ch|jp|cl|ca|it|co.uk|nz|ru|com.au|at|pt|co.kr|es|com.mx|dk|ph|th|com.uy|co|nl|info|kr|ie|vn|com.vn|ec|mx|in|pe|co.at|hu|co.in|co.nz|id|com.ec|com.py|tw|be|uk|com.bo|com.pe)'
);
const _id = /\/?pin\/?([\d]+)/;

const headers = {
	search: {
		'X-Pinterest-PWS-Handler': 'www/search/[scope].js'
	},
	download: {
		'X-Pinterest-PWS-Handler': 'www/pin/[id].js'
	},
	homefeed: {
		'X-Pinterest-PWS-Handler': 'www/index.js',
		Cookie: process.env.PINTEREST_COOKIE
	},
	similars: (id) => ({
		'X-Pinterest-PWS-Handler': 'www/pin/[id].js',
		'X-Pinterest-Source-Url': `/pin/${id}/`
	})
};

/**
 * @typedef {Partial<{error: boolean, message: string, keyword: string}>} PinterestErrorResponse
 * @typedef {Partial<{authorUsername: string, authorFullname: string, follower: number, caption: string, type: 'image' | 'video' | 'gif', url: string, pinSource: string}>} PinterestResponse
 * @typedef {PinterestErrorResponse & {results?: PinterestResponse[]}} PinterestSearchResponse
 * @typedef {PinterestErrorResponse & PinterestResponse} PinterestDownloadResponse
 */

class Pinterest {
	constructor() {
		/**
		 * Search Images
		 * @param {string} query
		 * @returns {Promise<PinterestSearchResponse>}
		 */
		this.search = (query) => this.#_search(query);

		/**
		 * Directly Download Image
		 * @param {string} url
		 * @returns {Promise<PinterestDownloadResponse>}
		 */
		this.download = (url) => this.#_download(url);

		this.getHomefeed = () => this.#_getHomefeed();

		this.getSimilarPin = (url, bookmarks) => this.#_getSimilarPin(url, bookmarks);
	}

	async #_search(query) {
		return new Promise(async (resolve, reject) => {
			try {
				const context = {
					source_url: `/search/pins/q=${query}` /* eslint-disable-line */,
					data: JSON.stringify({
						options: {
							isPrefetch: false,
							query,
							scope: 'pins',
							no_fetch_context_on_resource: false /* eslint-disable-line */,
							context: {}
						}
					}),
					_: Date.now()
				};

				const path = new URLSearchParams(context);

				const response = await fetch(`https://pinterest.com/resource/BaseSearchResource/get/?${path.toString()}`, {
					headers: headers.search
				});

				const { resource_response: resourceResponse } = await response.json();

				let data = resourceResponse.data.results;

				if (!data.length) {
					resolve({ error: true, message: 'Could not find media with the keyword. Try other keyword.', keyword: query });
				}

				resolve({
					keyword: query,
					results: data
						.map((result) => {
							const videos = Object.entries(result.videos?.video_list || []);
							const isVideos = videos?.length > 0;

							let mediaUrl = null;

							if (isVideos) {
								mediaUrl = videos.find(([key]) => result.videos.video_list[key].url.endsWith('.mp4'))?.[1]?.url;

								if (!mediaUrl) {
									return null;
								}
							}

							!mediaUrl && (mediaUrl = result.images.orig.url);

							return {
								authorUsername: result.pinner.username,
								authorFullname: result.pinner.full_name,
								follower: result.pinner.follower_count,
								caption: result.grid_title || 'No caption',
								type: isVideos ? 'video' : mediaUrl.endsWith('.gif') ? 'gif' : 'image',
								url: mediaUrl,
								pinSource: _apiBase(result.id)
							};
						})
						.filter(Boolean)
				});
			} catch (error) {
				reject(error);
			}
		});
	}

	async #_download(url) {
		return new Promise(async (resolve, reject) => {
			try {
				let pinId = this._getPinId(url);

				if (pinId instanceof Promise) {
					pinId = _id.exec((await pinId).url)?.[1];
				} else if (pinId.length) {
					pinId = pinId[1];
				}

				if (!pinId) {
					resolve({ error: true, message: 'Could not find the id on the URL.', keyword: url });
				}

				const context = {
					source_url: `/pin/${pinId}/` /* eslint-disable-line */,
					data: JSON.stringify({
						options: {
							field_set_key: 'detailed' /* eslint-disable-line */,
							ptrf: null,
							fetch_visual_search_objects: true /* eslint-disable-line */,
							id: pinId,
							context: {}
						}
					}),
					/* eslint-disable-next-line */
					module_path: 'Pin(show_pinner=true,+show_board=true,+is_original_pin_in_related_pins_grid=true)',
					_: Date.now()
				};

				const path = new URLSearchParams(context);

				const response = await fetch(`https://www.pinterest.com/resource/PinResource/get/?${path.toString()}`, {
					headers: headers.download
				});

				const { resource_response: resourceResponse } = await response.json();

				if (resourceResponse.status !== 'success') {
					resolve({ error: true, message: 'Could not process pinterest media.', keyword: url });
				}

				const { data } = resourceResponse;

				const videos = Object.entries(data.videos?.video_list || []);
				const isVideos = videos?.length > 0;

				let mediaUrl = null;

				if (isVideos) {
					mediaUrl = videos.find(([key]) => data.videos.video_list[key].url.endsWith('.mp4'))[1].url;
				}

				!mediaUrl && (mediaUrl = data.images.orig.url);

				resolve({
					authorUsername: data.pinner.username,
					authorFullname: data.pinner.full_name,
					follower: data.pinner.follower_count,
					caption: data.grid_title || 'No caption',
					type: isVideos ? 'video' : mediaUrl.endsWith('.gif') ? 'gif' : 'image',
					url: mediaUrl,
					pinSource: _apiBase(data.id)
				});
			} catch (error) {
				reject(error);
			}
		});
	}

	async #_getHomefeed() {
		return new Promise(async (resolve, reject) => {
			try {
				const context = {
					source_url: '/', // eslint-disable-line
					data: JSON.stringify({
						options: {
							field_set_key: 'hf_grid', // eslint-disable-line
							in_nux: false, // eslint-disable-line
							in_news_hub: false, // eslint-disable-line
							static_feed: false, // eslint-disable-line
							isPrefetch: false,
							prependPartner: true,
							prependUserNews: false,
							page_size: 100, // eslint-disable-line
							bookmarks: []
						},
						context: {}
					}),
					_: Date.now()
				};

				const path = new URLSearchParams(context);

				const response = await fetch(`https://id.pinterest.com/resource/UserHomefeedResource/get/?${path.toString()}`, {
					headers: headers.homefeed
				});

				const json = await response.json();

				const result = json.resource_response.data.filter((v) => !v.is_video && v.images).map((v) => v.images.orig);

				resolve(result);
			} catch (error) {
				reject(error);
			}
		});
	}

	async #_getSimilarPin(url, bookmarks) {
		return new Promise(async (resolve, reject) => {
			try {
				let pinId = this._getPinId(url);

				if (pinId instanceof Promise) {
					pinId = _id.exec((await pinId).url)?.[1];
				} else if (pinId.length) {
					pinId = pinId[1];
				}

				if (!pinId) {
					resolve({ error: true, message: 'Could not find the id on the URL.', keyword: url });
				}

				const context = {
					source_url: `/pin/${pinId}/`, // eslint-disable-line
					data: JSON.stringify({
						options: {
							additional_fields: ['pin.gen_ai_topics'], // eslint-disable-line
							pin_id: pinId, // eslint-disable-line
							context_pin_ids: [], // eslint-disable-line
							page_size: 50, // eslint-disable-line
							search_query: '', // eslint-disable-line
							source: 'deep_linking',
							top_level_source: 'deep_linking', // eslint-disable-line
							top_level_source_depth: 1, // eslint-disable-line
							is_pdp: false, // eslint-disable-line
							bookmarks: bookmarks ? [bookmarks] : []
						},
						context: {}
					}),
					_: Date.now()
				};

				const path = new URLSearchParams(context);

				const response = await fetch(`https://id.pinterest.com/resource/RelatedModulesResource/get/?${path.toString()}`, {
					headers: headers.similars(pinId)
				});

				const json = await response.json();

				const result = json.resource_response.data.filter((v) => !v.is_video && v.images).map((v) => v.images.orig);

				resolve({ images: result, bookmarks: json.resource.options.bookmarks[0] });
			} catch (error) {
				reject(error);
			}
		});
	}

	_getPinId(url) {
		if (_regex.test(url)) {
			const id = _id.exec(url);

			return id;
		}

		return fetch(url, {
			method: 'HEAD'
		});
	}
}

export const pinterest = new Pinterest();
