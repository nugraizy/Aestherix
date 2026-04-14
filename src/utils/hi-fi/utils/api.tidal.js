import { fetch as undiciFetch } from 'undici';
import { Cache } from '../../../helper/modules/cache.js';

const SERVERS = {
	monochrome: {
		subdomains: ['api', 'frankfurt-1', 'ohio-1', 'singapore-1', 'eu-central', 'us-west', 'arran'],
		tld: 'tf'
	},
	qqdl: {
		subdomains: ['hund', 'katze', 'maus', 'vogel', 'wolf'],
		tld: 'site'
	},
	geeked: {
		subdomains: ['hifi'],
		tld: 'wtf'
	},
	spotisaver: {
		subdomains: ['hifi-one', 'hifi-two'],
		tld: 'net'
	},
	kinoplus: {
		subdomains: ['tidal'],
		tld: 'online'
	},
	samidy: {
		subdomains: ['monochrome-api'],
		tld: 'com'
	}
};

const TRACK_QUALITIES = new Set(['HI_RES_LOSSLESS', 'LOSSLESS', 'HIGH', 'LOW']);
const SEARCH_FIELDS = ['s', 'a', 'al', 'v', 'p', 'i'];

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

	markRequest(url) {
		this.requestUrl = url;
		this.domain = new URL(url).host;
	}

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

	writeCache(group, key, value) {
		this.cache[group]?.set(key, value);
		return value;
	}

	clearCache() {
		for (const cacheGroup of Object.values(this.cache)) {
			cacheGroup.clear();
		}

		return true;
	}

	clearCacheGroup(group) {
		if (!this.cache[group]) {
			throw new Error(`Unknown cache group: ${group}`);
		}

		this.cache[group].clear();
		return true;
	}

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

	buildUrls(path, params) {
		return Object.entries(this.servers).flatMap(([domain, { subdomains, tld }]) =>
			subdomains.map((subdomain) => `https://${subdomain}.${domain}.${tld}/${path}/?${params}`)
		);
	}

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

	async getInfo(id) {
		return this.tryFetch('info', {
			id: assertInt('id', id, { required: true })
		});
	}

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

	async getPlaylist({ id, limit = 100, offset = 0 } = {}) {
		return this.tryFetch('playlist', {
			id: assertString('id', id, { required: true }),
			limit: assertInt('limit', limit, { min: 1, max: 500 }),
			offset: assertInt('offset', offset, { min: 0 })
		});
	}

	async getArtistSimilar({ id, cursor } = {}) {
		if (cursor !== undefined && typeof cursor !== 'string' && !Number.isInteger(Number(cursor))) {
			throw new Error('Parameter "cursor" must be an integer or string');
		}

		return this.tryFetch('artist/similar', {
			id: assertInt('id', id, { required: true }),
			cursor
		});
	}

	async getAlbumSimilar({ id, cursor } = {}) {
		if (cursor !== undefined && typeof cursor !== 'string' && !Number.isInteger(Number(cursor))) {
			throw new Error('Parameter "cursor" must be an integer or string');
		}

		return this.tryFetch('album/similar', {
			id: assertInt('id', id, { required: true }),
			cursor
		});
	}

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
			skip_tracks: assertBoolean('skip_tracks', skipTracksValue, false) // eslint-disable-line camelcase
		});
	}

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

	async getLyrics({ id } = {}) {
		return this.tryFetch('lyrics', {
			id: assertInt('id', id, { required: true })
		});
	}

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
