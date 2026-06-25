import { fetch } from 'undici';

import { ComixBrowserCapture, comixBrowserPool } from './browser-capture.js';
import { ComixUtils } from './comix-utils.js';
import { Descrambler } from './descrambler.js';
import { ComixItemResponse, ComixResponse } from './response.js';

class Comix {
	static CHAPTERS_CACHE_TTL = 10 * 60 * 1000;

	constructor({ fetchImpl, apiBase, webBase } = {}) {
		this.fetchImpl = fetchImpl || fetch;
		this.browserFetch = Comix.puppeteerFetch;
		this.apiBase = apiBase || ComixUtils.API_BASE;
		this.webBase = webBase || ComixUtils.WEB_BASE;
		this.mangaCache = new Map();
		this.chapterCache = new Map();
		this.chaptersListCache = new Map();
	}

	static delay(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	static async puppeteerFetch(url) {
		const browser = await comixBrowserPool.browser();
		const context = await browser.createBrowserContext();

		try {
			const page = await context.newPage();

			await ComixBrowserCapture.configurePage(page);

			const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 60_000 });
			const status = response?.status() ?? 0;
			const responseHeaders = response?.headers() || {};
			const contentType = responseHeaders['content-type'] || 'application/json';
			const text = await page.evaluate(() => document.body.innerText);

			return {
				status,
				headers: {
					get: (name) => (name.toLowerCase() === 'content-type' ? contentType : responseHeaders[name.toLowerCase()])
				},
				json: async () => JSON.parse(text)
			};
		} finally {
			await context.close().catch(() => {});
		}
	}

	getManga(id) {
		return this.mangaCache.get(String(id)) || null;
	}
	getChapterById(id) {
		return this.chapterCache.get(String(id)) || null;
	}

	async fetchJSON(url) {
		const deadline = Date.now() + 60_000;
		let lastError;

		while (Date.now() < deadline) {
			const direct = await this.tryFetchJson(url, this.fetchImpl);

			if (direct.ok) {
				return direct.data;
			}

			if (direct.status !== 403) {
				throw direct.error;
			}

			const browser = await this.tryFetchJson(url, this.browserFetch);

			if (browser.ok) {
				return browser.data;
			}

			if (browser.status && browser.status !== 403) {
				throw browser.error;
			}

			lastError = browser.error || direct.error;

			if (Date.now() < deadline) {
				await Comix.delay(1000);
			}
		}

		throw lastError || new Error('Comix request failed');
	}

	async tryFetchJson(url, fetcher) {
		try {
			const response = await fetcher(url, {
				headers: {
					'User-Agent':
						'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
					Referer: `${this.webBase}/`
				}
			});

			if (response.status === 403) {
				return { ok: false, status: 403, error: new Error('HTTP 403') };
			}

			if (!response.headers.get('content-type')?.includes('application/json')) {
				return { ok: false, error: new Error('Unexpected content type. Received non-JSON response.') };
			}

			const data = await response.json();

			return { ok: true, status: response.status, data };
		} catch (error) {
			return { ok: false, error };
		}
	}

	getFilters() {
		return {
			sorts: ComixUtils.SORT_OPTIONS,
			statuses: ComixUtils.STATUS_OPTIONS,
			types: ComixUtils.TYPE_OPTIONS,
			demographics: ComixUtils.DEMOGRAPHIC_OPTIONS,
			genres: ComixUtils.GENRE_OPTIONS,
			formats: ComixUtils.FORMAT_OPTIONS,
			contentRatings: ComixUtils.CONTENT_RATING_OPTIONS,
			releaseYears: { from: ComixUtils.buildYears(true), to: ComixUtils.buildYears(false) }
		};
	}

	async searchTags(type, query) {
		const url = new URL(`${this.apiBase}/tags/search`);

		url.searchParams.set('type', type);
		url.searchParams.set('q', query);

		const data = await this.fetchJSON(url.toString());

		return (data?.result || []).map((item) => ({ id: item.id, title: item.title || item.name || '' }));
	}

	async resolveTagIds(type, names) {
		const nameList = String(names)
			.split(',')
			.map((n) => n.trim())
			.filter(Boolean);
		const ids = [];

		for (const name of nameList) {
			const results = await this.searchTags(type, name);

			ids.push(...results.map((r) => String(r.id)));
		}

		return ids;
	}

	async fetchMangaListViaBrowse(browseUrl, posterQuality) {
		const data = await ComixBrowserCapture.captureBrowseList({ browseUrl });

		if (!data?.result?.items) {
			return { items: [], pageInfo: { page: 1, lastPage: 1, hasNext: false } };
		}

		const items = data.result.items;
		const pageInfo = ComixUtils.parsePageInfo(data.result);
		const mapped = items.map((manga) => ComixUtils.mapManga(manga, posterQuality));

		return { items: mapped, pageInfo };
	}

	async fetchMangaById(id) {
		const slug = typeof id === 'string' && id.includes('-') ? id : id;
		const detailUrl = `${this.webBase}/title/${slug}`;

		return ComixBrowserCapture.captureDetail({ detailUrl });
	}

	async getComics(options = {}) {
		const posterQuality = options.posterQuality || 'large';
		const params = ComixUtils.buildMangaQuery(options);
		const browseUrl = `${this.webBase}/browse?${params.toString()}`;
		const { items, pageInfo } = await this.fetchMangaListViaBrowse(browseUrl, posterQuality);

		return new ComixResponse({
			comix: this,
			items,
			pageInfo,
			context: {
				type: 'list',
				nextPage: pageInfo.hasNext ? () => this.getComics({ ...options, page: pageInfo.page + 1 }) : null
			}
		});
	}

	async search(query, options = {}) {
		const idFromUrl = ComixUtils.extractIdFromUrl(query);

		if (idFromUrl) {
			const slug = ComixUtils.normalizeSlugInput(query);
			const posterQuality = options.posterQuality || 'large';

			try {
				const data = await this.fetchMangaById(slug);

				if (data?.result?.hid) {
					const manga = ComixUtils.mapManga(data.result, posterQuality);

					return new ComixResponse({
						comix: this,
						items: [manga],
						pageInfo: { page: 1, lastPage: 1, hasNext: false },
						context: { type: 'search', nextPage: null }
					});
				}
			} catch {
				// Fallback to title search below
			}

			const titleFromSlug = slug.replace(/-\d+$/, '').replace(/-/g, ' ');

			if (titleFromSlug) {
				const params = ComixUtils.buildMangaQuery({ ...options, query: titleFromSlug });
				const browseUrl = `${this.webBase}/browse?${params.toString()}`;
				const { items, pageInfo } = await this.fetchMangaListViaBrowse(browseUrl, posterQuality);

				return new ComixResponse({
					comix: this,
					items,
					pageInfo,
					context: { type: 'search', nextPage: null }
				});
			}
		}

		const posterQuality = options.posterQuality || 'large';
		const params = ComixUtils.buildMangaQuery({ ...options, query });
		const browseUrl = `${this.webBase}/browse?${params.toString()}`;
		const { items, pageInfo } = await this.fetchMangaListViaBrowse(browseUrl, posterQuality);

		for (const manga of items) {
			this.mangaCache.set(String(manga.id), manga);
		}

		return new ComixResponse({
			comix: this,
			items,
			pageInfo,
			context: {
				type: 'search',
				nextPage: pageInfo.hasNext ? () => this.search(query, { ...options, page: pageInfo.page + 1 }) : null
			}
		});
	}

	async filter(filters = {}, options = {}) {
		const posterQuality = options.posterQuality || 'large';
		const params = ComixUtils.buildMangaQuery({ ...options, filters });
		const browseUrl = `${this.webBase}/browse?${params.toString()}`;
		const { items, pageInfo } = await this.fetchMangaListViaBrowse(browseUrl, posterQuality);

		return new ComixResponse({
			comix: this,
			items,
			pageInfo,
			context: {
				type: 'filter',
				nextPage: pageInfo.hasNext ? () => this.filter(filters, { ...options, page: pageInfo.page + 1 }) : null
			}
		});
	}

	async getHome(options = {}) {
		const base = {
			page: options.page || 1,
			limit: options.limit || ComixUtils.DEFAULT_LIMIT,
			excludeNsfw: options.excludeNsfw !== false,
			posterQuality: options.posterQuality || 'large'
		};

		const [popular, latest, recentlyAdded, mostViewed] = await Promise.all([
			this.getComics({ ...base, sort: 'score', order: 'desc' }),
			this.getComics({ ...base, sort: 'chapter_updated_at', order: 'desc' }),
			this.getComics({ ...base, sort: 'created_at', order: 'desc' }),
			this.getComics({ ...base, sort: 'views_30d', order: 'desc' })
		]);

		return { popular, latest, recentlyAdded, mostViewed30Days: mostViewed };
	}

	async getDetail(mangaInput) {
		const slug = ComixUtils.normalizeSlugInput(mangaInput);
		const mangaId = ComixUtils.extractMangaId(slug || mangaInput?.id || mangaInput);

		if (!mangaId) {
			throw new Error('Missing manga id or slug');
		}

		const data = await this.fetchMangaById(mangaId);
		const posterQuality = mangaInput?.posterQuality || 'large';
		const mappedInput = mangaInput && typeof mangaInput === 'object' && mangaInput.id && mangaInput.title ? mangaInput : null;
		const manga = data?.result || (data?.hid ? data : null);

		if (!manga) {
			if (mappedInput) {
				return new ComixItemResponse({ comix: this, item: mappedInput });
			}

			throw new Error('Comix detail not found');
		}

		return new ComixItemResponse({ comix: this, item: ComixUtils.mapManga(manga, posterQuality) });
	}

	async getChapters(mangaInput, options = {}) {
		const slug = ComixUtils.normalizeSlugInput(mangaInput);
		const mangaId = ComixUtils.extractMangaId(slug || mangaInput?.id || mangaInput);

		if (!mangaId) {
			throw new Error('Missing manga id or slug');
		}

		let fullSlug = slug || mangaId;

		if (!fullSlug.includes('-')) {
			const detail = await this.fetchMangaById(mangaId).catch(() => null);
			const manga = detail?.result || (detail?.hid ? detail : null);
			const url = manga?.url || '';
			const extracted = url.replace(/.*\/title\//, '').replace(/^\//, '');

			if (extracted) {
				fullSlug = extracted;
			}
		}

		if (options.pages) {
			return this.getChaptersPage(fullSlug, 1, options);
		}

		const deduplicate = options.deduplicate !== false;
		const cached = this.chaptersListCache.get(fullSlug);

		if (cached && Date.now() - cached.timestamp < Comix.CHAPTERS_CACHE_TTL) {
			const chapters = cached.items.map((chapter) => ComixUtils.mapChapter(chapter, fullSlug, this.webBase));
			const finalChapters = deduplicate ? ComixUtils.deduplicateChapters(chapters) : chapters;

			for (const ch of finalChapters) {
				this.chapterCache.set(String(ch.id), ch);
			}

			return new ComixResponse({
				comix: this,
				items: finalChapters,
				pageInfo: { page: 1, lastPage: 1, hasNext: false },
				context: { type: 'chapters', item: mangaInput }
			});
		}

		const titleUrl = `${this.webBase}/title/${fullSlug}`;
		const rawPayload = await ComixBrowserCapture.captureChapterList({ titleUrl });

		let items;

		try {
			const parsed = JSON.parse(rawPayload || '[]');

			items = Array.isArray(parsed) ? parsed : [];
		} catch {
			throw new Error('Failed to decode chapters payload: non-JSON response');
		}

		if (!items.length) {
			throw new Error('Failed to decode chapters payload');
		}

		this.chaptersListCache.set(fullSlug, { items, timestamp: Date.now() });

		const chapters = items.map((chapter) => ComixUtils.mapChapter(chapter, fullSlug, this.webBase));
		const finalChapters = deduplicate ? ComixUtils.deduplicateChapters(chapters) : chapters;

		for (const ch of finalChapters) {
			this.chapterCache.set(String(ch.id), ch);
		}

		return new ComixResponse({
			comix: this,
			items: finalChapters,
			pageInfo: { page: 1, lastPage: 1, hasNext: false },
			context: { type: 'chapters', item: mangaInput }
		});
	}

	async getChaptersPage(fullSlug, page = 1, options = {}) {
		const deduplicate = options.deduplicate !== false;
		const cacheKey = `${fullSlug}:page:${page}`;
		const cached = this.chaptersListCache.get(cacheKey);

		if (cached && Date.now() - cached.timestamp < Comix.CHAPTERS_CACHE_TTL) {
			const chapters = cached.items.map((chapter) => ComixUtils.mapChapter(chapter, fullSlug, this.webBase));
			const finalChapters = deduplicate ? ComixUtils.deduplicateChapters(chapters) : chapters;

			for (const ch of finalChapters) {
				this.chapterCache.set(String(ch.id), ch);
			}

			return new ComixResponse({
				comix: this,
				items: finalChapters,
				pageInfo: cached.pageInfo,
				context: {
					type: 'chapters',
					item: fullSlug,
					nextPage: cached.pageInfo.hasNext ? () => this.getChaptersPage(fullSlug, page + 1, options) : null,
					prevPage: page > 1 ? () => this.getChaptersPage(fullSlug, page - 1, options) : null
				}
			});
		}

		const titleUrl = `${this.webBase}/title/${fullSlug}`;
		const result = await ComixBrowserCapture.captureChapterPage({ titleUrl, page });

		const items = (result?.items || []).map((chapter) => ComixUtils.mapChapter(chapter, fullSlug, this.webBase));
		const finalItems = deduplicate ? ComixUtils.deduplicateChapters(items) : items;

		for (const ch of finalItems) {
			this.chapterCache.set(String(ch.id), ch);
		}

		const pageInfo = {
			page,
			lastPage: result?.lastPage || 1,
			hasNext: result?.hasNext ?? page < (result?.lastPage || 1),
			hasPrev: page > 1
		};

		this.chaptersListCache.set(cacheKey, { items: result?.items || [], pageInfo, timestamp: Date.now() });

		return new ComixResponse({
			comix: this,
			items: finalItems,
			pageInfo,
			context: {
				type: 'chapters',
				item: fullSlug,
				nextPage: pageInfo.hasNext ? () => this.getChaptersPage(fullSlug, page + 1, options) : null,
				prevPage: pageInfo.hasPrev ? () => this.getChaptersPage(fullSlug, page - 1, options) : null
			}
		});
	}

	async #fetchWithFallback(url) {
		const FALLBACK_PATHS = ['/si/', '/i/', '/sii/', '/ii/'];
		const SCRAMBLE_PATH_REGEX = /\/s?i+\//;

		const res = await fetch(url);

		if (res.status !== 404) {
			return res;
		}

		const fallbacks = FALLBACK_PATHS.map((path) => url.replace(SCRAMBLE_PATH_REGEX, path)).filter((u) => u !== url);

		for (const fallbackUrl of fallbacks) {
			const fallbackRes = await fetch(fallbackUrl);

			if (fallbackRes.status !== 404) {
				return fallbackRes;
			}
		}

		return res;
	}

	async getChapterPages(chapterInput) {
		const chapterId = ComixUtils.normalizeChapterInput(chapterInput);

		if (!chapterId) {
			throw new Error('Missing chapter id or url');
		}

		let chapterUrl;

		if (typeof chapterInput === 'object') {
			chapterUrl = chapterInput.url || chapterInput.chapterUrl;

			if (!chapterUrl && chapterInput.mangaSlug) {
				chapterUrl = `${this.webBase}/title/${chapterInput.mangaSlug}/${chapterId}-chapter-1`;
			}
		}

		if (!chapterUrl) {
			chapterUrl = `${this.webBase}/title/${chapterId}`;
		}

		const raw = await ComixBrowserCapture.captureChapterPages({ pageUrl: chapterUrl });

		let data;

		try {
			data = JSON.parse(raw || '{}');
		} catch {
			throw new Error('Failed to decode chapter pages: non-JSON response');
		}

		const payload = data?.payload || data;
		const pages = payload?.result?.pages || {};
		const baseUrl = (pages.baseUrl || '').replace(/\/+$/, '');
		const items = pages.items || [];
		const CONCURRENCY = 6;

		const tasks = items.map((page, index) => ({
			index,
			url: page.url.startsWith('http') ? page.url : `${baseUrl}/${page.url.replace(/^\/+/, '')}`,
			scrambled: page.s === 1
		}));

		const results = new Array(tasks.length);
		let cursor = 0;

		const worker = async () => {
			while (cursor < tasks.length) {
				const task = tasks[cursor++];

				let buffer = null;

				if (task.scrambled) {
					const res = await this.#fetchWithFallback(task.url);
					const headers = {};
					const rawHeaders = res.headers;

					if (rawHeaders.entries) {
						for (const [key, value] of rawHeaders.entries()) {
							headers[key.toLowerCase()] = value;
						}
					} else if (rawHeaders.get) {
						for (const key of ['x-scramble-seed', 'x-scramble-grid', 'x-scramble-algo', 'x-scramble-hash', 'x-enc-seed', 'x-enc-algo', 'x-enc-len']) {
							headers[key] = rawHeaders.get(key) || '';
						}
					}

					const rawBuf = Buffer.from(await res.arrayBuffer());

					buffer = await Descrambler.processPage(rawBuf, headers);
				} else {
					const res = await fetch(task.url);

					buffer = Buffer.from(await res.arrayBuffer());
				}

				results[task.index] = { index: task.index, url: task.url, scrambled: task.scrambled, buffer };
			}
		};

		await Promise.all(Array.from({ length: Math.min(CONCURRENCY, tasks.length) }, worker));

		return results;
	}
}

export { Comix, ComixItemResponse, ComixResponse, ComixUtils };

export const comix = new Comix();
