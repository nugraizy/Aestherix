export type FetchLike = (input: string, init?: { headers?: Record<string, string> }) => Promise<{ json(): Promise<any> }>;

export type PosterQuality = 'small' | 'medium' | 'large';

export interface PageInfo {
	page: number;
	lastPage: number;
	hasNext: boolean;
}

export interface ComixPoster {
	small?: string;
	medium?: string;
	large?: string;
}

export interface ComixTag {
	title: string;
}

export interface ComixAuthor extends ComixTag {}
export interface ComixArtist extends ComixTag {}
export interface ComixGenre extends ComixTag {}
export interface ComixTheme extends ComixTag {}
export interface ComixDemographic extends ComixTag {}

export interface ComixManga {
	id: string;
	title: string;
	slug: string;
	poster: string;
	type?: string;
	status?: string;
	contentRating?: string;
	authors: string[];
	artists: string[];
	genres: string[];
	altTitles: string[];
	synopsis: string;
	rating: number;
	year: number | null;
	originalUrl: string;
}

export interface ComixChapter {
	id: string;
	number: number | string;
	name: string;
	votes: number;
	createdAt: string;
	isOfficial: boolean;
	groupId: number | null;
	scanlator: string;
	url: string;
	chapterSlug: string;
}

export interface ComixPage {
	index: number;
	url: string;
}

export interface FiltersDemographic {
	include?: string[];
	exclude?: string[];
}

export interface FiltersGenre {
	include?: string[];
	exclude?: string[];
}

export interface FiltersFormat {
	include?: string[];
	exclude?: string[];
}

export interface FiltersReleaseYear {
	from?: string | number;
	to?: string | number;
}

export interface ComixFilters {
	statuses?: string[];
	types?: string[];
	contentRating?: string;
	demographics?: FiltersDemographic;
	genres?: FiltersGenre;
	formats?: FiltersFormat;
	genresMode?: 'and' | 'or';
	minChapter?: string | number;
	releaseYear?: FiltersReleaseYear;
}

export interface ComixListOptions {
	page?: number;
	limit?: number;
	sort?: string;
	order?: 'asc' | 'desc';
	filters?: ComixFilters;
	excludeNsfw?: boolean;
	posterQuality?: PosterQuality;
}

export interface ComixSearchOptions extends Omit<ComixListOptions, 'filters'> {}

export interface ComixFilterOptions extends Omit<ComixListOptions, 'filters'> {}

export interface ComixHomeOptions {
	page?: number;
	limit?: number;
	excludeNsfw?: boolean;
	posterQuality?: PosterQuality;
}

export interface ComixChaptersOptions {
	page?: number;
	limit?: number;
	allPages?: boolean;
	deduplicate?: boolean;
}

export type MangaInput =
	| string
	| {
			id?: string;
			slug?: string;
			url?: string;
			posterQuality?: PosterQuality;
	  };

export type ChapterInput = string | number | { chapterId?: string; id?: string; url?: string; mangaSlug?: string };

export interface TagSearchResult {
	id: number;
	title: string;
}

export class ComixUtils {
	static readonly API_BASE: string;
	static readonly WEB_BASE: string;
	static readonly DEFAULT_LIMIT: number;
	static readonly NSFW_GENRE_IDS: string[];
	static readonly SORT_OPTIONS: Array<{ label: string; value: string }>;
	static readonly STATUS_OPTIONS: Array<{ label: string; value: string }>;
	static readonly TYPE_OPTIONS: Array<{ label: string; value: string }>;
	static readonly DEMOGRAPHIC_OPTIONS: Array<{ label: string; value: string }>;
	static readonly GENRE_OPTIONS: Array<{ label: string; value: string }>;
	static readonly FORMAT_OPTIONS: Array<{ label: string; value: string }>;
	static readonly CONTENT_RATING_OPTIONS: Array<{ label: string; value: string }>;

	static buildYears(includeOlder: boolean): Array<{ label: string; value: string }>;
	static appendParam(params: URLSearchParams, key: string, value: unknown): void;
	static applyFilters(params: URLSearchParams, filters: ComixFilters, excludeNsfw: boolean): void;
	static getPoster(poster: ComixPoster | null | undefined, quality: PosterQuality): string;
	static getMangaGenres(manga: {
		type?: string;
		genres?: ComixGenre[];
		genre?: ComixGenre[];
		tags?: ComixTag[];
		theme?: ComixTheme[];
		demographics?: ComixDemographic[];
		demographic?: ComixDemographic[];
		contentRating?: string;
	}): string[];
	static mapManga(manga: any, posterQuality: PosterQuality): ComixManga;
	static parsePageInfo(result: any): PageInfo;
	static buildMangaQuery(options?: ComixListOptions & { query?: string }): URLSearchParams;
	static normalizeSlugInput(input: MangaInput): string;
	static extractMangaId(slug: string): string;
	static mapChapter(chapter: any, slug: string, webBase: string): ComixChapter;
	static deduplicateChapters(chapters: ComixChapter[]): ComixChapter[];
	static normalizeChapterInput(input: ChapterInput): string;
	static extractIdFromUrl(query: string): string | null;
}

export class ComixResponse<TItem = ComixManga> {
	items: TItem[];
	pageInfo: PageInfo;
	context: Record<string, unknown>;

	hasNext(): boolean;
	nextPage(): Promise<ComixResponse<TItem>>;
	getDetail(index?: number): Promise<ComixItemResponse>;
	getChapters(index?: number, options?: ComixChaptersOptions): Promise<ComixResponse<ComixChapter>>;
	getChapterPages(chapterInput?: ChapterInput): Promise<ComixPage[]>;
}

export class ComixItemResponse extends ComixResponse<ComixManga> {
	getDetail(): Promise<ComixItemResponse>;
}

export class Comix {
	constructor(options?: { fetchImpl?: FetchLike; apiBase?: string; webBase?: string });

	fetchJSON(url: string): Promise<any>;
	getFilters(): {
		sorts: Array<{ label: string; value: string }>;
		statuses: Array<{ label: string; value: string }>;
		types: Array<{ label: string; value: string }>;
		demographics: Array<{ label: string; value: string }>;
		genres: Array<{ label: string; value: string }>;
		formats: Array<{ label: string; value: string }>;
		contentRatings: Array<{ label: string; value: string }>;
		releaseYears: {
			from: Array<{ label: string; value: string }>;
			to: Array<{ label: string; value: string }>;
		};
	};

	searchTags(type: string, query: string): Promise<TagSearchResult[]>;
	resolveTagIds(type: string, names: string): Promise<string[]>;
	getComics(options?: ComixListOptions): Promise<ComixResponse<ComixManga>>;
	search(query: string, options?: ComixSearchOptions): Promise<ComixResponse<ComixManga>>;
	filter(filters?: ComixFilters, options?: ComixFilterOptions): Promise<ComixResponse<ComixManga>>;
	getHome(options?: ComixHomeOptions): Promise<{
		popular: ComixResponse<ComixManga>;
		latest: ComixResponse<ComixManga>;
		recentlyAdded: ComixResponse<ComixManga>;
		mostViewed30Days: ComixResponse<ComixManga>;
	}>;
	getDetail(mangaInput: MangaInput): Promise<ComixItemResponse>;
	getChapters(mangaInput: MangaInput, options?: ComixChaptersOptions): Promise<ComixResponse<ComixChapter>>;
	getChapterPages(chapterInput: ChapterInput): Promise<ComixPage[]>;
}
