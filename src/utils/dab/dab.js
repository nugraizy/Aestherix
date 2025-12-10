import { fetch } from 'undici';

import { Cache } from '../../helper/modules/cache.js';
import { decodeManifestBase64 } from './utils/decode.js';

const QUERY_CACHE = {
	search: new Cache({ allowOverwrite: true, limit: 100 }),
	album: new Cache({ allowOverwrite: true, limit: 100 })
};

const URL_CACHE = {
	search: new Cache({ allowOverwrite: true, limit: 100 }),
	download: new Cache({ allowOverwrite: true, limit: 100 }),
	album: new Cache({ allowOverwrite: true, limit: 100 }),
	info: new Cache({ allowOverwrite: true, limit: 100 })
};

const SERVERS = {
	squid: {
		subdomains: ['aether', 'chaos', 'kraken', 'phoenix', 'shiva', 'triton', 'zeus'],
		tld: 'wtf'
	},
	monochrome: {
		subdomains: ['california', 'frankfurt', 'jakarta', 'london', 'ohio', 'oregon', 'singapore', 'tokyo', 'virginia'],
		tld: 'tf'
	},
	qqdl: {
		subdomains: ['hund', 'katze', 'maus', 'vogel', 'wolf'],
		tld: 'site'
	},
	prigoana: {
		subdomains: ['hifi'],
		tld: 'com'
	}
};

const buildUrls = (path, params) =>
	Object.entries(SERVERS).flatMap(([domain, { subdomains, tld }]) =>
		subdomains.map((sub) => `https://${sub}.${domain}.${tld}/${path}/?${params}`)
	);

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
					: type === 'info'
						? buildUrls('info', value)
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

	async tryFetch(domains, config = {}) {
		for (const url of domains) {
			try {
				const res = await fetch(url, config);

				if (!res.ok) {
					continue;
				}

				const data = await this.toJson(res);

				if (!data || !data.data) {
					continue;
				}

				if (data?.detail === 'Too Many Requests') {
					continue;
				}

				if (data?.error) {
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

		const container = type === 'track' ? { params: { s: query, li: 50 } } : { params: { al: query } };

		const domains = getDomains('search', container.params);

		let { error, data } = await this.tryFetch(domains);

		if (error) {
			return error;
		}

		if (data.error) {
			return data;
		}

		data = data.data;

		QUERY_CACHE.search.set(query + '-' + container.type, data);

		return data;
	}

	async download(id) {
		if (!id) {
			throw new Error('ID is required');
		}

		const domainsDownload = getDomains('download', { id, quality: 'LOSSLESS' });
		const domainsInfo = getDomains('info', { id });

		const { error, data, domain } = await this.tryFetch(domainsDownload, {
			headers: {
				'x-client': 'BiniLossless/v3.2'
			}
		});

		const info = await this.tryFetch(domainsInfo, {
			headers: {
				'x-client': 'BiniLossless/v3.2'
			}
		});

		if (error) {
			return error;
		}

		if (data.error) {
			return data;
		}

		let file = data.data,
			track = info.data.data,
			original = JSON.parse(decodeManifestBase64(data.data.manifest))?.urls?.[0] || null;

		if (!original) {
			throw new Error('Could not retrieve original track URL');
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

		let { error, data } = await this.tryFetch(domains);

		if (error) {
			return error;
		}

		if (data.error) {
			return data;
		}

		data = data.data;

		QUERY_CACHE.album.set(id, data);

		return data;
	}

	stringToCover(id) {
		return `https://resources.tidal.com/images/${id.replace(/-/g, '/')}/1280x1280.jpg`;
	}
}

export const dab = new Dab();
