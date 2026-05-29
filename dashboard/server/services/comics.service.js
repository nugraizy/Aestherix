import { randomBytes } from 'crypto';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const TOKEN_TTL = 30 * 60 * 1000;
const HOME_TTL = 60 * 60 * 1000;

const SOURCES = [
	{ value: 'shinigami', label: 'Shinigami' },
	{ value: 'kiryuu', label: 'Kiryuu' },
	{ value: 'atsumaru', label: 'Atsumaru' },
	{ value: 'komikcast', label: 'Komikcast' },
	{ value: 'comix', label: 'Comix' }
];

const REFERERS = {
	komikcast: 'https://v2.komikcast.fit/',
	shinigami: 'https://g.shinigami.asia/',
	atsumaru: 'https://atsu.moe',
	kiryuu: 'https://v5.kiryuu.to/',
	comix: 'https://comix.to/'
};

function selectField(id, label, options, def = '') {
	return { id, label, type: 'select', options: [{ value: '', label: 'All' }, ...options], default: def };
}

function sortField(options, def) {
	return { id: 'sort', label: 'Sort', type: 'select', options, default: def };
}

function orderField(def = 'desc') {
	return {
		id: 'order',
		label: 'Order',
		type: 'select',
		options: [
			{ value: 'desc', label: 'Descending' },
			{ value: 'asc', label: 'Ascending' }
		],
		default: def
	};
}

function multiField(id, label, options) {
	return { id, label, type: 'multi', options };
}

function toManga(m, overrides = {}) {
	return {
		title: m.title || '',
		poster: m.poster || '',
		synopsis: m.synopsis || m.description || '',
		status: m.status || '',
		type: m.type || '',
		authors: m.authors || [],
		artists: m.artists || [],
		genres: m.genres || [],
		rating: m.rating || null,
		...overrides
	};
}

