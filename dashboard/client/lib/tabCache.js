import { writable, get } from 'svelte/store';

const STALE_MS = 60_000;

const cache = writable({});

export function getCached(tab) {
	return get(cache)[tab] ?? null;
}

export function setCached(tab, data) {
	cache.update(c => ({
		...c,
		[tab]: { data, loadedAt: Date.now(), loading: false, error: null }
	}));
}

export function clearCached(tab) {
	if (tab) {
		cache.update(c => { const next = { ...c }; delete next[tab]; return next; });
	} else {
		cache.set({});
	}
}

export function isStale(tab) {
	const entry = get(cache)[tab];
	if (!entry) return true;
	return Date.now() - entry.loadedAt >= STALE_MS;
}

export function hasCache(tab) {
	return !!get(cache)[tab];
}
