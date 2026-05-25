import { fetch as undiciFetch } from 'undici';
import { Cache } from '../../../helper/modules/cache.js';
import { BASE_URL, CookieManager } from './cookie.js';

const TRACK_QUALITIES = new Set([5, 6, 7, 27, 28, 29, 30]);

/**
 * @typedef {import('./api.qobuz.types.d.ts').QobuzApiJson} QobuzApiJson
 */

/**
 * @typedef {import('./api.qobuz.types.d.ts').QobuzApiText} QobuzApiText
 */

/**
 * @typedef {import('./api.qobuz.types.d.ts').QobuzBaseResponse} QobuzBaseResponse
 */

/**
 * @typedef {import('./api.qobuz.types.d.ts').QobuzSearchTrackResponse} QobuzSearchTrackResponse
 */

/**
 * @typedef {import('./api.qobuz.types.d.ts').QobuzSearchAlbumResponse} QobuzSearchAlbumResponse
 */

/**
 * @typedef {import('./api.qobuz.types.d.ts').QobuzSearchArtistResponse} QobuzSearchArtistResponse
 */

/**
 * @typedef {import('./api.qobuz.types.d.ts').QobuzAlbumResponse} QobuzAlbumResponse
 */

/**
 * @typedef {import('./api.qobuz.types.d.ts').QobuzDownloadResponse} QobuzDownloadResponse
 */

/**
 * @typedef {import('./api.qobuz.types.d.ts').QobuzApiResponse} QobuzApiResponse
 */

/**
 * @typedef {import('./api.qobuz.types.d.ts').SearchType} SearchType
 */

/**
 * @typedef {import('./api.qobuz.types.d.ts').TrackQuality} TrackQuality
 */

/**
 * Asserts a value is a valid integer within optional bounds.
 *
 * @param {string} name
 * @param {unknown} value
 * @param {{ required?: boolean, min?: number, max?: number }} [constraints]
 * @returns {number | undefined}
 */
const assertInt = (name, value, constraints = {}) => {
	const { required = false, min, max } = constraints;

	if (value === undefined || value === null) {
		if (required) {
			throw new Error(`Parameter "${name}" is required`);
		}

		return undefined;
	}

	const parsed = Number(value);

	if (!Number.isInteger(parsed)) {
		throw new Error(`Parameter "${name}" must be an integer`);
	}

	if (min !== undefined && parsed < min) {
		throw new Error(`Parameter "${name}" must be >= ${min}`);
	}

	if (max !== undefined && parsed > max) {
		throw new Error(`Parameter "${name}" must be <= ${max}`);
	}

	return parsed;
};

/**
 * Asserts a value is a non-empty string.
 *
 * @param {string} name
 * @param {unknown} value
 * @param {{ required?: boolean }} [constraints]
 * @returns {string | undefined}
 */
const assertString = (name, value, constraints = {}) => {
	const { required = false } = constraints;

	if (value === undefined || value === null) {
		if (required) {
			throw new Error(`Parameter "${name}" is required`);
		}

		return undefined;
	}

	if (typeof value !== 'string' || value.trim() === '') {
		throw new Error(`Parameter "${name}" must be a non-empty string`);
	}

	return value;
};

class QobuzApi {
	/**
	 * @param {Object} [options]
	 * @param {string} [options.baseUrl] Base URL for all API calls.
	 * @param {(url: string, init?: RequestInit) => Promise<Response>} [options.fetchImpl] Fetch implementation.
	 * @param {string} [options.cookie] Pre-set cookie string (bypasses altcha flow).
	 * @param {CookieManager} [options.cookieManager] Optional cookie manager.
	 * @param {{search?: Cache, album?: Cache}} [options.cache] Optional external cache groups.
	 */
	constructor({ baseUrl = BASE_URL, fetchImpl = undiciFetch, cookie = null, cookieManager, cache } = {}) {
		this.baseUrl = baseUrl;
		this.fetchImpl = fetchImpl;
		this.cookie = cookie;
		this.cookieManager = cookieManager ?? new CookieManager({ fetchImpl });
		this.domain = new URL(baseUrl).host;
		this.requestUrl = null;
		this.cache = cache || {
			search: new Cache({ allowOverwrite: true, limit: 100 }),
			album: new Cache({ allowOverwrite: true, limit: 100 })
		};
	}

