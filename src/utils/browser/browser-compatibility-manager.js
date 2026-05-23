import { lookup as dnsLookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { brotliDecompressSync, gunzipSync, inflateSync } from 'node:zlib';
import { Agent, Headers, Response, fetch } from 'undici';

class FallbackDns {
	static cacheTtlMs = 5 * 60 * 1000;
	static dohTimeoutMs = 5000;
	static cache = new Map();
	static dohEndpoints = [
		'https://1.1.1.1/dns-query',
		'https://1.0.0.1/dns-query',
		'https://8.8.8.8/resolve',
		'https://8.8.4.4/resolve'
	];

	static async resolve(hostname) {
		const cached = FallbackDns.cache.get(hostname);
		const now = Date.now();

		if (cached && cached.expiresAt > now && cached.addresses.length) {
			return cached.addresses;
		}

		if (isIP(hostname)) {
			const family = isIP(hostname) === 6 ? 6 : 4;

			return [{ address: hostname, family }];
		}

		let systemError = null;

		try {
			const system = await dnsLookup(hostname, { all: true });

			if (system?.length) {
				FallbackDns.cache.set(hostname, { addresses: system, expiresAt: now + FallbackDns.cacheTtlMs });
				return system;
			}

			throw new Error(`System DNS returned empty result for ${hostname}`);
		} catch (error) {
			systemError = error;
		}

		const doh = await FallbackDns.dohLookup(hostname);

		if (doh.length) {
			FallbackDns.cache.set(hostname, { addresses: doh, expiresAt: now + FallbackDns.cacheTtlMs });
			return doh;
		}

		throw systemError || new Error(`DNS lookup failed for ${hostname}`);
	}

	static async dohLookup(hostname) {
		const merged = [];

		for (const endpoint of FallbackDns.dohEndpoints) {
			for (const type of ['A', 'AAAA']) {
				const url = `${endpoint}?name=${encodeURIComponent(hostname)}&type=${type}`;
				const response = await FallbackDns.fetchDoH(url).catch(() => null);
				const json = response ? await response.json().catch(() => null) : null;
				const answers = Array.isArray(json?.Answer) ? json.Answer : [];

				for (const answer of answers) {
					const data = answer?.data;
					const family = isIP(data) === 6 ? 6 : isIP(data) === 4 ? 4 : 0;

					if (family) {
						merged.push({ address: data, family });
					}
				}

				if (merged.length) {
					return merged;
				}
			}
		}

		return merged;
	}

	static async fetchDoH(url) {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), FallbackDns.dohTimeoutMs);

		try {
			return await fetch(url, {
				headers: {
					Accept: 'application/dns-json',
					'User-Agent': 'Aestherix/1.0'
				},
				signal: controller.signal
			});
		} finally {
			clearTimeout(timer);
		}
	}

	static createLookup() {
		return (hostname, options, callback) => {
			FallbackDns.resolve(hostname)
				.then((addresses) => {
					if (options?.all) {
						callback(null, addresses);
						return;
					}

					const first = addresses[0];

					callback(null, first.address, first.family);
				})
				.catch((error) => callback(error));
		};
	}
}

class BrowserCompatibilityManager {
	static defaultHeaders = {
		'Accept-Encoding': 'gzip, deflate, br',
		'Accept-Language': 'en-US,en;q=0.9',
		'Cache-Control': 'no-cache',
		Pragma: 'no-cache',
		'User-Agent':
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
	};

	static createDispatcher({ connectTimeoutMs = 30000, headersTimeoutMs = 60000, bodyTimeoutMs = 60000 } = {}) {
		return new Agent({
			connectTimeout: connectTimeoutMs,
			headersTimeout: headersTimeoutMs,
			bodyTimeout: bodyTimeoutMs,
			connect: {
				lookup: FallbackDns.createLookup()
			}
		});
	}

	static createFetch({ dispatcher, headers = {}, decompress = true, ...timeouts } = {}) {
		const activeDispatcher = dispatcher || BrowserCompatibilityManager.createDispatcher(timeouts);
		const baseHeaders = { ...BrowserCompatibilityManager.defaultHeaders, ...headers };

		return async (url, init = {}) => {
			const merged = new Headers(baseHeaders);

			if (init.headers) {
				const initHeaders = new Headers(init.headers);

				initHeaders.forEach((value, key) => {
					merged.set(key, value);
				});
			}

			const response = await fetch(url, {
				...init,
				headers: merged,
				dispatcher: activeDispatcher
			});

			if (!decompress) {
				return response;
			}

			return BrowserCompatibilityManager.decompressResponse(response);
		};
	}

	static async decompressResponse(response) {
		const encoding = response.headers.get('content-encoding') || '';

		if (!encoding) {
			return response;
		}

		const buffer = Buffer.from(await response.arrayBuffer());
		let decoded = buffer;
		let shouldStripEncoding = false;

		try {
			if (encoding.toLowerCase() === 'br') {
				decoded = brotliDecompressSync(buffer);
				shouldStripEncoding = true;
			} else if (encoding.toLowerCase() === 'gzip') {
				decoded = gunzipSync(buffer);
				shouldStripEncoding = true;
			} else if (encoding.toLowerCase() === 'deflate') {
				decoded = inflateSync(buffer);
				shouldStripEncoding = true;
			}
		} catch {
			decoded = buffer;
			shouldStripEncoding = false;
		}

		const nextHeaders = new Headers(response.headers);

		if (shouldStripEncoding) {
			nextHeaders.delete('content-encoding');
		}

		return new Response(decoded, {
			status: response.status,
			statusText: response.statusText,
			headers: nextHeaders
		});
	}
}

export { BrowserCompatibilityManager };
