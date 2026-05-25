export interface KiryuuManga {
	id: string;
	slug: string;
	title: string;
	poster: string;
	type?: string;
	status?: string;
	rating: number;
	authors: string[];
	artists: string[];
	genres: string[];
	altTitles: string[];
	synopsis: string;
	originalUrl: string;
}

export interface KiryuuChapter {
	id: string;
	number: string;
	name: string;
	date_upload: string;
	scanlator: string;
	url: string;
}

export interface KiryuuPage {
	index: number;
	url: string;
}

export interface KiryuuSearchResult {
	items: KiryuuManga[];
	pageInfo: {
		page: number;
		lastPage: number;
		hasNext: boolean;
	};
}

export interface KiryuuChapterResult {
	items: KiryuuChapter[];
	pageInfo: {
		page: number;
		lastPage: number;
		hasNext: boolean;
	};
}

export type MangaInput = string | { id?: string; slug?: string; url?: string };

export type ChapterInput = string | { id?: string; chapterId?: string; url?: string };
