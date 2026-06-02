import fs from 'fs/promises';
import path from 'path';

const DEFAULT_CACHE_PATH = 'data/solver-cache.json';
const DEFAULT_HISTORY_PATH = 'data/solver-history.json';
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_HISTORY_ENTRIES = 500;

export function createSolverCacheService({ cachePath = DEFAULT_CACHE_PATH, historyPath = DEFAULT_HISTORY_PATH } = {}) {
	let cache = new Map();
	let history = [];

	function makeKey(service, url) {
		try {
			const origin = new URL(url).origin;

			return `${service}:${origin}`;
		} catch {
			return `${service}:${url}`;
		}
	}

	async function load() {
		try {
			const raw = await fs.readFile(cachePath, 'utf-8');
			const entries = JSON.parse(raw);

			if (entries && typeof entries === 'object') {
				for (const [key, value] of Object.entries(entries)) {
					cache.set(key, value);
				}
			}
		} catch {
			// file may not exist yet
		}

		try {
			const raw = await fs.readFile(historyPath, 'utf-8');
			const entries = JSON.parse(raw);

			if (Array.isArray(entries)) {
				history = entries;
			}
		} catch {
			// file may not exist yet
		}
	}

	async function save() {
		const dir = path.dirname(cachePath);

		await fs.mkdir(dir, { recursive: true });

		const entries = Object.fromEntries(cache);

		await fs.writeFile(cachePath, JSON.stringify(entries, null, 2));
	}

	async function saveHistory() {
		const dir = path.dirname(historyPath);

		await fs.mkdir(dir, { recursive: true });
		await fs.writeFile(historyPath, JSON.stringify(history, null, 2));
	}

	async function getCookies(service, url) {
		const key = makeKey(service, url);
		const entry = cache.get(key);

		if (!entry) {
			return null;
		}

		if (Date.now() > entry.expiresAt) {
			cache.delete(key);
			await save();
			return null;
		}

		return entry;
	}

	async function saveCookies(service, url, cookies, headers, ttlMs = DEFAULT_TTL_MS) {
		const key = makeKey(service, url);

		cache.set(key, {
			cookies,
			headers,
			service,
			url,
			savedAt: Date.now(),
			expiresAt: Date.now() + ttlMs
		});

		await save();
	}

	function addHistoryEntry(entry) {
		history.unshift(entry);

		if (history.length > MAX_HISTORY_ENTRIES) {
			history = history.slice(0, MAX_HISTORY_ENTRIES);
		}

		void saveHistory();
	}

	function getHistory({ limit = 50, status, service } = {}) {
		let filtered = history;

		if (status) {
			filtered = filtered.filter((e) => e.status === status);
		}

		if (service) {
			filtered = filtered.filter((e) => e.service === service);
		}

		return filtered.slice(0, limit);
	}

	return { load, save, getCookies, saveCookies, addHistoryEntry, getHistory };
}
