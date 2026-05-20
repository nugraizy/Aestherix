import { fetch as undiciFetch } from 'undici';
import { Cache } from '../../../helper/modules/cache.js';

const SERVERS = {
	qqdl: {
		subdomains: ['hund', 'katze'],
		tld: 'site'
	}
};

const TRACK_QUALITIES = new Set(['HI_RES_LOSSLESS', 'LOSSLESS', 'HIGH', 'LOW']);
const SEARCH_FIELDS = ['s', 'a', 'al', 'v', 'p', 'i'];

/**
 * Track quality values accepted by getTrack.
 *
 * @typedef {import('./api.tidal.types').TrackQuality} TrackQuality
 */

/**
 * Generic JSON payload returned by the API server.
 *
 * @typedef {import('./api.tidal.types').TidalApiJson} TidalApiJson
 */

/**
 * Text payload returned by the API server when content-type is not JSON.
 *
 * @typedef {import('./api.tidal.types').TidalApiText} TidalApiText
 */

/**
 * Base response fields found in successful JSON responses.
 *
 * @typedef {import('./api.tidal.types').TidalBaseResponse} TidalBaseResponse
 */

/**
 * Common paged container used by many search endpoints.
 *
 * @typedef {import('./api.tidal.types').TidalPagedItems} TidalPagedItems
 */

/**
 * Search response for s/i queries.
 *
 * @typedef {import('./api.tidal.types').TidalSearchTrackResponse} TidalSearchTrackResponse
 */

/**
 * Search response for a/al/v/p queries.
 *
 * @typedef {import('./api.tidal.types').TidalSearchGroupedResponse} TidalSearchGroupedResponse
 */

/**
 * Union of all observed JSON response variants from this API wrapper.
 *
 * @typedef {import('./api.tidal.types').TidalApiResponse} TidalApiResponse
 */

/**
 * Minimal shape expected from track search responses used by searchLyrics.
 *
 * @typedef {import('./api.tidal.types').TidalTrackSearchResponse} TidalTrackSearchResponse
 */

/**
 * Minimal shape expected from lyrics responses used by getLyrics/searchLyrics.
 *
 * @typedef {import('./api.tidal.types').TidalLyricsResponse} TidalLyricsResponse
 */

/**
 * Search filters accepted by getSearch. Exactly one of s, a, al, v, p, or i must be provided.
 *
 * Fields:
 * - s: track query
 * - a: artist query
 * - al: album query
 * - v: video query
 * - p: playlist query
 * - i: ISRC query
 * - offset: result offset (default 0)
 * - limit: result size (default 25)
 * @typedef {import('./api.tidal.types').SearchQueryOptions} SearchQueryOptions
 */

/**
 * Track search options where only s is allowed.
 *
 * @typedef {import('./api.tidal.types').SearchTrackOptions} SearchTrackOptions
 */

/**
 * ISRC search options where only i is allowed.
 *
 * @typedef {import('./api.tidal.types').SearchIsrcOptions} SearchIsrcOptions
 */

/**
 * Artist search options where only a is allowed.
 *
 * @typedef {import('./api.tidal.types').SearchArtistOptions} SearchArtistOptions
 */

/**
 * Album search options where only al is allowed.
 *
 * @typedef {import('./api.tidal.types').SearchAlbumOptions} SearchAlbumOptions
 */

/**
 * Video search options where only v is allowed.
 *
 * @typedef {import('./api.tidal.types').SearchVideoOptions} SearchVideoOptions
 */

/**
 * Playlist search options where only p is allowed.
 *
 * @typedef {import('./api.tidal.types').SearchPlaylistOptions} SearchPlaylistOptions
 */

/**
 * Input used by parseMixData.
 *
 * @typedef {import('./api.tidal.types').MixTrackInput} MixTrackInput
 */

/**
 * Output item returned by parseMixData.
 *
 * @typedef {import('./api.tidal.types').ParsedMixTrack} ParsedMixTrack
 */

