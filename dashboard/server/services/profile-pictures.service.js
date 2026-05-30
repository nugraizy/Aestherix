import { Vibrant } from 'node-vibrant/node';
import os from 'os';

import {
	listPinterestProfilePictures,
	setPinterestProfilePictureColorPalette,
	upsertPinterestProfilePictures
} from '../../../src/helper/database/adapters/pinterest-profile-pictures.js';
import { color, loggers } from '../../../src/utils/modules/index.js';
import {
	getSafeHttpUrl,
	hexToRgb,
	normalizeDashboardPicture,
	normalizePersistedPictureEntry,
	rgbDistance,
	rgbToHex
} from '../lib/images.js';

export const PROFILE_PICTURE_HISTORY_LIMIT = 900;
export const PROFILE_PICTURES_DB_SYNC_THROTTLE_MS = 1000;
export const PROFILE_PICTURES_LIST_TTL_MS = 5000;
export const PROFILE_PICTURES_COLOR_TOLERANCE_DEFAULT = 88;
export const PROFILE_PICTURES_COLOR_TOLERANCE_MAX = 441;
export const PROFILE_PICTURES_COLOR_FILTER_CONCURRENCY = Math.min(
	12,
	Math.max(4, Number(os.availableParallelism?.() || os.cpus()?.length || 6))
);
export const PROFILE_PICTURE_COLOR_CACHE_LIMIT = 1500;

async function mapWithConcurrency(items, mapper, { concurrency = PROFILE_PICTURES_COLOR_FILTER_CONCURRENCY } = {}) {
	const safeConcurrency = Math.max(1, Number(concurrency || PROFILE_PICTURES_COLOR_FILTER_CONCURRENCY));
	const input = Array.isArray(items) ? items : [];
	const results = new Array(input.length);
	let index = 0;

	const worker = async () => {
		while (index < input.length) {
			const currentIndex = index;

			index += 1;
			results[currentIndex] = await mapper(input[currentIndex], currentIndex);
		}
	};

	const workers = Array.from({ length: Math.min(safeConcurrency, input.length) }, () => worker());

	await Promise.all(workers);

	return results;
}

