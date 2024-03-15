import { fetch } from 'undici';

const _apiBase = (input) => `https://id.pinterest.com/pin/${input}`;
const _regex = new RegExp(
	'https?://(?:[^/]+.)?pinterest.(?:com|fr|de|ch|jp|cl|ca|it|co.uk|nz|ru|com.au|at|pt|co.kr|es|com.mx|dk|ph|th|com.uy|co|nl|info|kr|ie|vn|com.vn|ec|mx|in|pe|co.at|hu|co.in|co.nz|id|com.ec|com.py|tw|be|uk|com.bo|com.pe)',
	'g'
);
const _id = /\/?pin\/?([\d]+)/;

/**
 * @typedef {{authorUsername: string, authorFullname: string, follower: number, caption: string, image: string, pinSource: string}} PinterestResponse
 */

class Pinterest {
	constructor() {
		/**
		 * Search Images
		 * @param {string} query
		 * @returns {Promise<PinterestResponse[]>}
		 */
		this.search = (query) => this.#_search(query);

		/**
		 * Directly Download Image
		 * @param {string} url
		 * @returns {Promise<PinterestResponse>}
		 */
		this.download = (url) => this.#_download(url);
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

				const response = await fetch(`https://pinterest.com/resource/BaseSearchResource/get/?${path.toString()}`);

				const { resource_response: resourceResponse } = await response.json();

				let data = resourceResponse.data.results;

				if (!data.length) {
					resolve({ error: true, message: 'Could not find Images with the keyword. Try other keyword.' });
				}

				if (data.length) {
					data = data.filter((v) => v.images?.orig !== undefined);
				}

				if (!data.length) {
					resolve({ error: true, message: 'Original Image Not Available.' });
				}

				resolve(
					data.map((result) => ({
						authorUsername: result.pinner.username,
						authorFullname: result.pinner.full_name,
						follower: result.pinner.follower_count,
						caption: result.grid_title || 'No caption',
						image: result.images.orig.url,
						pinSource: _apiBase(result.id)
					}))
				);
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
					resolve({ error: true, message: 'Could not find the id on the URL.' });
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

				const response = await fetch(`https://www.pinterest.com/resource/PinResource/get/?${path.toString()}`);

				const { resource_response: resourceResponse } = await response.json();

				if (resourceResponse.status !== 'success') {
					resolve({ error: true, message: 'Could not process pinterest image.' });
				}

				const { data } = resourceResponse;

				resolve({
					authorUsername: data.pinner.username,
					authorFullname: data.pinner.full_name,
					follower: data.pinner.follower_count,
					caption: data.grid_title || 'No caption',
					image: data.images.orig.url,
					pinSource: _apiBase(data.id)
				});
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
