import { fetch } from 'undici';

const _apiBase = (input) => `https://id.pinterest.com/pin/${input}`;
const _regex = new RegExp(
	'https?://(?:[^/]+.)?pinterest.(?:com|fr|de|ch|jp|cl|ca|it|co.uk|nz|ru|com.au|at|pt|co.kr|es|com.mx|dk|ph|th|com.uy|co|nl|info|kr|ie|vn|com.vn|ec|mx|in|pe|co.at|hu|co.in|co.nz|id|com.ec|com.py|tw|be|uk|com.bo|com.pe)'
);
const _id = /\/?pin\/?([\d]+)/;

const getSafeHttpUrl = (value) => {
	const normalized = String(value || '').trim();

	if (!/^https?:\/\//i.test(normalized)) {
		return '';
	}

	return normalized;
};

const getImageVariantsFromMap = (images) => {
	if (!images || typeof images !== 'object') {
		return [];
	}

	const variants = [];

	for (const [key, value] of Object.entries(images)) {
		const url = getSafeHttpUrl(value?.url || value);

		if (!url) {
			continue;
		}

		const width = Number(value?.width || String(key).match(/(\d+)x/i)?.[1] || 0);
		const height = Number(value?.height || String(key).match(/x(\d+)/i)?.[1] || 0);

		variants.push({
			url,
			width: Number.isFinite(width) ? width : 0,
			height: Number.isFinite(height) ? height : 0
		});
	}

	return variants;
};

const resolvePinImageUrls = (payload) => {
	const variants = getImageVariantsFromMap(payload?.images);
	const sortedByArea = [...variants].sort((a, b) => b.width * b.height - a.width * a.height);

	const originalUrl =
		getSafeHttpUrl(payload?.original?.url) ||
		getSafeHttpUrl(payload?.url) ||
		getSafeHttpUrl(payload?.original) ||
		getSafeHttpUrl(payload?.image_url) ||
		getSafeHttpUrl(payload?.image) ||
		getSafeHttpUrl(payload?.images?.orig?.url) ||
		sortedByArea[0]?.url ||
		'';

	const previewUrl =
		getSafeHttpUrl(payload?.thumbnail?.url) ||
		getSafeHttpUrl(payload?.previewUrl) ||
		getSafeHttpUrl(payload?.thumbnail) ||
		getSafeHttpUrl(payload?.images?.['474x']?.url) ||
		getSafeHttpUrl(payload?.images?.['236x']?.url) ||
		sortedByArea.at(-1)?.url ||
		originalUrl;

	return {
		originalUrl,
		previewUrl: previewUrl || originalUrl
	};
};

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
					source_url: `/search/pins/q=${query}`,
					data: JSON.stringify({
						options: {
							isPrefetch: false,
							query,
							scope: 'pins',
							no_fetch_context_on_resource: false,
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

							if (!mediaUrl) {
								mediaUrl = resolvePinImageUrls(result).originalUrl;
							}

							if (!mediaUrl) {
								return null;
							}

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
					source_url: `/pin/${pinId}/`,
					data: JSON.stringify({
						options: {
							field_set_key: 'detailed',
							ptrf: null,
							fetch_visual_search_objects: true,
							id: pinId,
							context: {}
						}
					}),
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

				if (!mediaUrl) {
					mediaUrl = resolvePinImageUrls(data).originalUrl;
				}

				if (!mediaUrl) {
					resolve({ error: true, message: 'Could not process pinterest media.', keyword: url });
					return;
				}

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
					source_url: '/',
					data: JSON.stringify({
						options: {
							field_set_key: 'hf_grid',
							in_nux: false,
							in_news_hub: false,
							static_feed: false,
							isPrefetch: false,
							prependPartner: true,
							prependUserNews: false,
							page_size: 100,
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

				const result = json.resource_response.data
					.filter((v) => !v.is_video)
					.map((v) => {
						const { originalUrl, previewUrl } = resolvePinImageUrls(v);

						if (!originalUrl) {
							return null;
						}

						return {
							url: originalUrl,
							thumbnail: previewUrl || originalUrl
						};
					})
					.filter(Boolean);

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
					source_url: `/pin/${pinId}/`,
					data: JSON.stringify({
						options: {
							pin_id: pinId,
							context_pin_ids: [],
							page_size: 50,
							search_query: '',
							source: 'deep_linking',
							top_level_source: 'deep_linking',
							top_level_source_depth: 1,
							is_pdp: false,
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

				const result = json.resource_response.data
					.filter((v) => !v.is_video)
					.map((v) => {
						const { originalUrl, previewUrl } = resolvePinImageUrls(v);

						if (!originalUrl) {
							return null;
						}

						return {
							url: originalUrl,
							thumbnail: previewUrl || originalUrl
						};
					})
					.filter(Boolean);

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
