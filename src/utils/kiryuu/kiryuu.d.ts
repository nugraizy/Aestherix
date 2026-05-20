export type FetchLike = (
	input: string,
	init?: { headers?: Record<string, string> }
) => Promise<{ json(): Promise<any>; text(): Promise<string> }>;

export interface PageInfo {
	page: number;
	lastPage: number;
	hasNext: boolean;
}

export interface KiryuuTerm {
	name: string;
	slug: string;
	taxonomy: string;
}

export interface KiryuuRendered {
	rendered: string;
}

export interface KiryuuFeaturedMedia {
	source_url: string;
}

export interface KiryuuEmbedded {
	'wp:featuredmedia': KiryuuFeaturedMedia[];
	'wp:term': KiryuuTerm[][];
}

export interface KiryuuManga {
	id: number;
	slug: string;
	title: KiryuuRendered;
	content: KiryuuRendered;
	_embedded: KiryuuEmbedded;
}

export interface KiryuuPoster {
	small?: string;
	medium?: string;
	large?: string;
}

export interface KiryuuManga {
	id: string;
	title: string;
	slug: string;
	poster: string;
	type?: string;
	status?: string;
	authors: string[];
	artists: string[];
	genres: string[];
	altTitles: string[];
	synopsis: string;
	rating: number;
	originalUrl: string;
}

export interface KiryuuChapter {
	id: string;
	number: number | string;
	name: string;
	date: string;
	url: string;
}

export interface KiryuuPage {
	index: number;
	url: string;
}

export interface KiryuuSortOption {
	label: string;
	value: string;
}

export interface KiryuuTypeOption {
	label: string;
	value: string;
}

export interface KiryuuStatusOption {
	label: string;
	value: string;
}

export interface KiryuuGenreOption {
	label: string;
	value: string;
}

export interface KiryuuListOptions {
	page?: number;
	limit?: number;
	sort?: string;
	order?: 'asc' | 'desc';
	type?: string[];
	status?: string[];
	genres?: string[];
	excludeGenres?: string[];
	posterQuality?: 'small' | 'medium' | 'large';
}

export interface KiryuuHomeOptions {
	page?: number;
	limit?: number;
	posterQuality?: 'small' | 'medium' | 'large';
}

export interface KiryuuChaptersOptions {
	page?: number;
	limit?: number;
}

export class KiryuuUtils {
	static readonly WEB_BASE = 'https://v5.kiryuu.to';
	static readonly API_SEARCH = '/wp-admin/admin-ajax.php?action=advanced_search';
	static readonly API_MANGA = '/wp-json/wp/v2/manga';
	static readonly API_GENRE = '/wp-json/wp/v2/genre';
	static readonly API_CHAPTERS = '/wp-admin/admin-ajax.php';

	static readonly DEFAULT_LIMIT = 28;

	static readonly SORT_OPTIONS: KiryuuSortOption[] = [
		{ label: 'Popular', value: 'popular' },
		{ label: 'Rating', value: 'rating' },
		{ label: 'Updated', value: 'updated' },
		{ label: 'Bookmarked', value: 'bookmarked' },
		{ label: 'Title', value: 'title' }
	];

	static readonly TYPE_OPTIONS: KiryuuTypeOption[] = [
		{ label: 'Manga', value: 'manga' },
		{ label: 'Manhwa', value: 'manhwa' },
		{ label: 'Manhua', value: 'manhua' }
	];

	static readonly STATUS_OPTIONS: KiryuuStatusOption[] = [
		{ label: 'Ongoing', value: 'ongoing' },
		{ label: 'Completed', value: 'completed' },
		{ label: 'Cancelled', value: 'cancelled' },
		{ label: 'On Hiatus', value: 'on-hiatus' },
		{ label: 'Unknown', value: 'unknown' }
	];

	static buildNonceUrl() {
		return `${this.WEB_BASE}/wp-admin/admin-ajax.php?type=search_form&action=get_nonce`;
	}

	static buildSearchUrl(page = 1) {
		return `${this.WEB_BASE}${this.API_SEARCH}`;
	}

	static buildGenreUrl(page = 1) {
		return `${this.WEB_BASE}${this.API_GENRE}?per_page=100&page=${page}&orderby=count&order=desc`;
	}

	static buildMangaUrl(slugs: string[], embed = true) {
		const base = `${this.WEB_BASE}${this.API_MANGA}`;
		const params = new URLSearchParams();
		slugs.forEach((slug) => params.append('slug[]', slug));
		params.set('per_page', String(slugs.length + 1));
		if (embed) params.set('_embed', '');
		return `${base}?${params.toString()}`;
	}

	static buildChapterListUrl(mangaId: string, randomPage: number) {
		const params = new URLSearchParams({
			manga_id: mangaId,
			page: String(randomPage),
			action: 'chapter_list'
		});
		return `${this.WEB_BASE}${this.API_CHAPTERS}?${params.toString()}`;
	}

	static getStatus(statusTerms: string[]) {
		if (statusTerms.includes('Ongoing')) return 'Ongoing';
		if (statusTerms.includes('Completed')) return 'Completed';
		if (statusTerms.includes('Cancelled')) return 'Cancelled';
		if (statusTerms.includes('On Hiatus')) return 'On Hiatus';
		return 'Unknown';
	}

	static getMangaGenres(embedded: KiryuuEmbedded): string[] {
		const values: string[] = [];
		embedded.getTerms('genre').forEach((g) => values.push(g));
		embedded.getTerms('type').forEach((t) => values.push(t));
		return [...new Set(values)];
	}

	static getMangaAuthors(embedded: KiryuuEmbedded): string[] {
		return embedded.getTerms('series-author');
	}

	static getMangaArtists(embedded: KiryuuEmbedded): string[] {
		return embedded.getTerms('artist');
	}
}

declare module './kiryuu' {
	interface KiryuuEmbedded {
		getTerms(type: string): string[];
	}
}
