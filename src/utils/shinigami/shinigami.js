import { fetch } from 'undici';

const BASE_URL = 'https://g.shinigami.asia';
const API_URL = 'https://api.shngm.io';
const CDN_URL = 'https://storage.shngm.id';

const API_HEADERS = {
	Accept: 'application/json',
	DNT: '1',
	Origin: BASE_URL,
	'Sec-GPC': '1'
};

function normalizeManga(manga) {
	if (!manga) {
		return null;
	}

	return {
		id: manga.manga_id || manga.mangaId || '',
		title: manga.title || '',
		poster: manga.cover_image_url || manga.thumbnail || '',
		url: `${BASE_URL}/series/${manga.manga_id || manga.mangaId || ''}`
	};
}

function normalizeMangaDetail(data) {
	if (!data) {
		return null;
	}

	const taxonomy = data.taxonomy || {};
	const authors = (taxonomy.Author || []).map((a) => a.name);
	const artists = (taxonomy.Artist || []).map((a) => a.name);
	const genres = (taxonomy.Genre || []).map((g) => g.name);
	const formats = (taxonomy.Format || []).map((f) => f.name);

	const statusMap = { 1: 'Ongoing', 2: 'Completed', 3: 'Hiatus' };

	return {
		description: data.description || '',
		status: statusMap[data.status] || 'Unknown',
		authors,
		artists,
		genres: [...genres, ...formats]
	};
}

function normalizeChapter(chapter) {
	const number = String(chapter.chapter_number ?? chapter.name ?? 0).replace(/\.0$/, '');

	return {
		id: chapter.chapter_id || chapter.chapterId || '',
		number: chapter.chapter_number ?? chapter.name ?? 0,
		name: chapter.chapter_title || chapter.title || `Chapter ${number}`,
		createdAt: chapter.release_date || chapter.date || ''
	};
}

class Shinigami {
	constructor({ apiUrl = API_URL, cdnUrl = CDN_URL, baseUrl = BASE_URL, fetchImpl = fetch } = {}) {
		this.apiUrl = apiUrl;
		this.cdnUrl = cdnUrl;
		this.baseUrl = baseUrl;
		this.fetchImpl = fetchImpl;
	}

	async fetchJSON(url) {
		const response = await this.fetchImpl(url, { headers: API_HEADERS });

		if (!response.ok) {
			throw new Error(`Shinigami API error: ${response.status}`);
		}

		return response.json();
	}

	async getPopular(page = 1) {
		const url = `${this.apiUrl}/v1/manga/list?page=${page}&page_size=30&sort=popularity`;
		const data = await this.fetchJSON(url);
		const hasNext = data.meta?.totalPage ? data.meta.page < data.meta.totalPage : false;

		return { items: (data.data || []).map(normalizeManga), hasNext };
	}

	async getLatest(page = 1) {
		const url = `${this.apiUrl}/v1/manga/list?page=${page}&page_size=30&sort=latest`;
		const data = await this.fetchJSON(url);
		const hasNext = data.meta?.totalPage ? data.meta.page < data.meta.totalPage : false;

		return { items: (data.data || []).map(normalizeManga), hasNext };
	}

	async search(
		query,
		{ page = 1, sort = '', status = '', format = '', type = '', genreInclude = '', genreExclude = '' } = {}
	) {
		const params = new URLSearchParams();

		params.set('page', String(page));
		params.set('page_size', '30');

		if (query) {
			params.set('q', query);
		}

		if (sort) {
			params.set('sort', sort);
		}

		if (status) {
			params.set('status', status);
		}

		if (format) {
			params.set('format', format);
		}

		if (type) {
			params.set('type', type);
		}

		if (genreInclude) {
			params.set('genre_include', genreInclude);
			params.set('genre_include_mode', 'and');
		}

		if (genreExclude) {
			params.set('genre_exclude', genreExclude);
			params.set('genre_exclude_mode', 'and');
		}

		const url = `${this.apiUrl}/v1/manga/list?${params.toString()}`;
		const data = await this.fetchJSON(url);
		const hasNext = data.meta?.totalPage ? data.meta.page < data.meta.totalPage : false;

		return { items: (data.data || []).map(normalizeManga), hasNext };
	}

	async getManga(id) {
		const data = await this.fetchJSON(`${this.apiUrl}/v1/manga/detail/${id}`);
		const detail = normalizeMangaDetail(data.data);
		const browse = normalizeManga({
			manga_id: id,
			title: data.data?.title || id,
			cover_image_url: data.data?.cover_image_url || ''
		});

		return { ...browse, ...detail };
	}

	async getChapters(id) {
		const data = await this.fetchJSON(`${this.apiUrl}/v1/chapter/${id}/list?page_size=3000`);
		const chapters = (data.data || []).map(normalizeChapter);

		return chapters.sort((a, b) => b.number - a.number);
	}

	async getPages(chapterId) {
		const data = await this.fetchJSON(`${this.apiUrl}/v1/chapter/detail/${chapterId}`);
		const chapterData = data.data?.chapter;

		if (!chapterData) {
			return [];
		}

		const basePath = chapterData.path || '';
		const pages = chapterData.data || [];

		return pages.map((imageName, index) => ({
			index,
			url: `${this.cdnUrl}${basePath}${imageName}`
		}));
	}

	getFilters() {
		return { sorts: SORTS, statuses: STATUSES, formats: FORMATS, types: TYPES, genres: GENRES };
	}
}

const SORTS = [
	{ label: 'Latest', value: 'latest' },
	{ label: 'Popularity', value: 'popularity' },
	{ label: 'Rating', value: 'rating' }
];

const STATUSES = [
	{ label: 'Ongoing', value: 'ongoing' },
	{ label: 'Completed', value: 'completed' },
	{ label: 'Hiatus', value: 'hiatus' }
];

const FORMATS = [
	{ label: 'Manga', value: 'manga' },
	{ label: 'Manhwa', value: 'manhwa' },
	{ label: 'Manhua', value: 'manhua' }
];

const TYPES = [
	{ label: 'Project', value: 'project' },
	{ label: 'Mirror', value: 'mirror' }
];

const GENRES = [
	{ label: 'Action', value: 'action' },
	{ label: 'Adventure', value: 'adventure' },
	{ label: 'Comedy', value: 'comedy' },
	{ label: 'Crime', value: 'crime' },
	{ label: 'Drama', value: 'drama' },
	{ label: 'Fantasy', value: 'fantasy' },
	{ label: 'Harem', value: 'harem' },
	{ label: 'Historical', value: 'historical' },
	{ label: 'Horror', value: 'horror' },
	{ label: 'Isekai', value: 'isekai' },
	{ label: 'Martial Arts', value: 'martial-arts' },
	{ label: 'Mature', value: 'mature' },
	{ label: 'Mystery', value: 'mystery' },
	{ label: 'Psychological', value: 'psychological' },
	{ label: 'Romance', value: 'romance' },
	{ label: 'School Life', value: 'school-life' },
	{ label: 'Sci-fi', value: 'sci-fi' },
	{ label: 'Seinen', value: 'seinen' },
	{ label: 'Shounen', value: 'shounen' },
	{ label: 'Slice of Life', value: 'slice-of-life' },
	{ label: 'Supernatural', value: 'supernatural' },
	{ label: 'Thriller', value: 'thriller' },
	{ label: 'Tragedy', value: 'tragedy' }
];

export { Shinigami, FORMATS, GENRES, SORTS, STATUSES, TYPES };
