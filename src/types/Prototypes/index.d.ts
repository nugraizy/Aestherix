/**
 * Available color names for terminal styling via the `color()` utility.
 */
type ColorName =
	| 'red'
	| 'green'
	| 'blue'
	| 'yellow'
	| 'cyan'
	| 'magenta'
	| 'purple'
	| 'orange'
	| 'pink'
	| 'white'
	| 'gray'
	| 'lilac'
	| 'gold'
	| 'lime'
	| 'teal'
	| 'coral'
	| 'mint'
	| 'lavender'
	| 'indigo'
	| 'neonGreen';

interface SplitStringOptions {
	/** Number of characters per chunk. @default 3 */
	length?: number;
	/** Separator between chunks. @default '-' */
	join?: string;
}

declare global {
	interface String {
		/** Converts milliseconds to `m:ss` format. */
		toTime(): string;

		/** Converts seconds to `HH:MM:SS` format. */
		toReadAble(): string;

		/** Inserts a space before each uppercase letter (camelCase → camel Case). */
		seperateCamel(): string;

		/** Capitalizes the first letter of each word. */
		capitalize(): string;

		/** Returns `true` if the string equals any of the provided arguments. */
		isExist(...args: string[]): boolean;

		/** Randomizes letter casing and substitutes some uppercase letters with look-alike digits. */
		mocking(): string;

		/**
		 * Wraps the string in a decorative header format.
		 * @param simplify If `true`, uses a compact triple-backtick wrapper instead of the full banner.
		 */
		formatHeaders(simplify?: boolean): string;

		/** Wraps values in `key : value` lines with inline code formatting. */
		formatForm(): string;

		/**
		 * Wraps the string with the given formatter character on both sides.
		 * @example 'hello'.format('*') // '*hello*'
		 */
		format(formatter: string): string;

		/** Replaces the last occurrence of `find` with `replace`. */
		replaceLast(find: string, replace: string): string;

		/** Replaces the first occurrence of `find` with `replace`. */
		replaceFirst(find: string, replace: string): string;

		/** Replaces all occurrences of `find` with `replace`. */
		replaceAll(find: string, replace: string): string;

		/** Extracts phone numbers from text and returns them as WhatsApp JIDs. */
		parseNumber(): string[];

		/** Splits the string into fixed-length chunks joined by a separator. */
		splitString(options?: SplitStringOptions): string;

		/** Applies red terminal color. */
		red(): string;
		/** Applies green terminal color. */
		green(): string;
		/** Applies blue terminal color. */
		blue(): string;
		/** Applies yellow terminal color. */
		yellow(): string;
		/** Applies cyan terminal color. */
		cyan(): string;
		/** Applies magenta terminal color. */
		magenta(): string;
		/** Applies purple terminal color. */
		purple(): string;
		/** Applies orange terminal color. */
		orange(): string;
		/** Applies pink terminal color. */
		pink(): string;
		/** Applies white terminal color. */
		white(): string;
		/** Applies gray terminal color. */
		gray(): string;
		/** Applies lilac terminal color. */
		lilac(): string;
		/** Applies gold terminal color. */
		gold(): string;
		/** Applies lime terminal color. */
		lime(): string;
		/** Applies teal terminal color. */
		teal(): string;
		/** Applies coral terminal color. */
		coral(): string;
		/** Applies mint terminal color. */
		mint(): string;
		/** Applies lavender terminal color. */
		lavender(): string;
		/** Applies indigo terminal color. */
		indigo(): string;
		/** Applies neon green terminal color. */
		neonGreen(): string;

		/** Applies chalk bold formatting. */
		bold(): string;
		/** Applies chalk italic formatting. */
		italic(): string;
		/** Applies chalk dim formatting. */
		dim(): string;
		/** Applies chalk underline formatting. */
		underline(): string;

		/** Applies a terminal color by name. */
		themed(colorName: ColorName): string;
	}

	interface Array<T> {
		/**
		 * Inserts one or more items at the given index, shifting existing elements.
		 * @returns The mutated array.
		 */
		insert(index: number, ...items: T[]): T[];

		/**
		 * Returns a new array with duplicates removed.
		 * @param key Optional object key to use for uniqueness comparison.
		 */
		sortUnique(key?: keyof T): T[];
	}

	interface Number {
		/** Converts milliseconds to `m:ss` format. */
		toTime(): string;

		/** Converts seconds to `HH:MM:SS` format. */
		toReadAble(): string;
	}
}

export { ColorName, SplitStringOptions };
