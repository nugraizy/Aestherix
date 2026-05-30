import { imageToPdf } from '../converter/image.js';
import { cfFetchJSON, cfFetchText, cfPostForm } from '../modules/cloudflare.js';
import { cheerioLOAD } from '../modules/index.js';

const BASE_URL = 'https://v5.kiryuu.to';
const REFERER = { Referer: `${BASE_URL}/` };

export class KiryuuUtils {
	static get API_SEARCH() {
		return `${BASE_URL}/wp-admin/admin-ajax.php?action=advanced_search`;
	}

	static get API_NONCE() {
		return `${BASE_URL}/wp-admin/admin-ajax.php?type=search_form&action=get_nonce`;
	}

	static get API_MANGA() {
		return `${BASE_URL}/wp-json/wp/v2/manga`;
	}

	static get API_GENRE() {
		return `${BASE_URL}/wp-json/wp/v2/genre`;
	}

	static get WEB_MANGA() {
		return `${BASE_URL}/manga`;
	}

	/**
	 * @param {string} description
	 * @returns {string | null}
	 */
	static extractMangaIdFromDescription(description) {
		if (!description) {
			return null;
		}

		const match = description.match(/ID: (\d+)/);

		return match ? match[1] : null;
	}

	/**
	 * @param {{ id?: number | string, slug?: string }} manga
	 * @returns {string}
	 */
	static getMangaUrl(manga) {
		if (manga.slug) {
			return `${KiryuuUtils.WEB_MANGA}/${manga.slug}/`;
		}

		return `${BASE_URL}/manga/${manga.id}/`;
	}

	/**
	 * @param {string} href
	 * @returns {string | null}
	 */
	static extractSlugFromHref(href) {
		try {
			const url = new URL(href);
			const segments = url.pathname.split('/').filter(Boolean);
			const mangaIndex = segments.indexOf('manga');

			if (mangaIndex >= 0 && segments[mangaIndex + 1]) {
				return segments[mangaIndex + 1];
			}

			return null;
		} catch {
			return null;
		}
	}

	/**
	 * @param {any[]} termGroup
	 * @param {string} taxonomy
	 * @returns {string[]}
	 */
	static getTerms(termGroup, taxonomy) {
		const group = termGroup.find((arr) => Array.isArray(arr) && arr[0]?.taxonomy === taxonomy);

		return (group || []).map((t) => t.name).filter(Boolean);
	}

	/**
	 * @param {any} manga
	 * @returns {import('./types/kiryuu').KiryuuManga}
	 */
	static mapManga(manga) {
		const slug = manga.slug || '';
		const altTitles = manga.alternate_titles || manga.alt_titles || [];
		const embedded = manga._embedded || {};
		const terms = embedded['wp:term'] || [];
		const genres = KiryuuUtils.getTerms(terms, 'genre');
		const authors = KiryuuUtils.getTerms(terms, 'series-author');
		const artists = KiryuuUtils.getTerms(terms, 'artist');
		const types = KiryuuUtils.getTerms(terms, 'type');
		const statuses = KiryuuUtils.getTerms(terms, 'status');

		return {
			id: String(manga.id),
			slug,
			title: manga.title?.rendered || manga.title || '',
			poster: embedded['wp:featuredmedia']?.[0]?.source_url || '',
			type: types.join(', ') || undefined,
			status: statuses[0] || undefined,
			rating: 0,
			authors,
			artists,
			genres,
			altTitles,
			synopsis:
				manga.excerpt?.rendered?.replace(/<[^>]+>/g, '').trim() || manga.description?.replace(/<[^>]+>/g, '').trim() || '',
			originalUrl: `${KiryuuUtils.WEB_MANGA}/${slug}/`
		};
	}