const assertInt = (name, value, { required = false, min, max } = {}) => {
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

const assertString = (name, value, { required = false } = {}) => {
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

const assertBoolean = (name, value, defaultValue = false) => {
	if (value === undefined || value === null) {
		return defaultValue;
	}

	if (typeof value !== 'boolean') {
		throw new Error(`Parameter "${name}" must be a boolean`);
	}

	return value;
};

class TidalApi {
	/**
	 * @param {Object} [options]
	 * @param {Object<string, {subdomains: string[], tld: string}>} [options.servers] Server map used for failover.
	 * @param {(url: string) => Promise<Response>} [options.fetchImpl] Fetch implementation.
	 * @param {{search?: Cache, album?: Cache, mix?: Cache}} [options.cache] Optional external cache groups.
	 */
	constructor({ servers = SERVERS, fetchImpl = undiciFetch, cache } = {}) {
		this.servers = servers;
		this.fetchImpl = fetchImpl;
		this.domain = null;
		this.requestUrl = null;
		this.cache = cache || {
			search: new Cache({ allowOverwrite: true, limit: 100 }),
			album: new Cache({ allowOverwrite: true, limit: 100 }),
			mix: new Cache({ allowOverwrite: true, limit: 100 })
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

		return {
			...payload,
			domain: this.domain
		};
	}

	/**
	 * Reads a cached entry from a cache group.
	 *
	 * @param {'search' | 'album' | 'mix'} group
	 * @param {string} key
	 * @returns {TidalApiResponse | null}
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
	 * @param {'search' | 'album' | 'mix'} group
	 * @param {string} key
	 * @param {TidalApiResponse} value
	 * @returns {TidalApiResponse}
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
	 * @param {'search' | 'album' | 'mix'} group
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
	 * @param {'search' | 'album' | 'mix'} group
	 * @param {string} key
	 * @returns {boolean} True when an entry was removed.
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
	 * Builds failover URLs for all configured servers.
	 *
	 * @param {string} path
	 * @param {string} params
	 * @returns {string[]}
	 */
	buildUrls(path, params) {
		return Object.entries(this.servers).flatMap(([domain, { subdomains, tld }]) =>
			subdomains.map((subdomain) => `https://${subdomain}.${domain}.${tld}/${path}/?${params}`)
		);
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
	 * Tries all configured API endpoints until one responds successfully.
	 *
	 * Response:
	 * - Returns JSON payload as object, and injects domain when missing.
	 * - Returns plain text string if content-type is not JSON.
	 *
	 * @param {string} path
	 * @param {Record<string, any>} [params={}]
	 * @returns {Promise<TidalApiResponse | TidalApiText>} JSON object (with version/domain and endpoint-specific keys) or plain text.
	 */
	async tryFetch(path, params = {}) {
		const query = this.buildQuery(params);
		const urls = this.buildUrls(path, query);
		let lastError;

		for (const url of urls) {
			try {
				const response = await this.fetchImpl(url);

				if (!response.ok) {
					lastError = new Error(`Request failed (${response.status}) on ${url}`);
					continue;
				}

				this.markRequest(url);
				const contentType = response.headers.get('content-type') || '';

				if (contentType.includes('application/json')) {
					return this.withDomain(await response.json());
				}

				return await response.text();
			} catch (error) {
				lastError = error;
			}
		}

		throw lastError || new Error(`All servers failed for path: ${path}`);
	}

	/**
	 * Fetches track info by numeric track ID.
	 *
	 * Response: { version, data, domain } where data is a full track metadata object.
	 *
	 * @param {number | string} id
	 * @returns {Promise<TidalApiResponse | TidalApiText>}
	 */
	async getInfo(id) {
		return this.tryFetch('info', {
			id: assertInt('id', id, { required: true })
		});
	}

	/**
	 * Fetches stream/download data for a track.
	 *
	 * Response: { version, data, domain } where data includes trackId, audioQuality, manifestMimeType, manifest, and replay-gain fields.
	 *
	 * @param {{id: number | string, quality?: TrackQuality, immersiveaudio?: boolean}} [options={}]
	 * @returns {Promise<TidalApiResponse | TidalApiText>}
	 */
	async getTrack({ id, quality = 'HI_RES_LOSSLESS', immersiveaudio: immersiveAudio = false } = {}) {
		const trackId = assertInt('id', id, { required: true });
		const selectedQuality = assertString('quality', quality, { required: true });
		const immersiveAudioEnabled = assertBoolean('immersiveaudio', immersiveAudio, false);

		if (!TRACK_QUALITIES.has(selectedQuality)) {
			throw new Error('Parameter "quality" must be one of: HI_RES_LOSSLESS, LOSSLESS, HIGH, LOW');
		}

		return this.tryFetch('track', {
			id: trackId,
			quality: selectedQuality,
			immersiveaudio: immersiveAudioEnabled
		});
	}

	/**
	 * @overload
	 * @param {SearchTrackOptions | SearchIsrcOptions} [options={}]
	 * @returns {Promise<TidalSearchTrackResponse>}
	 */
	/**
	 * @overload
	 * @param {SearchArtistOptions | SearchAlbumOptions | SearchVideoOptions | SearchPlaylistOptions} [options={}]
	 * @returns {Promise<TidalSearchGroupedResponse>}
	 */
	/**
	 * Performs a search against one resource type.
	 *
	 * Response by field:
	 * - s/i: { version, data: { limit, offset, totalNumberOfItems, items }, domain }
	 * - a/al/v/p: { version, data: { artists, albums, playlists, tracks, videos, genres, topHits }, domain }
	 *
	 * @param {SearchQueryOptions} [options={}]
	 * @returns {Promise<TidalSearchTrackResponse | TidalSearchGroupedResponse>}
	 */
	async getSearch({
		s: trackQuery,
		a: artistQuery,
		al: albumQuery,
		v: videoQuery,
		p: playlistQuery,
		i: isrcQuery,
		offset = 0,
		limit = 25
	} = {}) {
		const queryByField = {
			s: trackQuery,
			a: artistQuery,
			al: albumQuery,
			v: videoQuery,
			p: playlistQuery,
			i: isrcQuery
		};

		const providedFields = SEARCH_FIELDS.filter((field) => {
			const value = queryByField[field];

			return typeof value === 'string' && value.trim() !== '';
		});

		if (providedFields.length !== 1) {
			throw new Error('Provide exactly one search field: s, a, al, v, p, or i');
		}

		const searchField = providedFields[0];
		const searchValue = assertString(searchField, queryByField[searchField], {
			required: true
		});
		const searchParams = {
			[searchField]: searchValue,
			offset: assertInt('offset', offset, { min: 0 }),
			limit: assertInt('limit', limit, { min: 1, max: 500 })
		};
		const cacheKey = this.buildQuery(searchParams);
		const cached = this.readCache('search', cacheKey);

		if (cached) {
			return cached;
		}

		const response = await this.tryFetch('search', searchParams);

		return this.writeCache('search', cacheKey, response);
	}

	/**
	 * Fetches album details and/or tracks.
	 *
	 * Response: { version, data, domain } where data is album metadata and includes items [{ item, type }].
	 *
	 * @param {{id: number | string, limit?: number, offset?: number}} [options={}]
	 * @returns {Promise<TidalApiResponse | TidalApiText>}
	 */
	async getAlbum({ id, limit = 100, offset = 0 } = {}) {
		const albumParams = {
			id: assertInt('id', id, { required: true }),
			limit: assertInt('limit', limit, { min: 1, max: 500 }),
			offset: assertInt('offset', offset, { min: 0 })
		};
		const cacheKey = this.buildQuery(albumParams);
		const cached = this.readCache('album', cacheKey);

		if (cached) {
			return cached;
		}

		const response = await this.tryFetch('album', albumParams);

		return this.writeCache('album', cacheKey, response);
	}

	/**
	 * Fetches mix data by mix ID.
	 *
	 * Response: { version, mix, items, domain } where items is an array of mix track objects.
	 *
	 * @param {{id: string}} [options={}]
	 * @returns {Promise<TidalApiResponse | TidalApiText>}
	 */
	async getMix({ id } = {}) {
		const mixId = assertString('id', id, { required: true });
		const cached = this.readCache('mix', mixId);

		if (cached) {
			return cached;
		}

		const response = await this.tryFetch('mix', {
			id: mixId
		});

		return this.writeCache('mix', mixId, response);
	}

	/**
	 * Fetches playlist contents.
	 *
	 * Response: { version, playlist, items, domain } where items entries look like { item, type, cut }.
	 *
	 * @param {{id: string, limit?: number, offset?: number}} [options={}]
	 * @returns {Promise<TidalApiResponse | TidalApiText>}
	 */
	async getPlaylist({ id, limit = 100, offset = 0 } = {}) {
		return this.tryFetch('playlist', {
			id: assertString('id', id, { required: true }),
			limit: assertInt('limit', limit, { min: 1, max: 500 }),
			offset: assertInt('offset', offset, { min: 0 })
		});
	}

	/**
	 * Fetches similar artists.
	 *
	 * Response: { version, artists, domain } (cursor support depends on upstream endpoint behavior).
	 *
	 * @param {{id: number | string, cursor?: number | string}} [options={}]
	 * @returns {Promise<TidalApiResponse | TidalApiText>}
	 */
	async getArtistSimilar({ id, cursor } = {}) {
		if (cursor !== undefined && typeof cursor !== 'string' && !Number.isInteger(Number(cursor))) {
			throw new Error('Parameter "cursor" must be an integer or string');
		}

		return this.tryFetch('artist/similar', {
			id: assertInt('id', id, { required: true }),
			cursor
		});
	}

	/**
	 * Fetches similar albums.
	 *
	 * Response: { version, albums, domain } (cursor support depends on upstream endpoint behavior).
	 *
	 * @param {{id: number | string, cursor?: number | string}} [options={}]
	 * @returns {Promise<TidalApiResponse | TidalApiText>}
	 */
	async getAlbumSimilar({ id, cursor } = {}) {
		if (cursor !== undefined && typeof cursor !== 'string' && !Number.isInteger(Number(cursor))) {
			throw new Error('Parameter "cursor" must be an integer or string');
		}

		return this.tryFetch('album/similar', {
			id: assertInt('id', id, { required: true }),
			cursor
		});
	}

	/**
	 * Fetches artist details or artist releases.
	 *
	 * Response:
	 * - with id: { version, artist, cover, domain }
	 * - with f: { version, albums, tracks, domain }
	 *
	 * @param {{id?: number | string, f?: number | string, skip_tracks?: boolean, skipTracks?: boolean}} [options={}]
	 * @returns {Promise<TidalApiResponse | TidalApiText>}
	 */
	async getArtist({ id, f: releasesArtistId, skip_tracks: skipTracksRaw, skipTracks = false } = {}) {
		const skipTracksValue = skipTracksRaw === undefined ? skipTracks : skipTracksRaw;
		const artistId = assertInt('id', id);
		const releasesArtistIdValidated = assertInt('f', releasesArtistId);

		if (artistId === undefined && releasesArtistIdValidated === undefined) {
			throw new Error('Provide at least one of: id or f');
		}

		return this.tryFetch('artist', {
			id: artistId,
			f: releasesArtistIdValidated,
			skip_tracks: assertBoolean('skip_tracks', skipTracksValue, false)  
		});
	}

	/**
	 * Fetches cover artwork by track ID or free-text query.
	 *
	 * Response: { version, covers, domain } where covers contains matching image candidates.
	 *
	 * @param {{id?: number | string, q?: string}} [options={}]
	 * @returns {Promise<TidalApiResponse | TidalApiText>}
	 */
	async getCover({ id, q: trackQuery } = {}) {
		const trackId = assertInt('id', id);
		const query = assertString('q', trackQuery);

		if (trackId === undefined && query === undefined) {
			throw new Error('Provide at least one of: id or q');
		}

		return this.tryFetch('cover', {
			id: trackId,
			q: query
		});
	}

	/**
	 * Fetches lyrics by track ID.
	 *
	 * Response: { version, lyrics, domain } where lyrics is an object (provider IDs, lyrics text, subtitles).
	 *
	 * @param {{id: number | string}} [options={}]
	 * @returns {Promise<TidalLyricsResponse | TidalApiText>}
	 */
	async getLyrics({ id } = {}) {
		return this.tryFetch('lyrics', {
			id: assertInt('id', id, { required: true })
		});
	}

	/**
	 * Searches for a track by query, then returns lyrics for the top result.
	 *
	 * Response:
	 * - track: first item from search response data.items
	 * - lyrics: lyrics object from /lyrics response
	 *
	 * @param {{q: string}} [options={}]
	 * @returns {Promise<{track: NonNullable<NonNullable<TidalTrackSearchResponse['data']>['items']>[number], lyrics: TidalLyricsResponse['lyrics']}>}
	 */
	async searchLyrics({ q: query } = {}) {
		const validatedQuery = assertString('q', query, { required: true });

		const searchTracksResponse = await this.getSearch({ s: validatedQuery });

		if (!searchTracksResponse?.data?.items) {
			throw new Error('No tracks found for lyrics search');
		}

		const tracks = searchTracksResponse.data.items[0];

		const lyricsResults = await this.getLyrics({ id: tracks.id });

		return {
			track: tracks,
			lyrics: lyricsResults.lyrics
		};
	}

	/**
	 * Normalizes raw mix tracks to a compact, stable output shape.
	 *
	 * Response: array of parsed mix tracks with id, title, duration, and artist list.
	 *
	 * @param {MixTrackInput[]} data
	 * @returns {ParsedMixTrack[]}
	 */
	parseMixData(data) {
		return data.map((track) => ({
			id: track.id,
			title: track.title,
			artists: track.artists.map((artist) => ({
				name: artist.name,
				id: artist.id,
				picture: artist.picture,
				type: artist.type
			})),
			duration: track.duration
		}));
	}
}

export { TidalApi };