const ADAPTERS = {
	shinigami: {
		async search(query) {
			const { shinigami } = await import('../../../src/utils/shinigami/index.js');
			const { items } = await shinigami.search(query);

			return items.map((m) => ({ id: m.id, title: m.title, poster: m.poster }));
		},
		async filters() {
			const { shinigami } = await import('../../../src/utils/shinigami/index.js');
			const f = shinigami.getFilters();

			return [
				sortField(f.sorts, 'popularity'),
				selectField('status', 'Status', f.statuses),
				selectField('format', 'Format', f.formats),
				selectField('type', 'Type', f.types),
				multiField('genre', 'Genre', f.genres)
			];
		},
		async home(page = 1, s = {}) {
			const { shinigami } = await import('../../../src/utils/shinigami/index.js');
			const { items, hasNext } = await shinigami.search('', {
				page,
				sort: s.sort || 'popularity',
				status: s.status || '',
				format: s.format || '',
				type: s.type || '',
				genreInclude: (s.genre || []).join(',')
			});

			return { items: items.map((m) => ({ id: m.id, title: m.title, poster: m.poster })), hasNext };
		},
		async detail(id) {
			const { shinigami } = await import('../../../src/utils/shinigami/index.js');
			const [manga, chapters] = await Promise.all([shinigami.getManga(id), shinigami.getChapters(id)]);

			return {
				manga: toManga(manga),
				chapters: chapters.map((c) => ({ id: c.id, number: c.number, name: c.name, scanlator: c.scanlator || null }))
			};
		},
		async pages(chapterId) {
			const { shinigami } = await import('../../../src/utils/shinigami/index.js');
			const pages = await shinigami.getPages(chapterId);

			return pages.map((p) => ({ url: p.url }));
		}
	},
	atsumaru: {
		async search(query) {
			const { atsumaru } = await import('../../../src/utils/atsumaru/index.js');
			const { items } = await atsumaru.search(query);

			return items.map((m) => ({ id: m.id, title: m.title, poster: m.poster }));
		},
		async filters() {
			const { atsumaru } = await import('../../../src/utils/atsumaru/index.js');
			const f = atsumaru.getFilters();

			return [
				sortField(f.sorts, f.sorts[0]?.value),
				multiField('status', 'Status', f.statuses),
				multiField('type', 'Type', f.types),
				multiField('genre', 'Genre', f.genres)
			];
		},
		async home(page = 1, s = {}) {
			const { atsumaru } = await import('../../../src/utils/atsumaru/index.js');
			const { items, hasNext } = await atsumaru.search('', {
				page,
				filters: {
					sort: s.sort || undefined,
					statuses: s.status || [],
					types: s.type || [],
					genres: { include: s.genre || [], exclude: [] }
				}
			});
			const mapped = items.map((m) => ({ id: m.id, title: m.title, poster: m.poster }));

			return { items: mapped, hasNext: hasNext ?? mapped.length > 0 };
		},
		async detail(id) {
			const { atsumaru } = await import('../../../src/utils/atsumaru/index.js');
			const [manga, chapters] = await Promise.all([atsumaru.getManga(id), atsumaru.getChapters(id)]);

			return {
				manga: toManga(manga),
				chapters: chapters.map((c) => ({
					id: `${id}/${c.id}`,
					number: c.number,
					name: c.name,
					scanlator: c.scanlator || null
				}))
			};
		},
		async pages(ref) {
			const { atsumaru } = await import('../../../src/utils/atsumaru/index.js');
			const [mangaId, chapterId] = ref.split('/');
			const pages = await atsumaru.getPages(mangaId, chapterId);

			return pages.map((p) => ({ url: p.url }));
		}
	},
	kiryuu: {
		async search(query) {
			const { kiryuu } = await import('../../../src/utils/kiryuu/index.js');
			const items = await kiryuu.searchManga(query);

			return (items || []).map((m) => ({ id: m.slug, title: m.title, poster: m.poster }));
		},
		async home(page = 1) {
			const { kiryuu } = await import('../../../src/utils/kiryuu/index.js');
			const items = await kiryuu.searchManga('', page);
			const mapped = (items || []).map((m) => ({ id: m.slug, title: m.title, poster: m.poster }));

			return { items: mapped, hasNext: mapped.length > 0 };
		},
		async detail(slug) {
			const { kiryuu } = await import('../../../src/utils/kiryuu/index.js');
			const manga = await kiryuu.getManga(slug);
			const chapters = await kiryuu.getChapters(manga);

			return {
				manga: toManga(manga),
				chapters: chapters.map((c) => ({
					id: c.url,
					number: String(c.number).match(/[\d.]+/)?.[0] || c.number,
					name: c.name,
					scanlator: c.scanlator || null
				}))
			};
		},
		async pages(url) {
			const { kiryuu } = await import('../../../src/utils/kiryuu/index.js');
			const pages = await kiryuu.getChapterPages(url);

			return pages.map((u) => ({ url: u }));
		}
	},
	komikcast: {
		async search(query) {
			const { komikcast } = await import('../../../src/utils/komikcast/index.js');
			const { items } = await komikcast.search(query);

			return items.map((m) => ({ id: m.slug, title: m.title, poster: m.poster }));
		},
		async filters() {
			return [
				sortField(
					[
						{ value: 'popularity', label: 'Popular' },
						{ value: 'latest', label: 'Latest' }
					],
					'popularity'
				),
				orderField('desc')
			];
		},
		async home(page = 1, s = {}) {
			const { komikcast } = await import('../../../src/utils/komikcast/index.js');
			const { items, hasNext } = await komikcast.list(page, s.sort || 'popularity', s.order || 'desc');

			return { items: items.map((m) => ({ id: m.slug, title: m.title, poster: m.poster })), hasNext };
		},
		async detail(slug) {
			const { komikcast } = await import('../../../src/utils/komikcast/index.js');
			const [manga, chapters] = await Promise.all([komikcast.getManga(slug), komikcast.getChapters(slug)]);

			return {
				manga: toManga(manga),
				chapters: chapters.map((c) => ({ id: `${slug}/${c.id}`, number: c.number, name: c.name, scanlator: null }))
			};
		},
		async pages(ref) {
			const { komikcast } = await import('../../../src/utils/komikcast/index.js');
			const [slug, chapterIndex] = ref.split('/');
			const pages = await komikcast.getPages(slug, chapterIndex);

			return pages.map((p) => ({ url: p.url }));
		}
	},
	comix: {
		async search(query) {
			const { comix } = await import('../../../src/utils/comix/index.js');
			const result = await comix.search(query, { limit: 10, excludeNsfw: true });

			return result.items.map((m) => ({ id: m.id, title: m.title, poster: m.poster }));
		},
		async filters() {
			const { comix } = await import('../../../src/utils/comix/index.js');
			const f = comix.getFilters();

			return [
				sortField(f.sorts, 'score'),
				orderField('desc'),
				multiField('status', 'Status', f.statuses),
				multiField('type', 'Type', f.types),
				multiField('demographic', 'Demographic', f.demographics),
				multiField('format', 'Format', f.formats),
				multiField('genre', 'Genre', f.genres)
			];
		},
		async home(page = 1, s = {}) {
			const { comix } = await import('../../../src/utils/comix/index.js');
			const result = await comix.getComics({
				page,
				limit: 24,
				sort: s.sort || 'score',
				order: s.order || 'desc',
				excludeNsfw: true,
				filters: {
					statuses: s.status || [],
					types: s.type || [],
					demographics: { include: s.demographic || [] },
					formats: { include: s.format || [] },
					genres: { include: s.genre || [] }
				}
			});

			return { items: result.items.map((m) => ({ id: m.id, title: m.title, poster: m.poster })), hasNext: result.hasNext() };
		},
		async detail(id) {
			const { comix } = await import('../../../src/utils/comix/index.js');
			const result = await comix.getDetail(id);
			const manga = result.items[0] || {};
			const chaptersRes = await comix.getChapters(id, { allPages: true, deduplicate: false });

			return {
				manga: toManga(manga),
				chapters: chaptersRes.items.map((c) => ({
					id: `${c.id}|${c.url}`,
					number: c.number,
					name: c.name,
					scanlator: c.scanlator || null
				}))
			};
		},
		async pages(ref) {
			const { comix } = await import('../../../src/utils/comix/index.js');
			const sep = ref.indexOf('|');
			const id = sep === -1 ? ref : ref.slice(0, sep);
			const url = sep === -1 ? undefined : ref.slice(sep + 1);
			const pages = await comix.getChapterPages({ id, chapterId: id, url });

			return pages.map((p) => ({ url: p.url, buffer: p.scrambled && p.buffer ? p.buffer : null }));
		}
	}
};

