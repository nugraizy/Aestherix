/**
 * @module i18n
 *
 * @typedef {import('./types.d.ts').LocaleKey} LocaleKey
 * @typedef {import('./types.d.ts').LocaleProxy} LocaleProxy
 * @typedef {import('./types.d.ts').LanguageEntry} LanguageEntry
 * @typedef {import('./types.d.ts').CommonStrings} CommonStrings
 * @typedef {import('./types.d.ts').NamespaceMap} NamespaceMap
 */

import { Cache } from '../modules/cache.js';
import prisma from '../database/prisma.js';
import { updateGroupSetting, getGroupSettings } from '../database/adapters/group-settings.js';

const DEFAULT_FALLBACK_LOCALE = 'id';

const tables = Object.create(null);

const localeByRoom = new Cache();
const localeByUser = new Cache();

let defaultLocale = DEFAULT_FALLBACK_LOCALE;

const deepMerge = (target, source) => {
	const out = { ...target };

	for (const [key, value] of Object.entries(source)) {
		if (value && typeof value === 'object' && !Array.isArray(value)) {
			out[key] = deepMerge(out[key] ?? {}, value);
		} else {
			out[key] = value;
		}
	}

	return out;
};

const resolveKey = (locale, key) => {
	const localeTable = tables[locale];

	if (!localeTable) {
		return undefined;
	}

	const segments = key.split('.');

	if (segments.length < 2) {
		return undefined;
	}

	const [namespace, ...rest] = segments;
	let node = localeTable[namespace];

	for (const segment of rest) {
		if (node === null || node === undefined || typeof node !== 'object') {
			return undefined;
		}

		node = node[segment];
	}

	return node;
};

const interpolate = (template, vars) => {
	if (vars === undefined || vars === null) {
		return template;
	}

	return template.replace(/\{(\w+)\}/g, (match, token) => {
		if (Array.isArray(vars)) {
			const index = Number(token);

			if (Number.isInteger(index) && index >= 0 && index < vars.length) {
				return String(vars[index] ?? '');
			}

			return match;
		}

		if (typeof vars === 'object' && token in vars) {
			return String(vars[token] ?? '');
		}

		return match;
	});
};

/**
 * Set the default/fallback locale used when a key is missing in the requested locale.
 *
 * @param {string} locale - ISO locale code (e.g. "id", "en")
 */
export const setDefaultLocale = (locale) => {
	if (typeof locale !== 'string' || locale.length === 0) {
		return;
	}

	defaultLocale = locale;
};

/**
 * Get the current default/fallback locale.
 *
 * @returns {string} ISO locale code
 */
export const getDefaultLocale = () => defaultLocale;

/**
 * List all locales that have at least one registered namespace.
 *
 * @returns {string[]} Array of ISO locale codes
 */
export const listLocales = () => Object.keys(tables);

/**
 * Get the locale assigned to a room (group/chat).
 * Checks memory cache first, then DB, then falls back to default locale.
 *
 * @param {string} roomId - Room/group JID
 * @returns {Promise<string>} ISO locale code
 */
export const getLocale = async (roomId, userId) => {
	if (!roomId && !userId) {
		return defaultLocale;
	}

	if (roomId) {
		const roomCached = localeByRoom.get(roomId);

		if (roomCached) {
			return roomCached;
		}

		try {
			const settings = await getGroupSettings(prisma, roomId);

			if (settings?.locale) {
				localeByRoom.set(roomId, settings.locale);
				return settings.locale;
			}
		} catch { /* DB unavailable */ }
	}

	const effectiveUserId = userId || roomId;

	if (effectiveUserId) {
		const userCached = localeByUser.get(effectiveUserId);

		if (userCached) {
			return userCached;
		}

		try {
			const data = await prisma.userLocale.findUnique({ where: { jid: effectiveUserId } });

			if (data?.locale) {
				localeByUser.set(effectiveUserId, data.locale);
				return data.locale;
			}
		} catch { /* DB unavailable */ }
	}

	return defaultLocale;
};

/**
 * Set or clear the locale for a room (group/chat).
 * Persists to DB and updates memory cache.
 * Pass `null` or `undefined` to reset to the default locale.
 *
 * @param {string} roomId - Room/group JID
 * @param {string|null|undefined} locale - ISO locale code, or null/undefined to reset
 * @returns {Promise<void>}
 */
