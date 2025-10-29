import { fetch } from 'undici';

import { Cache } from '../../helper/modules/cache.js';

const QUERY_CACHE = {
	search: new Cache({ allowOverwrite: true, limit: 100 }),
	album: new Cache({ allowOverwrite: true, limit: 100 })
};

const URL_CACHE = {
	search: new Cache({ allowOverwrite: true, limit: 100 }),
	download: new Cache({ allowOverwrite: true, limit: 100 }),
	album: new Cache({ allowOverwrite: true, limit: 100 })
};

const SERVERS = {
	squid: {
		subdomain: ['kraken', 'shiva', 'triton', 'aether', 'zeus', 'chaos', 'phoenix'],
		tld: 'wtf'
	},
	monochrome: {
		subdomain: ['ohio', 'virginia', 'frankfurt', 'singapore', 'tokyo'],
		tld: 'tf'
	}
};

const buildUrls = (path, params) => {
	return Object.entries(SERVERS).flatMap(([domain, { subdomain, tld }]) =>
		subdomain.map((sub) => `https://${sub}.${domain}.${tld}/${path}/?${params}`)
	);
};

const getDomains = (type, value) => {
	if (URL_CACHE[type].has(value)) {
		return URL_CACHE[type].get(value);
	}

	value = Object.keys(value)
		.map((k) => `${k}=${value[k]}`)
		.join('&');

	const urls =
		type === 'search'
			? buildUrls('search', value)
			: type === 'download'
				? buildUrls('track', value)
				: type === 'album'
					? buildUrls('album', value)
					: null;

	if (!urls) {
		throw new Error('Invalid type');
	}

	URL_CACHE[type].set(value, urls);
	return urls;
};

class Dab {
	async toJson(response) {
		try {
			return await response.json();
		} catch {
			return null;
		}
	}

	async tryFetch(domains) {
		for (const url of domains) {
			try {
				const res = await fetch(url);
				const data = await this.toJson(res);

				if (data?.detail === 'Too Many Requests') {
					continue;
				}

				if (!data) {
					continue;
				}

				return { data, domain: url };
			} catch {
				continue;
			}
		}

		return { error: 'Too Many Requests. Try again later.' };
	}

	async search(query, type = 'track') {
		if (!query) {
			throw new Error('Query is required');
		}

		if (QUERY_CACHE.search.has(query)) {
			return QUERY_CACHE.search.get(query);
		}

		const container =
			type === 'track' ? { type: 'search', params: { s: query, li: 50 } } : { type: 'albums', params: { al: query } };

		const domains = getDomains('search', container.params, type);

		const { error, data } = await this.tryFetch(domains);

		if (error) {
			return error;
		}

		QUERY_CACHE.search.set(query + '-' + container.type, data);

		return data;
	}

	async download(id) {
		if (!id) {
			throw new Error('ID is required');
		}

		const domains = getDomains('download', { id });

		const { error, data, domain } = await this.tryFetch(domains);

		if (error) {
			return error;
		}

		let file, track, original;

		for (const v of data) {
			if (!file && v.trackId) {
				file = v;
			}

			if (!track && v.id && v.title) {
				track = v;
			}

			if (!original && v.OriginalTrackUrl) {
				original = v.OriginalTrackUrl;
			}

			if (file && track && original) {
				break;
			}
		}

		return {
			file,
			track,
			url: original,
			cover: track ? this.stringToCover(track.album.cover) : null,
			domain: new URL(domain).host
		};
	}

	async getAlbum(id) {
		if (!id) {
			throw new Error('ID is required');
		}

		if (QUERY_CACHE.album.has(id)) {
			return QUERY_CACHE.album.get(id);
		}

		const domains = getDomains('album', { id });

		const { error, data } = await this.tryFetch(domains);

		if (error) {
			return error;
		}

		QUERY_CACHE.album.set(id, data);

		return data;
	}

	stringToCover(id) {
		return `https://resources.tidal.com/images/${id.replace(/-/g, '/')}/1280x1280.jpg`;
	}
}

export const dab = new Dab();