export function createProfilePicturesService({ configuration, prisma } = {}) {
	if (!configuration) {
		throw new Error('profile-pictures.service: configuration is required');
	}

	if (!prisma) {
		throw new Error('profile-pictures.service: prisma is required');
	}

	const dbState = { lastSyncAt: 0 };
	const tombstones = new Set();
	const colorCache = new Map();
	const colorPending = new Map();
	const listCache = { data: null, fetchedAt: 0, inFlight: null };

	function ensureMap() {
		if (!configuration.pinterest) {
			configuration.pinterest = {};
		}

		if (!configuration.pinterest.images || typeof configuration.pinterest.images.entries !== 'function') {
			configuration.pinterest.images = new Map();
		}

		return configuration.pinterest.images;
	}

	function findTimestampForUrl(url) {
		const target = String(url || '')
			.trim()
			.toLowerCase();

		if (!target) {
			return '';
		}

		const map = ensureMap();

		for (const [timestamp, value] of map.entries()) {
			const normalized = normalizeDashboardPicture(value);
			const candidate = String(normalized?.original?.url || '')
				.trim()
				.toLowerCase();

			if (candidate === target) {
				return String(timestamp);
			}
		}

		return '';
	}

	async function hydrate() {
		const map = ensureMap();

		map.clear?.();

		try {
			const entries = await listPinterestProfilePictures(prisma, {});

			for (const entry of entries) {
				const timestamp = String(entry?.timestamp || '').trim();
				const normalized = normalizePersistedPictureEntry(entry);

				if (!timestamp || !normalized) {
					continue;
				}

				if (tombstones.has(timestamp)) {
					continue;
				}

				map.set(timestamp, normalized);

				const cachedPalette = Array.isArray(entry?.colorPalette) ? entry.colorPalette : [];
				const cachedRgbs = cachedPalette.map((hex) => hexToRgb(hex)).filter((rgb) => rgb && Number.isFinite(rgb.r));

				if (cachedRgbs.length) {
					const url = normalized?.original?.url;

					if (url) {
						const cacheKey = String(url).toLowerCase();
						const primary = cachedRgbs[0];

						setColorCache(cacheKey, {
							hex: rgbToHex(primary),
							rgb: primary,
							palette: cachedRgbs
						});
					}
				}
			}

			dbState.lastSyncAt = Date.now();
		} catch (error) {
			loggers.warning(color('Failed hydrating dashboard profile pictures:', 'red'), color(error.message, 'white'));
		}
	}

	async function refreshFromDb({ force = false } = {}) {
		const now = Date.now();

		if (!force && now - dbState.lastSyncAt < PROFILE_PICTURES_DB_SYNC_THROTTLE_MS) {
			return;
		}

		await hydrate();
	}

	function setColorCache(cacheKey, payload) {
		if (!cacheKey || !payload) {
			return;
		}

		if (colorCache.has(cacheKey)) {
			colorCache.delete(cacheKey);
		}

		colorCache.set(cacheKey, payload);

		if (colorCache.size <= PROFILE_PICTURE_COLOR_CACHE_LIMIT) {
			return;
		}

		const oldestKey = colorCache.keys().next().value;

		if (oldestKey) {
			colorCache.delete(oldestKey);
		}
	}

	async function getDominantColor(url) {
		const normalizedUrl = getSafeHttpUrl(url);

		if (!normalizedUrl) {
			return null;
		}

		const cacheKey = normalizedUrl.toLowerCase();
		const cached = colorCache.get(cacheKey);

		if (cached) {
			return cached;
		}

		const pending = colorPending.get(cacheKey);

		if (pending) {
			return pending;
		}

		const task = (async () => {
			try {
				const palette = await Vibrant.from(normalizedUrl).quality(10).getPalette();
				const swatches = ['Vibrant', 'LightVibrant', 'DarkVibrant', 'Muted', 'LightMuted', 'DarkMuted']
					.map((name) => palette[name])
					.filter((swatch) => Array.isArray(swatch?.rgb));

				if (!swatches.length) {
					return null;
				}

				const palette6 = swatches.map((swatch) => ({
					r: Math.round(Number(swatch.rgb[0] || 0)),
					g: Math.round(Number(swatch.rgb[1] || 0)),
					b: Math.round(Number(swatch.rgb[2] || 0))
				}));
				const primary = palette6[0];
				const payload = {
					hex: rgbToHex(primary),
					rgb: primary,
					palette: palette6
				};

				setColorCache(cacheKey, payload);

				const timestamp = findTimestampForUrl(normalizedUrl);

				if (timestamp) {
					const hexes = palette6.map((swatch) => rgbToHex(swatch));

					void setPinterestProfilePictureColorPalette(prisma, timestamp, hexes).catch(() => {});
				}

				return payload;
			} catch {
				return null;
			} finally {
				colorPending.delete(cacheKey);
			}
		})();

		colorPending.set(cacheKey, task);

		return task;
	}

	async function filterByColor(pictures, { colorHex, tolerance } = {}) {
		const target = hexToRgb(colorHex);

		if (!target) {
			return Array.isArray(pictures) ? pictures : [];
		}

		const safeTolerance = Math.max(
			0,
			Math.min(PROFILE_PICTURES_COLOR_TOLERANCE_MAX, Number(tolerance || PROFILE_PICTURES_COLOR_TOLERANCE_DEFAULT))
		);
		const source = Array.isArray(pictures) ? pictures : [];

		return source.filter((picture) => {
			const palette =
				Array.isArray(picture.colorPalette) && picture.colorPalette.length > 0
					? picture.colorPalette.map((hex) => hexToRgb(hex)).filter((rgb) => rgb && Number.isFinite(rgb.r))
					: null;

			if (!palette || !palette.length) {
				return false;
			}

			const closest = palette.reduce((min, rgb) => {
				const distance = rgbDistance(target, rgb);

				return distance < min ? distance : min;
			}, Number.POSITIVE_INFINITY);

			return closest <= safeTolerance;
		});
	}

	async function loadList() {
		const rows = await listPinterestProfilePictures(prisma, {});
		const seenUrls = new Set();

		return rows
			.map((row) => {
				const timestamp = String(row?.timestamp || '').trim();

				if (!timestamp || tombstones.has(timestamp)) {
					return null;
				}

				const normalized = normalizePersistedPictureEntry(row);

				if (!normalized) {
					return null;
				}

				return {
					timestamp,
					url: normalized.original.url,
					thumbnail: normalized.thumbnail.url,
					colorPalette: normalized.colorPalette || null
				};
			})
			.filter(Boolean)
			.reverse()
			.filter((picture) => {
				const dedupeKey = picture.url.toLowerCase();

				if (seenUrls.has(dedupeKey)) {
					return false;
				}

				seenUrls.add(dedupeKey);
				return true;
			});
	}

	function refreshList() {
		if (!listCache.inFlight) {
			listCache.inFlight = loadList()
				.then((data) => {
					listCache.data = data;
					listCache.fetchedAt = Date.now();
					return data;
				})
				.finally(() => {
					listCache.inFlight = null;
				});
		}

		return listCache.inFlight;
	}

	function prependCached(picture) {
		if (!picture?.url || !listCache.data) {
			return;
		}

		const key = String(picture.url).toLowerCase();

		if (listCache.data.some((item) => String(item.url).toLowerCase() === key)) {
			return;
		}

		listCache.data = [picture, ...listCache.data];
		listCache.fetchedAt = Date.now();
	}

	async function list({ limit } = {}) {
		const isFresh = listCache.data && Date.now() - listCache.fetchedAt < PROFILE_PICTURES_LIST_TTL_MS;

		if (!isFresh) {
			if (listCache.data) {
				// Background revalidation: keep serving the cached snapshot if it fails.
				refreshList().catch(() => {});
			} else {
				await refreshList();
			}
		}

		const safeLimit = Number(limit) > 0 ? Number(limit) : 0;

		return safeLimit ? listCache.data.slice(0, safeLimit) : listCache.data;
	}

	async function getLatest() {
		const [latest] = await listPinterestProfilePictures(prisma, { limit: 1 });

		return latest || null;
	}

	async function persist() {
		const map = ensureMap();
		const seenUrls = new Set();
		const entries = Array.from(map.entries())
			.map(([timestamp, value]) => {
				const normalized = normalizeDashboardPicture(value);

				if (!normalized) {
					return null;
				}

				return {
					timestamp: String(timestamp || '').trim(),
					url: normalized.original.url,
					thumbnail: normalized.thumbnail.url
				};
			})
			.filter((entry) => entry && entry.timestamp && /^https?:\/\//i.test(entry.url))
			.reverse()
			.filter((entry) => {
				const dedupeKey = entry.url.toLowerCase();

				if (seenUrls.has(dedupeKey)) {
					return false;
				}

				seenUrls.add(dedupeKey);
				return true;
			})
			.reverse()
			.slice(-PROFILE_PICTURE_HISTORY_LIMIT);

		await upsertPinterestProfilePictures(prisma, entries);
		dbState.lastSyncAt = Date.now();
	}

	async function deletePicture({ timestamp = '', url = '' } = {}) {
		const safeTimestamp = String(timestamp || '').trim();
		const safeUrl = String(url || '').trim();

		if (!safeTimestamp || !/^https?:\/\//i.test(safeUrl)) {
			return { ok: false, message: 'Invalid profile picture payload.' };
		}

		const safeUrlKey = safeUrl.toLowerCase();
		const rows = await prisma.pinterestProfilePicture.findMany({
			where: {
				OR: [{ timestamp: safeTimestamp }, { url: safeUrl }]
			}
		});

		const matching = rows.filter((row) => {
			return row.timestamp === safeTimestamp || String(row.url).toLowerCase() === safeUrlKey;
		});

		if (!matching.length) {
			return { ok: false, message: 'Profile picture not found.' };
		}

		const map = ensureMap();
		const deletedTimestamps = matching.map((row) => String(row.timestamp));

		for (const ts of deletedTimestamps) {
			map.delete?.(ts);
			tombstones.add(ts);
		}

		await Promise.all(
			deletedTimestamps.map((ts) => prisma.pinterestProfilePicture.delete({ where: { timestamp: ts } }).catch(() => {}))
		);

		if (listCache.data) {
			const removed = new Set(deletedTimestamps);

			listCache.data = listCache.data.filter(
				(picture) => !removed.has(String(picture.timestamp)) && String(picture.url).toLowerCase() !== safeUrlKey
			);
		}

		return { ok: true, deletedCount: deletedTimestamps.length };
	}

	return {
		hydrate,
		refreshFromDb,
		list,
		filterByColor,
		getLatest,
		persist,
		delete: deletePicture,
		getDominantColor,
		prependCached
	};
}