export const setLocale = async (roomId, locale) => {
	if (!roomId) {
		return;
	}

	if (!locale) {
		localeByRoom.delete(roomId);

		try {
			await updateGroupSetting(prisma, roomId, 'locale', null);
		} catch {
			// DB unavailable, memory cache is already cleared
		}

		return;
	}

	localeByRoom.set(roomId, locale);

	try {
		await updateGroupSetting(prisma, roomId, 'locale', locale);
	} catch {
		// DB unavailable, memory cache is already set
	}
};

export const setUserLocale = async (userId, locale) => {
	if (!userId) {
		return;
	}

	if (!locale) {
		localeByUser.delete(userId);

		try {
			await prisma.userLocale.delete({ where: { jid: userId } }).catch(() => {});
		} catch { /* DB unavailable */ }

		return;
	}

	localeByUser.set(userId, locale);

	try {
		await prisma.userLocale.upsert({
			where: { jid: userId },
			update: { locale },
			create: { jid: userId, locale }
		});
	} catch { /* DB unavailable, memory cache is already set */ }
};

/**
 * Register or deep-merge a namespace string table for a locale.
 * Call this once at boot (or on demand) to make strings available via `t()` or `useLocale()`.
 *
 * @example
 *   registerNamespace('common', 'id', { errors: { noQuery: 'Masukkan query.' } });
 *   registerNamespace('common', 'en', { errors: { noQuery: 'Please provide a query.' } });
 *
 * @param {string} namespace - Namespace name (e.g. "common", "werewolf")
 * @param {string} locale - ISO locale code (e.g. "id", "en")
 * @param {Record<string, unknown>} table - Nested key-value string table
 * @throws {TypeError} If namespace, locale, or table is invalid
 */
export const registerNamespace = (namespace, locale, table) => {
	if (typeof namespace !== 'string' || namespace.length === 0) {
		throw new TypeError('registerNamespace: namespace must be a non-empty string');
	}

	if (typeof locale !== 'string' || locale.length === 0) {
		throw new TypeError('registerNamespace: locale must be a non-empty string');
	}

	if (!table || typeof table !== 'object') {
		throw new TypeError('registerNamespace: table must be an object');
	}

	if (!tables[locale]) {
		tables[locale] = Object.create(null);
	}

	const existing = tables[locale][namespace] ?? Object.create(null);

	tables[locale][namespace] = deepMerge(existing, table);
};

/**
 * Translate a dotted key with optional variable interpolation.
 *
 * Lookup order:
 *   1. `tables[locale][namespace][...path]`
 *   2. `tables[defaultLocale][namespace][...path]` (fallback)
 *   3. Returns `key` itself (so missing keys are visible in output)
 *
 * @example
 *   t('id', 'common.errors.noQuery')                        // "Masukkan query."
 *   t('id', 'common.cooldown', [5])                         // "Tunggu 5 detik..."
 *   t('id', 'common.errors.missingArgs', ['!help'])         // "Argumen kurang. Contoh: !help"
 *   t('id', 'common.errors.missingArgs', { 0: '!help' })   // same result
 *
 * @param {string} locale - ISO locale code (e.g. "id", "en")
 * @param {LocaleKey} key - Dotted path, first segment is the namespace (e.g. "common.errors.noQuery")
 * @param {Record<string, unknown> | unknown[]} [vars] - Variables for `{placeholder}` interpolation
 * @param {{rng?: () => number}} [options] - Custom RNG for array picks (default: Math.random)
 * @returns {string} Translated (and interpolated) string, or the key itself if not found
 */
export const t = (locale, key, vars, options) => {
	if (typeof key !== 'string' || key.length === 0) {
		return '';
	}

	const resolved = resolveKey(locale, key) ?? resolveKey('en', key) ?? resolveKey(defaultLocale, key);

	const raw = resolved === undefined ? key : resolved;

	const rng = options?.rng ?? Math.random;

	const picked = Array.isArray(raw) ? raw[Math.floor(rng() * raw.length)] : raw;

	if (typeof picked !== 'string') {
		return String(picked ?? key);
	}

	return interpolate(picked, vars);
};

