import { fetch } from 'undici';

const BASE_URL = 'https://atsu.moe';
const API_HEADERS = {
	Accept: '*/*',
	Referer: BASE_URL,
	'Content-Type': 'application/json'
};
const PER_PAGE = 40;
const PROTOCOL_REGEX = /^https?:?\/\//;

function resolveImage(imagePath, baseUrl = BASE_URL) {
	if (!imagePath) {
		return null;
	}

	const url = typeof imagePath === 'object' ? imagePath.image || imagePath.poster : imagePath;

	if (!url) {
		return null;
	}

	const cleaned = url.replace(/^\//, '').replace(/^static\//, '');

	if (cleaned.startsWith('http')) {
		return cleaned.replace(PROTOCOL_REGEX, 'https://');
	}

	if (cleaned.startsWith('//')) {
		return `https:${cleaned}`;
	}

	return `${baseUrl}/static/${cleaned}`;
}

function normalizeManga(manga) {
	if (!manga) {
		return null;
	}

	const authors = parseAuthors(manga.authors);

	return {
		id: manga.id,
		title: manga.title,
		poster: resolveImage(manga.poster || manga.image || manga.imagePath),
		synopsis: manga.synopsis || '',
		status: manga.status || 'Unknown',
		type: manga.type || '',
		genres: parseNames(manga.genres || manga.tags),
		authors: authors.filter((a) => a.type === 'Author' || !a.type).map((a) => a.name),
		artists: authors.filter((a) => a.type === 'Artist').map((a) => a.name),
		otherNames: manga.otherNames || [],
		rating: manga.avgRating || 0,
		url: `${BASE_URL}/manga/${manga.id}`
	};
}

function normalizeChapter(chapter, mangaId, scanlatorName) {
	return {
		id: chapter.id,
		number: chapter.number,
		name: chapter.title || `Chapter ${chapter.number}`,
		scanlator: scanlatorName || null,
		createdAt: chapter.createdAt || '',
		url: `${BASE_URL}/read/${mangaId}/${chapter.id}`
	};
}

function parseNames(element) {
	if (!element) {
		return [];
	}

	if (!Array.isArray(element)) {
		return [];
	}

	return element.map((item) => (typeof item === 'string' ? item : item?.name || '')).filter(Boolean);
}

function parseAuthors(element) {
	if (!element || !Array.isArray(element)) {
		return [];
	}

	return element
		.map((item) => {
			if (typeof item === 'string') {
				return { name: item, type: null };
			}

			return { name: item?.name || '', type: item?.type || null };
		})
		.filter((a) => a.name);
}

class Atsumaru {
	#mangaCache = new Map();
	#chapterCache = new Map();

	constructor({ baseUrl = BASE_URL, fetchImpl = fetch } = {}) {
		this.baseUrl = baseUrl;
		this.fetchImpl = fetchImpl;
	}

	async fetchJSON(url) {
		const response = await this.fetchImpl(url, { headers: API_HEADERS });

		if (!response.ok) {
			throw new Error(`Atsumaru API error: ${response.status}`);
		}

		return response.json();
	}

	async getPopular(page = 1) {
		const data = await this.fetchJSON(`${this.baseUrl}/api/infinite/trending?page=${page - 1}&types=Manga,Manwha,Manhua,OEL`);

		return (data?.items || []).map(normalizeManga);
	}

	async getLatest(page = 1) {
		const data = await this.fetchJSON(
			`${this.baseUrl}/api/infinite/recentlyUpdated?page=${page - 1}&types=Manga,Manwha,Manhua,OEL`
		);

		return (data?.items || []).map(normalizeManga);
	}

	async search(query, { page = 1, filters = {} } = {}) {
		const url = new URL(`${this.baseUrl}/collections/manga/documents/search`);

		url.searchParams.set('q', query || '*');
		url.searchParams.set('page', String(page));
		url.searchParams.set('per_page', String(PER_PAGE));

		const filterBy = ['hidden:!=true', 'views:>0'];

		if (filters.genres?.include?.length) {
			filterBy.push(filters.genres.include.map((id) => `genreIds:=\`${id}\``).join(' && '));
		}

		if (filters.genres?.exclude?.length) {
			filterBy.push(`genreIds:!=[${filters.genres.exclude.map((id) => `\`${id}\``).join(',')}]`);
		}

		if (filters.types?.length) {
			filterBy.push(`type:=[${filters.types.map((t) => `\`${t}\``).join(',')}]`);
		}

		if (filters.statuses?.length) {
			filterBy.push(`status:=[${filters.statuses.map((s) => `\`${s}\``).join(',')}]`);
		}

		if (filters.year) {
			filterBy.push(`releaseYear:=[${filters.year}]`);
		}

		if (filters.minChapters) {
			filterBy.push(`chapterCount:>=${filters.minChapters}`);
		}

		if (!filters.showAdult) {
			filterBy.push('isAdult:=false');
		}

		if (filters.officialOnly) {
			filterBy.push('officialTranslation:=true');
		}

		filterBy.push('(mbContentRating:=[`Safe`,`Suggestive`,`Erotica`] || mbContentRating:!=*)');

		url.searchParams.set('filter_by', filterBy.join(' && '));

		if (filters.sort) {
			url.searchParams.set('sort_by', filters.sort);
		}

		if (query) {
			url.searchParams.set('query_by', 'title,englishTitle,otherNames,authors');
			url.searchParams.set('query_by_weights', '4,3,2,1');
			url.searchParams.set('num_typos', '4,3,2,1');
		}

		const data = await this.fetchJSON(url.toString());

		if (data?.hits) {
			const mangas = data.hits.map((hit) => normalizeManga(hit.document));
			const hasNext = data.page * (data.request_params?.per_page || PER_PAGE) < data.found;

			return { items: mangas, hasNext, total: data.found };
		}

		return { items: (data?.items || []).map(normalizeManga), hasNext: true, total: null };
	}

	async getManga(input) {
		const id = typeof input === 'string' ? input : input?.id;

		if (!id) {
			throw new Error('Manga ID is required');
		}

		if (this.#mangaCache.has(id)) {
			return this.#mangaCache.get(id);
		}

		const data = await this.fetchJSON(`${this.baseUrl}/api/manga/page?id=${id}`);
		const result = normalizeManga(data?.mangaPage);

		this.#mangaCache.set(id, result);

		return result;
	}

	async getChapters(input) {
		const id = typeof input === 'string' ? input : input?.id;

		if (!id) {
			throw new Error('Manga ID is required');
		}

		if (this.#chapterCache.has(id)) {
			return this.#chapterCache.get(id);
		}

		const [chaptersData, detailData] = await Promise.all([
			this.fetchJSON(`${this.baseUrl}/api/manga/allChapters?mangaId=${id}`),
			this.fetchJSON(`${this.baseUrl}/api/manga/page?id=${id}`).catch(() => null)
		]);

		const scanlatorMap = {};

		if (detailData?.mangaPage?.scanlators) {
			for (const s of detailData.mangaPage.scanlators) {
				scanlatorMap[s.id] = s.name;
			}
		}

		const chapters = (chaptersData?.chapters || []).map((ch) => {
			const scanlatorName = ch.scanlationMangaId ? scanlatorMap[ch.scanlationMangaId] || null : null;

			return normalizeChapter(ch, id, scanlatorName);
		});

		const result = chapters.sort((a, b) => b.number - a.number);

		this.#chapterCache.set(id, result);

		return result;
	}

	async getPages(mangaId, chapterId) {
		if (!mangaId || !chapterId) {
			throw new Error('Manga ID and Chapter ID are required');
		}

		const url = new URL(`${this.baseUrl}/api/read/chapter`);

		url.searchParams.set('mangaId', mangaId);
		url.searchParams.set('chapterId', chapterId);

		const data = await this.fetchJSON(url.toString());
		const pages = data?.readChapter?.pages || [];

		return pages.map((page, index) => {
			let imageUrl = page.image;

			if (imageUrl.startsWith('//')) {
				imageUrl = `https:${imageUrl}`;
			} else if (!imageUrl.startsWith('http')) {
				imageUrl = `${this.baseUrl}/static/${imageUrl.replace(/^\//, '').replace(/^static\//, '')}`;
			}

			return { index, url: imageUrl.replace(PROTOCOL_REGEX, 'https://') };
		});
	}

	getFilters() {
		return {
			genres: GENRES,
			types: TYPES,
			statuses: STATUSES,
			sorts: SORTS
		};
	}
}

