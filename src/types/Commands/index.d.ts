import type { ClientSocket, Context, Store } from '../Core/index.d.ts';

type Category =
	| 'AI'
	| 'AL-Quran'
	| 'Anime'
	| 'Anonymous'
	| 'Converter'
	| 'Debugging'
	| 'Downloader'
	| 'Games'
	| 'Genshin Impact'
	| 'Helper'
	| 'Look-up'
	| 'Misc'
	| 'Moderation'
	| 'News'
	| 'Owner'
	| 'Search';

export type CommandProps = {
	name: string;
	/** @deprecated Use i18n `commands.<name>.minified` instead. Kept as fallback. */
	minifiedDescription?: string;
	/** @deprecated Use i18n `commands.<name>.description` instead. Kept as fallback. */
	description?: string;
	descriptionKey?: string;
	descriptionArgs?: string[];
	category: Category;
	usage: string;
	aliases?: string[];
	cooldown?: number;
	timeout?: number;
	limit?: number;
	status: 'enable' | 'disable';
	restrict?: boolean;
	premium?: boolean;
	run(ctx: Context & { state?: unknown }, client: ClientSocket, store: Store): Promise<unknown> | unknown;
};