	/**
	 * Marks the latest request URL and source domain.
	 *
	 * @param {string} url
	 * @returns {void}
	 */
	markRequest(url) {
		this.requestUrl = url;
		this.domain = new URL(url).host;
	}

	/**
	 * Adds domain metadata to JSON object payloads if missing.
	 *
	 * @param {any} payload
	 * @returns {any}
	 */
	withDomain(payload) {
		if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
			return payload;
		}

		if (Object.hasOwn(payload, 'domain')) {
			return payload;
		}

		return { ...payload, domain: this.domain };
	}

	/**
	 * Reads a cached entry from a cache group.
	 *
	 * @param {'search' | 'album'} group
	 * @param {string} key
	 * @returns {QobuzApiResponse | null}
	 */
	readCache(group, key) {
		if (!this.cache[group]?.has(key)) {
			return null;
		}

		const cached = this.cache[group].get(key);

		if (cached?.domain) {
			this.domain = cached.domain;
		}

		return cached;
	}

	/**
	 * Writes a cache entry and returns the value for chaining.
	 *
	 * @param {'search' | 'album'} group
	 * @param {string} key
	 * @param {QobuzApiResponse} value
	 * @returns {QobuzApiResponse}
	 */
	writeCache(group, key, value) {
		this.cache[group]?.set(key, value);
		return value;
	}

	/**
	 * Clears all cache groups.
	 *
	 * @returns {boolean}
	 */
	clearCache() {
		for (const cacheGroup of Object.values(this.cache)) {
			cacheGroup.clear();
		}

		return true;
	}

	/**
	 * Clears a specific cache group.
	 *
	 * @param {'search' | 'album'} group
	 * @returns {boolean}
	 */
	clearCacheGroup(group) {
		if (!this.cache[group]) {
			throw new Error(`Unknown cache group: ${group}`);
		}

		this.cache[group].clear();
		return true;
	}

	/**
	 * Deletes one cache entry.
	 *
	 * @param {'search' | 'album'} group
	 * @param {string} key
	 * @returns {boolean}
	 */
	clearCacheEntry(group, key) {
		if (!this.cache[group]) {
			throw new Error(`Unknown cache group: ${group}`);
		}

		if (!this.cache[group].has(key)) {
			return false;
		}

		this.cache[group].delete(key);
		return true;
	}

	/**
	 * Converts plain object params to URL query string.
	 *
	 * @param {Record<string, any>} [params={}]
	 * @returns {string}
	 */
	buildQuery(params = {}) {
		const searchParams = new URLSearchParams();

		for (const [key, value] of Object.entries(params)) {
			if (value === undefined || value === null) {
				continue;
			}

			searchParams.set(key, String(value));
		}

		return searchParams.toString();
	}

	/**
	 * Fetches from the API using the current cookie.
	 *
	 * @param {string} path
	 * @param {Record<string, any>} [params={}]
	 * @returns {Promise<QobuzApiResponse | QobuzApiText>}
	 */
	async fetch(path, params = {}) {
		const query = this.buildQuery(params);
		const url = query ? `${this.baseUrl}/${path}/?${query}` : `${this.baseUrl}/${path}/`;
		const cookieHeader = this.cookie || (this.cookieManager ? await this.cookieManager.getCookie() : null);
		const response = await this.fetchImpl(url, {
			headers: cookieHeader ? { Cookie: cookieHeader } : {}
		});

		this.markRequest(url);

		const contentType = response.headers.get('content-type') || '';

		if (contentType.includes('application/json')) {
			return this.withDomain(await response.json());
		}

		return await response.text();
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
	 * Generic search dispatcher.
	 *
	 * @param {'tracks' | 'albums' | 'artists'} type
	 * @param {string} query
	 * @param {number} [offset=0]
	 * @returns {Promise<QobuzSearchTrackResponse | QobuzSearchAlbumResponse | QobuzSearchArtistResponse>}
	 */
	async search(type, query, offset = 0) {
		const validatedQuery = assertString('query', query, { required: true });
		const validatedOffset = assertInt('offset', offset, { min: 0 });

		const params = { q: validatedQuery, offset: validatedOffset };
		const cacheKey = this.buildQuery({ ...params, type });
		const cached = this.readCache('search', cacheKey);

		if (cached) {
			return cached;
		}

		const response = await this.fetch('api/get-music', params);

		if (response?.success === false) {
			throw new Error(`Search failed: ${JSON.stringify(response)}`);
		}

		const payload = this.extractPayload(response);

		return this.writeCache('search', cacheKey, payload?.[type] ?? { items: [] });
	}

	/**
	 * @overload
	 * @param {string} query
	 * @param {number} [offset]
	 * @returns {Promise<QobuzSearchTrackResponse>}
	 */
	/**
	 * Search for tracks.
	 *
	 * @param {string} query
	 * @param {number} [offset=0]
	 * @returns {Promise<QobuzSearchTrackResponse>}
	 */
	async searchTracks(query, offset = 0) {
		return /** @type {Promise<QobuzSearchTrackResponse>} */ (this.search('tracks', query, offset));
	}

	/**
	 * Search for albums.
	 *
	 * @param {string} query
	 * @param {number} [offset=0]
	 * @returns {Promise<QobuzSearchAlbumResponse>}
	 */
	async searchAlbums(query, offset = 0) {
		return /** @type {Promise<QobuzSearchAlbumResponse>} */ (this.search('albums', query, offset));
	}

	/**
	 * Search for artists.
	 *
	 * @param {string} query
	 * @param {number} [offset=0]
	 * @returns {Promise<QobuzSearchArtistResponse>}
	 */
	async searchArtists(query, offset = 0) {
		return /** @type {Promise<QobuzSearchArtistResponse>} */ (this.search('artists', query, offset));
	}

	/**
	 * Fetches album details by album ID.
	 *
	 * @param {number | string} id
	 * @returns {Promise<QobuzAlbumResponse>}
	 */
	async getAlbum(id) {
		const validatedId = assertString('id', String(id), { required: true });
		const cacheKey = `album:${validatedId}`;
		const cached = this.readCache('album', cacheKey);

		if (cached) {
			return cached;
		}

		const response = await this.fetch('api/get-album', { album_id: validatedId });

		if (response?.success === false) {
			throw new Error(`Album ${validatedId} not found`);
		}

		return this.writeCache('album', cacheKey, this.extractPayload(response));
	}

	/**
	 * Fetches a track download URL.
	 *
	 * @param {number | string} trackId
	 * @param {TrackQuality} [quality=27]
	 * @returns {Promise<QobuzDownloadResponse>}
	 */
	async getTrackDownload(trackId, quality = 27) {
		const validatedTrackId = assertInt('trackId', trackId, { required: true });
		const validatedQuality = assertInt('quality', quality, { required: true });

		if (!TRACK_QUALITIES.has(validatedQuality)) {
			throw new Error('Parameter "quality" must be one of: 5, 6, 7, 27, 28, 29, 30');
		}

		const response = await this.fetch('api/download-music', {
			track_id: validatedTrackId,
			quality: validatedQuality
		});

		if (response?.success === false) {
			throw new Error(`Download failed: ${JSON.stringify(response)}`);
		}

		const data = this.extractPayload(response);
		const parsed = new URL(data.url);
		const qMeta = QUALITY_MAP[validatedQuality];

		return {
			...data,
			trackId: parsed.searchParams.get('eid') || parsed.searchParams.get('track_id') || String(trackId),
			etsp: parsed.searchParams.get('etsp') || null,
			hmac: parsed.searchParams.get('hmac') || null,
			uid: parsed.searchParams.get('uid') || null,
			fmt: parsed.searchParams.get('fmt') || null,
			profile: parsed.searchParams.get('profile') || qMeta.profile,
			format: qMeta.format,
			ext: qMeta.ext,
			quality: validatedQuality
		};
	}
}

/** @type {Record<number, {format: string, ext: string, profile: string, bitrate: number | null}>} */
const QUALITY_MAP = {
	5: { format: 'MP3', ext: 'mp3', profile: 'poor', bitrate: 320 },
	6: { format: 'MP3', ext: 'mp3', profile: 'normal', bitrate: 320 },
	7: { format: 'FLAC', ext: 'flac', profile: 'raw', bitrate: null },
	27: { format: 'FLAC', ext: 'flac', profile: '高', bitrate: null },
	28: { format: 'FLAC', ext: 'flac', profile: '好听', bitrate: null },
	29: { format: 'AIFF', ext: 'aiff', profile: 'raw', bitrate: null },
	30: { format: 'ALAC', ext: 'm4a', profile: 'raw', bitrate: null }
};

export { QobuzApi, QUALITY_MAP };
