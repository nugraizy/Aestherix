import type { ClientSocket, Context, Store } from '../Core';

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
	minifiedDescription?: string;
	description?: string;
	category: Category;
	usage: string;
	aliases?: string[];
	cooldown?: number;
	limit?: number;
	status: 'enable' | 'disable';
	restrict?: boolean;
	premium?: boolean;
	run(ctx: Context & { state?: unknown }, client: ClientSocket, store: Store): Promise<unknown> | unknown;
};
