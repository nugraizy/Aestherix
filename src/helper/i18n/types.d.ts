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
 * Namespace string table types, derived from each namespace's `en.js` file.
 * Hovering over a property in IDE shows the actual English string.
 *
 * @example
 *   const L = useLocale('id', 'common');
 *   L.errors.noQuery  // hover → "Please provide a query."
 */
export type CommonStrings = typeof import('../../i18n/common/en.js').default;
export type AutoreplyStrings = typeof import('../../i18n/autoreply/en.js').default;
export type BlackjackStrings = typeof import('../../i18n/blackjack/en.js').default;
export type ChessStrings = typeof import('../../i18n/chess/en.js').default;
export type ConnectFourStrings = typeof import('../../i18n/connect-four/en.js').default;
export type HangmanStrings = typeof import('../../i18n/hangman/en.js').default;
export type MemoryMatchStrings = typeof import('../../i18n/memory-match/en.js').default;
export type MinesweeperStrings = typeof import('../../i18n/minesweeper/en.js').default;
export type PollStrings = typeof import('../../i18n/poll/en.js').default;
export type ReminderStrings = typeof import('../../i18n/reminder/en.js').default;
export type ScheduleStrings = typeof import('../../i18n/schedule/en.js').default;
export type SlowmodeStrings = typeof import('../../i18n/slowmode/en.js').default;
export type TemplateStrings = typeof import('../../i18n/template/en.js').default;
export type TriviaStrings = typeof import('../../i18n/trivia/en.js').default;
export type UnoStrings = typeof import('../../i18n/uno/en.js').default;
export type WerewolfStrings = typeof import('../../i18n/werewolf/en.js').default;
export type WordChainStrings = typeof import('../../i18n/word-chain/en.js').default;

/**
 * Maps namespace name to its string table type.
 * Used by `useLocale` to infer the correct return type.
 */
export interface NamespaceMap {
	common: CommonStrings;
	autoreply: AutoreplyStrings;
	blackjack: BlackjackStrings;
	chess: ChessStrings;
	'connect-four': ConnectFourStrings;
	hangman: HangmanStrings;
	'memory-match': MemoryMatchStrings;
	minesweeper: MinesweeperStrings;
	poll: PollStrings;
	reminder: ReminderStrings;
	schedule: ScheduleStrings;
	slowmode: SlowmodeStrings;
	template: TemplateStrings;
	trivia: TriviaStrings;
	uno: UnoStrings;
	werewolf: WerewolfStrings;
	'word-chain': WordChainStrings;
}