const GENRES = [
	{ label: 'Action', value: 'Ip0' },
	{ label: 'Adventure', value: 'wY2' },
	{ label: 'Comedy', value: 'pr6' },
	{ label: 'Drama', value: 'ME8' },
	{ label: 'Fantasy', value: 'yv11' },
	{ label: 'Harem', value: 'hg15' },
	{ label: 'Historical', value: 'qW17' },
	{ label: 'Horror', value: 'NH18' },
	{ label: 'Martial Arts', value: 'XO22' },
	{ label: 'Mecha', value: 'N824' },
	{ label: 'Mystery', value: 'Xz26' },
	{ label: 'Psychological', value: 'FV27' },
	{ label: 'Romance', value: 'Ex28' },
	{ label: 'School Life', value: 'Zu29' },
	{ label: 'Sci-Fi', value: '3j30' },
	{ label: 'Seinen', value: 'pw31' },
	{ label: 'Shoujo', value: '4W33' },
	{ label: 'Shounen', value: 'W935' },
	{ label: 'Slice of Life', value: 'YX37' },
	{ label: 'Sports', value: 'NC39' },
	{ label: 'Supernatural', value: 'hT40' },
	{ label: 'Thriller', value: 'e742' },
	{ label: 'Tragedy', value: 'tn43' }
];

const TYPES = [
	{ label: 'Manga', value: 'Manga' },
	{ label: 'Manhwa', value: 'Manwha' },
	{ label: 'Manhua', value: 'Manhua' },
	{ label: 'OEL', value: 'OEL' }
];

const STATUSES = [
	{ label: 'Ongoing', value: 'Ongoing' },
	{ label: 'Completed', value: 'Completed' },
	{ label: 'Hiatus', value: 'Hiatus' },
	{ label: 'Canceled', value: 'Canceled' }
];

const SORTS = [
	{ label: 'Popularity', value: 'views:desc' },
	{ label: 'Trending', value: 'trending:desc' },
	{ label: 'Date Added', value: 'dateAdded:desc' },
	{ label: 'Release Date', value: 'released:desc' },
	{ label: 'Top Rated', value: 'avgRating:desc' }
];

export { Atsumaru, GENRES, SORTS, STATUSES, TYPES };