function getAdapter(source) {
	const adapter = ADAPTERS[source];

	if (!adapter) {
		throw new Error(`Unknown comic source: ${source}`);
	}

	return adapter;
}

function sortAscending(chapters) {
	return [...chapters].sort((a, b) => (Number(a.number) || 0) - (Number(b.number) || 0));
}

export function createComicsService() {
	const tokenCache = new Map();
	const homeCache = new Map();

	function pruneTokens() {
		const now = Date.now();

		for (const [token, entry] of tokenCache) {
			if (entry.expires < now) {
				tokenCache.delete(token);
			}
		}
	}

	async function fetchImage(source, url) {
		const headers = { 'User-Agent': UA };
		const referer = REFERERS[source];

		if (referer) {
			headers.Referer = referer;
		}

		const response = await fetch(url, { headers });

		if (!response.ok) {
			throw new Error(`Image fetch failed (${response.status})`);
		}

		return {
			buffer: Buffer.from(await response.arrayBuffer()),
			contentType: response.headers.get('content-type') || 'image/jpeg'
		};
	}

	return {
		getSources() {
			return SOURCES;
		},

		search(source, query) {
			return getAdapter(source).search(query);
		},

		getFilters(source) {
			const adapter = getAdapter(source);

			return adapter.filters ? adapter.filters() : Promise.resolve([]);
		},

		async getHome(source, page = 1, selected = {}) {
			const cacheKey = `${source}:${page}:${JSON.stringify(selected)}`;
			const cached = homeCache.get(cacheKey);

			if (cached && cached.expires > Date.now()) {
				return cached.value;
			}

			const adapter = getAdapter(source);
			const value = adapter.home ? await adapter.home(page, selected) : { items: [], hasNext: false };

			if (value.items.length) {
				homeCache.set(cacheKey, { value, expires: Date.now() + HOME_TTL });
			}

			return value;
		},

		async getDetail(source, id) {
			const { manga, chapters } = await getAdapter(source).detail(id);

			return { manga, chapters: sortAscending(chapters) };
		},

		async getPages(source, ref) {
			const pages = await getAdapter(source).pages(ref);

			if (tokenCache.size > 1000) {
				pruneTokens();
			}

			return pages.map((page) => {
				if (page.buffer) {
					const token = randomBytes(12).toString('hex');

					tokenCache.set(token, { buffer: page.buffer, contentType: 'image/jpeg', expires: Date.now() + TOKEN_TTL });

					return { token };
				}

				return { url: page.url };
			});
		},

		getImageByToken(token) {
			const entry = tokenCache.get(token);

			if (!entry || entry.expires < Date.now()) {
				tokenCache.delete(token);

				return null;
			}

			return entry;
		},

		fetchImage,

		async buildPdf(source, refs) {
			const { imageToPdf } = await import('../../../src/utils/converter/image.js');
			const adapter = getAdapter(source);
			const inputs = [];

			for (const ref of refs) {
				const pages = await adapter.pages(ref);

				for (const page of pages) {
					if (page.buffer) {
						inputs.push(page.buffer);
					} else {
						inputs.push((await fetchImage(source, page.url)).buffer);
					}
				}
			}

			if (!inputs.length) {
				throw new Error('No pages found for the selected chapter(s).');
			}

			return imageToPdf(inputs);
		}
	};
}
