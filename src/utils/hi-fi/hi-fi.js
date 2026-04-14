import { TidalApi } from './utils/api.tidal.js';
import { decodeManifestBase64 } from './utils/decode.js';

/**
 * @typedef {import('./hi-fi.types').ApiErrorPayload} ApiErrorPayload
 */

/**
 * @typedef {import('./hi-fi.types').HiFiSearchResult} HiFiSearchResult
 */

/**
 * @typedef {import('./hi-fi.types').HiFiTrackSearchPayload} HiFiTrackSearchPayload
 */

/**
 * @typedef {import('./hi-fi.types').HiFiAlbumSearchPayload} HiFiAlbumSearchPayload
 */

/**
 * @typedef {import('./hi-fi.types').HiFiDownloadResponse} HiFiDownloadResponse
 */

/**
 * @typedef {import('./hi-fi.types').HiFiAlbumResponse} HiFiAlbumResponse
 */

/**
 * @typedef {import('./hi-fi.types').HiFiMixResponse} HiFiMixResponse
 */

class HiFi {
	/**
	 * @param {TidalApi} [tidalApi]
	 */
	constructor(tidalApi = new TidalApi()) {
		this.tidalApi = tidalApi;
	}

	/**
	 * Returns response.data when available, otherwise returns the original response.
	 *
	 * @template T
	 * @param {T} response
	 * @returns {T extends { data: infer D } ? D : T}
	 */
	extractPayload(response) {
		if (!response || typeof response !== 'object') {
			return response;
		}

		return response.data ?? response;
	}

	/**
	 * Maps low-level API errors to user-facing messages.
	 *
	 * @param {unknown} error
	 * @returns {string}
	 */
	toFriendlyError(error) {
		if (error?.message?.includes('All servers failed')) {
			return 'Too Many Requests. Try again later.';
		}

		return error?.message || 'Too Many Requests. Try again later.';
	}

	/**
	 * @overload
	 * @param {string} query
	 * @param {'track'} [type]
	 * @returns {Promise<HiFiTrackSearchPayload | ApiErrorPayload | string>}
	 */
	/**
	 * @overload
	 * @param {string} query
	 * @param {'album'} type
	 * @returns {Promise<HiFiAlbumSearchPayload | ApiErrorPayload | string>}
	 */
	/**
	 * Search tracks or albums and return the normalized payload.
	 *
	 * - track: returns track search payload (`data` from `s` query)
	 * - album: returns only `data.albums` from grouped `al` query
	 *
	 * @param {string} query
	 * @param {'track' | 'album'} [type='track']
	 * @returns {Promise<HiFiSearchResult>}
	 */
	async search(query, type = 'track') {
		if (!query) {
			throw new Error('Query is required');
		}

		try {
			const response =
				type === 'track'
					? await this.tidalApi.getSearch({ s: query, limit: 50 })
					: await this.tidalApi.getSearch({ al: query });

			if (response?.error) {
				return response;
			}

			const payload = this.extractPayload(response);

			if (type === 'album') {
				return payload?.albums ?? {};
			}

			return payload;
		} catch (error) {
			return this.toFriendlyError(error);
		}
	}

	/**
	 * Resolve a track download URL and include track metadata.
	 *
	 * @param {number | string} id
	 * @returns {Promise<HiFiDownloadResponse>}
	 */
	async download(id) {
		if (!id) {
			throw new Error('ID is required');
		}

		try {
			const downloadResponse = await this.tidalApi.getTrack({ id, quality: 'LOSSLESS' });
			const downloadDomain = this.tidalApi.domain;
			const infoResponse = await this.tidalApi.getInfo(id);

			if (downloadResponse?.error) {
				return /** @type {ApiErrorPayload} */ (downloadResponse);
			}

			const file = this.extractPayload(downloadResponse);
			const track = this.extractPayload(infoResponse);
			const original = JSON.parse(decodeManifestBase64(file.manifest))?.urls?.[0] || null;

			if (!original) {
				throw new Error('Could not retrieve original track URL');
			}

			return {
				file,
				track,
				url: original,
				cover: track ? this.stringToCover(track.album.cover) : null,
				domain: downloadDomain
			};
		} catch (error) {
			return this.toFriendlyError(error);
		}
	}

	/**
	 * Fetch album details by album ID.
	 *
	 * @param {number | string} id
	 * @returns {Promise<HiFiAlbumResponse>}
	 */
	async getAlbum(id) {
		if (!id) {
			throw new Error('ID is required');
		}

		try {
			const response = await this.tidalApi.getAlbum({ id });

			if (response?.error) {
				return /** @type {ApiErrorPayload} */ (response);
			}

			return this.extractPayload(response);
		} catch (error) {
			return this.toFriendlyError(error);
		}
	}

	/**
	 * Find a track by query, then fetch and normalize its track mix.
	 *
	 * @param {string} query
	 * @returns {Promise<HiFiMixResponse>}
	 */
	async getMix(query) {
		if (!query) {
			throw new Error('Query is required');
		}

		try {
			const searchResponse = await this.search(query, 'track');

			if (searchResponse?.error) {
				return searchResponse;
			}

			const mixId = searchResponse?.items?.[0]?.mixes?.TRACK_MIX;

			if (!mixId) {
				throw new Error('Mix not found for query: ' + query);
			}

			const mixResponse = await this.tidalApi.getMix({ id: mixId });

			if (mixResponse?.error) {
				return /** @type {ApiErrorPayload} */ (mixResponse);
			}

			return this.tidalApi.withDomain({ tracks: this.tidalApi.parseMixData(mixResponse.items) });
		} catch (error) {
			return this.toFriendlyError(error);
		}
	}

	/**
	 * Build a full TIDAL image URL from a cover UUID.
	 *
	 * @param {string} id
	 * @returns {string}
	 */
	stringToCover(id) {
		return `https://resources.tidal.com/images/${id.replace(/-/g, '/')}/1280x1280.jpg`;
	}
}

export const hifi = new HiFi();
