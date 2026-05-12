import { Cache } from '../modules/cache.js';

const DEFAULT_FALLBACK_LOCALE = 'id';

const tables = Object.create(null);

const localeByRoom = new Cache();

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
 * @param {string} locale
 */
export const setDefaultLocale = (locale) => {
	if (typeof locale !== 'string' || locale.length === 0) {
		return;
	}

	defaultLocale = locale;
};

/**
 * @returns {string}
 */
export const getDefaultLocale = () => defaultLocale;

/**
 * @returns {string[]}
 */
export const listLocales = () => Object.keys(tables);

/**
 * @param {string} roomId
 * @returns {string}
 */
export const getLocale = (roomId) => {
	if (!roomId) {
		return defaultLocale;
	}

	const stored = localeByRoom.get(roomId);

	return stored || defaultLocale;
};

/**
 * @param {string} roomId
 * @param {string|null|undefined} locale
 */
export const setLocale = (roomId, locale) => {
	if (!roomId) {
		return;
	}

	if (!locale) {
		localeByRoom.delete(roomId);
		return;
	}

	localeByRoom.set(roomId, locale);
};

/**
 * Register or merge a namespace table for a locale.
 *
 * @param {string} namespace
 * @param {string} locale
 * @param {Record<string, unknown>} table
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
 * Translate a dotted key (e.g. `namespace.path.to.key`) with optional vars.
 *
 * Lookup order:
 *   1. tables[locale][namespace][...path]
 *   2. tables[defaultLocale][namespace][...path]
 *   3. `key` itself (so missing keys are obvious)
 *
 * Vars support:
 *   - positional: `{0}`, `{1}` when `vars` is an array
 *   - named:      `{name}` when `vars` is a plain object
 *
 * If the resolved value is an array, one element is picked at random via the
 * supplied rng (or `Math.random`) so we can rotate flavour text.
 *
 * @param {string} locale
 * @param {string} key dotted path, first segment is the namespace
 * @param {Record<string, unknown> | unknown[]} [vars]
 * @param {{rng?: () => number}} [options]
 * @returns {string}
 */
export const t = (locale, key, vars, options) => {
	if (typeof key !== 'string' || key.length === 0) {
		return '';
	}

	const resolved = resolveKey(locale, key) ?? resolveKey(defaultLocale, key);

	const raw = resolved === undefined ? key : resolved;

	const rng = options?.rng ?? Math.random;

	const picked = Array.isArray(raw) ? raw[Math.floor(rng() * raw.length)] : raw;

	if (typeof picked !== 'string') {
		return String(picked ?? key);
	}

	return interpolate(picked, vars);
};

/**
 * Returns true only if a key is defined in the given locale (no fallback).
 *
 * @param {string} locale
 * @param {string} key
 */
export const hasKey = (locale, key) => resolveKey(locale, key) !== undefined;

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