	/**
	 * @param {any} chapter
	 * @returns {import('./types/kiryuu').KiryuuChapter}
	 */
	static mapChapter(chapter) {
		const number = chapter.title || chapter.name || '';
		const chapterSlug = chapter.chapter_slug || chapter.link || '';

		return {
			id: chapterSlug,
			number,
			name: chapter.subtitle || chapter.name || '',
			date_upload: chapter.date || '',
			scanlator: chapter.scanlator || 'Unknown',
			url: chapter.link || ''
		};
	}
}

export class Kiryuu {
	#base = BASE_URL;
	#nonce = null;
	#mangaCache = new Map();
	#chapterCache = new Map();

	async #getNonce() {
		if (this.#nonce) {
			return this.#nonce;
		}

		const html = await cfFetchText(KiryuuUtils.API_NONCE, { headers: REFERER });
		const $ = cheerioLOAD(html);
		const nonce = $('input[name=search_nonce]').attr('value');

		if (!nonce) {
			throw new Error('Unable to get nonce');
		}

		this.#nonce = nonce;
		return nonce;
	}

	/**
	 * @param {string} keyword
	 * @param {number} page
	 * @returns {Promise<any>}
	 */
	async search(keyword, page = 1) {
		const nonce = await this.#getNonce();
		const fields = {
			nonce,
			inclusion: 'OR',
			exclusion: 'OR',
			page: String(page),
			genre: '[]',
			genre_exclude: '[]',
			author: '[]',
			artist: '[]',
			project: '0',
			type: '[]',
			status: '[]',
			order: 'desc',
			orderby: 'relevance',
			query: keyword
		};

		const html = await cfPostForm(KiryuuUtils.API_SEARCH, fields, { originUrl: `${BASE_URL}/`, headers: REFERER });

		return cheerioLOAD(html);
	}

	/**
	 * @param {string} query
	 * @returns {Promise<import('./types/kiryuu').KiryuuManga[]>}
	 */
	async searchManga(query, page = 1) {
		const pageNum = typeof page === 'number' ? page : (page?.page ?? 1);
		const $ = await this.search(query, pageNum);
		const items = $('div > a[href*=/manga/]:has(> img)');
		const slugs = items
			.map((_, el) => {
				const href = $(el).attr('href');

				if (!href) {
					return null;
				}

				return KiryuuUtils.extractSlugFromHref(href);
			})
			.get()
			.filter(Boolean);

		if (!slugs.length) {
			return [];
		}

		const params = new URLSearchParams();

		slugs.forEach((slug) => params.append('slug[]', slug));
		params.append('per_page', String(slugs.length + 1));
		params.append('_embed', '');

		const data = await cfFetchJSON(`${KiryuuUtils.API_MANGA}?${params.toString()}`, { headers: REFERER });

		const mangaBySlug = new Map();

		for (const manga of Array.isArray(data) ? data : []) {
			mangaBySlug.set(manga.slug, KiryuuUtils.mapManga(manga));
		}

		return slugs.map((slug) => mangaBySlug.get(slug)).filter(Boolean);
	}

	/**
	 * Lightweight list result (slug/title/poster) parsed straight from the search HTML,
	 * skipping the slow `_embed` wp-json enrich. Use for grids; call getManga() for details.
	 *
	 * @param {string} keyword
	 * @param {number} [page]
	 * @returns {Promise<Array<{ slug: string, title: string, poster: string }>>}
	 */
	async searchBasic(keyword, page = 1) {
		const $ = await this.search(keyword, page);
		const seen = new Set();

		return $('a[href*=/manga/]:has(> img)')
			.map((_, el) => {
				const $el = $(el);
				const slug = KiryuuUtils.extractSlugFromHref($el.attr('href') || '');

				if (!slug || seen.has(slug)) {
					return null;
				}

				seen.add(slug);
				const img = $el.find('img').first();

				return { slug, title: img.attr('alt') || slug, poster: (img.attr('src') || '').replace(/^http:/, 'https:') };
			})
			.get()
			.filter(Boolean);
	}

	/**
	 * @param {string} slug
	 * @returns {Promise<import('./types/kiryuu').KiryuuManga>}
	 */
	async getManga(slug) {
		if (this.#mangaCache.has(slug)) {
			return this.#mangaCache.get(slug);
		}

		const params = new URLSearchParams();

		params.append('slug[]', slug);
		params.append('_embed', '');

		const data = await cfFetchJSON(`${KiryuuUtils.API_MANGA}?${params.toString()}`, { headers: REFERER });
		const manga = Array.isArray(data) ? data[0] : null;

		if (!manga) {
			throw new Error('Manga not found');
		}

		const result = KiryuuUtils.mapManga(manga);

		this.#mangaCache.set(slug, result);

		return result;
	}

	/**
	 * @param {import('./types/kiryuu').KiryuuManga} manga
	 * @returns {Promise<import('./types/kiryuu').KiryuuChapter[]>}
	 */
	async getChapters(manga) {
		const mangaId = this.#extractMangaId(manga);

		if (this.#chapterCache.has(mangaId)) {
			return this.#chapterCache.get(mangaId);
		}

		const html = await cfFetchText(`${this.#base}/wp-admin/admin-ajax.php?manga_id=${mangaId}&page=1&action=chapter_list`, {
			headers: REFERER
		});

		const $ = cheerioLOAD(html);
		const chapters = $('div a:has(time)')
			.map((_, el) => {
				const link = $(el).attr('href') || '';
				const parts = link.split('/').filter(Boolean);
				const chapterSlug = parts.pop() || '';

				return {
					link: link,
					chapter_slug: chapterSlug,
					title: $(el).find('span').first().text().trim() || chapterSlug,
					subtitle: $(el).find('span').first().text().trim() || '',
					date: $(el).find('time').attr('datetime') || '',
					scanlator: 'Unknown'
				};
			})
			.get();

		const result = chapters.map((ch) => KiryuuUtils.mapChapter(ch));

		this.#chapterCache.set(mangaId, result);

		return result;
	}

	/**
	 * @param {string} mangaId
	 * @returns {Promise<string>}
	 */
	async getMangaId(mangaId) {
		if (/^\d+$/.test(mangaId)) {
			return mangaId;
		}

		const html = await cfFetchText(`${KiryuuUtils.WEB_MANGA}/${mangaId}/`, { headers: REFERER });
		const $ = cheerioLOAD(html);
		const galleryList = $('#gallery-list');

		if (galleryList.length) {
			const hxGet = galleryList.attr('hx-get') || '';
			const match = hxGet.match(/manga_id=(\d+)/);

			if (match) {
				return match[1];
			}
		}

		return mangaId;
	}

	/**
	 * @param {import('./types/kiryuu').KiryuuManga | string} manga
	 * @returns {string}
	 */
	#extractMangaId(manga) {
		if (typeof manga === 'string') {
			const idFromDesc = KiryuuUtils.extractMangaIdFromDescription(manga);

			if (idFromDesc) {
				return idFromDesc;
			}

			return manga;
		}

		const idFromDesc = KiryuuUtils.extractMangaIdFromDescription(manga.synopsis);

		if (idFromDesc) {
			return idFromDesc;
		}

		return manga.id;
	}

	/**
	 * @param {string} chapterUrl
	 * @returns {Promise<string[]>}
	 */
	async getChapterPages(chapterUrl) {
		const html = await cfFetchText(chapterUrl, { headers: REFERER });
		const $ = cheerioLOAD(html);
		const pages = $('main .relative section > img')
			.map((_, el) => $(el).attr('src') || $(el).attr('data-src') || '')
			.get();

		return pages.filter(Boolean);
	}

	/**
	 * @param {string[]} imageUrls
	 * @returns {Promise<Buffer>}
	 */
	async toPdf(imageUrls) {
		return imageToPdf(imageUrls);
	}
}