/**
 * Check if a key is directly defined in the given locale (no fallback).
 *
 * @param {string} locale - ISO locale code
 * @param {LocaleKey} key - Dotted path (e.g. "common.errors.noQuery")
 * @returns {boolean} `true` if the key exists in the locale's table
 */
export const hasKey = (locale, key) => resolveKey(locale, key) !== undefined;

/**
 * Returns a proxy for ergonomic property access to translations.
 *
 * Leaf nodes (strings) are returned as-is — ready for `client.reply()`, `console.log()`, etc.
 * Object nodes return a proxy for further chaining.
 *
 * @example
 *   const L = useLocale('id', 'common');
 *
 *   // Returns the actual string — no wrapping needed
 *   client.reply(from, L.errors.groupOnly, message);
 *   console.log(L.success.loading); // "Memuat..."
 *
 *   // For interpolation, use t() or template literals
 *   t(locale, 'common.cooldown', [5])
 *   `${L.errors.missingArgs}`.replace('{0}', '!help')
 *
 * @template {keyof NamespaceMap} N
 * @param {string} locale - ISO locale code (e.g. "id", "en")
 * @param {N} namespace - Namespace registered via `registerNamespace`
 * @param {Record<string, unknown> | unknown[]} [vars] - Variables for `{placeholder}` interpolation on all leaf strings
 * @returns {LocaleProxy & NamespaceMap[N]} Proxy that resolves to strings at leaf nodes
 */
export const useLocale = (locale, namespace, vars) => {
	const buildProxy = (path = '') => {
		return new Proxy(Object.create(null), {
			get(_target, prop) {
				if (typeof prop === 'symbol') {
					return undefined;
				}

				const nextPath = path ? `${path}.${prop}` : prop;
				const key = `${namespace}.${nextPath}`;
				const resolved = resolveKey(locale, key) ?? resolveKey(defaultLocale, key);

				if (resolved === undefined) {
					return buildProxy(nextPath);
				}

				if (typeof resolved === 'string') {
					return vars ? interpolate(resolved, vars) : resolved;
				}

				if (Array.isArray(resolved)) {
					return resolved;
				}

				return buildProxy(nextPath);
			}
		});
	};

	return buildProxy();
};

/**
 * Synchronous locale lookup — checks memory caches only, no DB.
 * Returns `null` if not cached (caller should fall back to default).
 *
 * @param {string} roomId - Room/group JID
 * @param {string} [userId] - User JID
 * @returns {string|null} ISO locale code, or null if not cached
 */
export const getLocaleSync = (roomId, userId) => {
	if (roomId) {
		const roomCached = localeByRoom.get(roomId);

		if (roomCached) {
			return roomCached;
		}
	}

	const effectiveUserId = userId || roomId;

	if (effectiveUserId) {
		const userCached = localeByUser.get(effectiveUserId);

		if (userCached) {
			return userCached;
		}
	}

	return null;
};

/**
 * Warm the locale cache from DB on boot. Call this once at startup.
 *
 * @returns {Promise<number>} Number of locales loaded
 */
export const loadLocalesFromDB = async () => {
	let count = 0;

	try {
		const rows = await prisma.settingsManager.findMany({
			where: { locale: { not: null } },
			select: { groupId: true, locale: true }
		});

		for (const row of rows) {
			if (row.locale) {
				localeByRoom.set(row.groupId, row.locale);
			}
		}

		count += rows.length;
	} catch { /* DB unavailable */ }

	try {
		const userRows = await prisma.userLocale.findMany({
			where: { locale: { not: null } },
			select: { jid: true, locale: true }
		});

		for (const row of userRows) {
			if (row.locale) {
				localeByUser.set(row.jid, row.locale);
			}
		}

		count += userRows.length;
	} catch { /* DB unavailable */ }

	return count;
};

/**
 * Remove all registered tables. Intended for tests only.
 */
export const __resetForTests = () => {
	for (const key of Object.keys(tables)) {
		delete tables[key];
	}

	localeByRoom.clear();
	defaultLocale = DEFAULT_FALLBACK_LOCALE;
};
