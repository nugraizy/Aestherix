/**
 * A string literal type for dotted locale keys.
 * First segment is the namespace, rest is the path.
 *
 * @example "common.errors.noQuery"
 * @example "werewolf.success.join"
 */
export type LocaleKey = string;

/**
 * A fluent proxy for ergonomic translation access.
 *
 * Property access builds the key path.
 * Calling as a function resolves and interpolates the string.
 * Converting to string (template literal, String(), etc.) resolves without interpolation.
 *
 * @example
 *   const L = useLocale('id', 'common');
 *
 *   // String coercion — resolves to the translated string
 *   const msg = `${L.errors.noQuery}`;
 *   const msg2 = String(L.errors.noQuery);
 *   client.reply(from, L.success.loading, message);
 *
 *   // Function call — resolves + interpolates positional args
 *   client.reply(from, L.cooldown(5), message);
 *   client.reply(from, L.errors.missingArgs('!help'), message);
 *
 *   // Function call — resolves + interpolates named args
 *   client.reply(from, L.greeting({ name: 'Ali' }), message);
 */
export interface LocaleProxy {
	[key: string]: LocaleProxy & ((...args: unknown[]) => string);
}

/**
 * A single entry in the languages list.
 */
export interface LanguageEntry {
	iso: string;
	lang: string;
	native?: string;
}

/**
 * Common namespace string table shape, derived from `src/i18n/common/en.js`.
 * Hovering over a property in IDE shows the actual English string.
 *
 * @example
 *   const L = useLocale('id', 'common');
 *   L.errors.noQuery  // hover → "Please provide a query."
 */
export type CommonStrings = typeof import('../../i18n/common/en.js').default;
