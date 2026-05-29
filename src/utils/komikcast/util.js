import { fetch } from 'undici';

import { imageToPdf } from '../converter/image.js';

const BASE_URL = 'https://v2.komikcast.fit';
const API_URL = 'https://be.komikcast.cc';

const API_HEADERS = {
	Accept: 'application/json',
	Referer: `${BASE_URL}/`,
	Origin: BASE_URL,
	'Accept-Language': 'en-US,en;q=0.9,id;q=0.8'
};

const STATUS_MAP = {
	ongoing: 'Ongoing',
	'on going': 'Ongoing',
	completed: 'Completed',
	complete: 'Completed',
	hiatus: 'Hiatus',
	cancelled: 'Cancelled',
	canceled: 'Cancelled'
};

function normalizeManga(item) {
	if (!item) {
		return null;
	}

	const data = item.data || {};
	const slug = data.slug || item.id;

	return {
		id: String(slug),
		slug: String(slug),
		title: data.title || '',
		poster: data.coverImage || '',
		status: STATUS_MAP[(data.status || '').toLowerCase()] || 'Unknown',
		authors: data.author ? [data.author] : [],
		genres: (data.genres || []).map((g) => g?.data?.name).filter(Boolean),
		synopsis: data.synopsis || '',
		url: `${BASE_URL}/series/${slug}`
	};
}

function normalizeChapter(item) {
	const index = item.data?.index ?? item.chapterIndex;
	const number = Number(index);
	const title = item.data?.title;

	return {
		id: String(index),
		number: Number.isFinite(number) ? number : index,
		name: title ? `Chapter ${index}: ${title}` : `Chapter ${index}`,
		createdAt: item.createdAt || item.updatedAt || ''
	};
}

export class KomikCast {
	#mangaCache = new Map();
	#chapterCache = new Map();

	constructor({ apiUrl = API_URL, baseUrl = BASE_URL, fetchImpl = fetch } = {}) {
		this.apiUrl = apiUrl;
		this.baseUrl = baseUrl;
		this.fetchImpl = fetchImpl;
	}

	async fetchJSON(url) {
		const response = await this.fetchImpl(url, { headers: API_HEADERS });

		if (!response.ok) {
			throw new Error(`Komikcast API error: ${response.status}`);
		}

		return response.json();
	}

	#listUrl({ page = 1, sort, order = 'desc', query } = {}) {
		const params = new URLSearchParams();

		params.set('includeMeta', 'true');
		params.set('take', '24');
		params.set('page', String(page));

		if (sort) {
			params.set('sort', sort);
			params.set('sortOrder', order);
		}

		if (query) {
			params.set('filter', `title=like="${query}",nativeTitle=like="${query}"`);
		}

		return `${this.apiUrl}/series?${params.toString()}`;
	}

	async #fetchList(options) {
		const data = await this.fetchJSON(this.#listUrl(options));
		const hasNext = data.meta ? (data.meta.page ?? 0) < (data.meta.lastPage ?? 0) : false;

		return { items: (data.data || []).map(normalizeManga), hasNext };
	}

	list(page = 1, sort = 'popularity', order = 'desc') {
		return this.#fetchList({ page, sort, order });
	}

	getPopular(page = 1) {
		return this.#fetchList({ page, sort: 'popularity' });
	}

	getLatest(page = 1) {
		return this.#fetchList({ page, sort: 'latest' });
	}

	search(query, { page = 1 } = {}) {
		return this.#fetchList({ page, query });
	}

	async getManga(slug) {
		if (this.#mangaCache.has(slug)) {
			return this.#mangaCache.get(slug);
		}

		const data = await this.fetchJSON(`${this.apiUrl}/series/${slug}`);
		const result = normalizeManga(data.data);

		this.#mangaCache.set(slug, result);

		return result;
	}

	async getChapters(slug) {
		if (this.#chapterCache.has(slug)) {
			return this.#chapterCache.get(slug);
		}

		const data = await this.fetchJSON(`${this.apiUrl}/series/${slug}/chapters`);
		const result = (data.data || []).map(normalizeChapter);

		this.#chapterCache.set(slug, result);

		return result;
	}

	async getPages(slug, chapterIndex) {
		const data = await this.fetchJSON(`${this.apiUrl}/series/${slug}/chapters/${chapterIndex}`);
		const images = data.data?.data?.images || [];

		return images.map((url, index) => ({ index, url }));
	}

	toPdf(imageUrls) {
		return imageToPdf(imageUrls);
	}
}
