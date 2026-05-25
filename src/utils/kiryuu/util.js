import axios from 'axios';
import FormData from 'form-data';
import { imageToPdf } from '../converter/image.js';
import { cheerioLOAD } from '../modules/index.js';

const BASE_URL = 'https://v5.kiryuu.to';

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
	#axios = axios.create({
		baseURL: this.#base,
		headers: {
			'User-Agent':
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
			Referer: `${this.#base}/`
		}
	});

	async #getNonce() {
		if (this.#nonce) {
			return this.#nonce;
		}

		const { data } = await this.#axios.get(KiryuuUtils.API_NONCE);
		const $ = cheerioLOAD(data);
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
		const formData = new FormData();

		formData.append('nonce', nonce);
		formData.append('inclusion', 'OR');
		formData.append('exclusion', 'OR');
		formData.append('page', String(page));
		formData.append('genre', '[]');
		formData.append('genre_exclude', '[]');
		formData.append('author', '[]');
		formData.append('artist', '[]');
		formData.append('project', '0');
		formData.append('type', '[]');
		formData.append('status', '[]');
		formData.append('order', 'desc');
		formData.append('orderby', 'relevance');
		formData.append('query', keyword);

		const { data } = await this.#axios.post(KiryuuUtils.API_SEARCH, formData, {
			headers: formData.getHeaders()
		});

		return cheerioLOAD(data);
	}

	/**
	 * @param {string} query
	 * @returns {Promise<import('./types/kiryuu').KiryuuManga[]>}
	 */
	async searchManga(query) {
		const $ = await this.search(query, 1);
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

		const { data } = await this.#axios.get(KiryuuUtils.API_MANGA, { params });

		const mangaBySlug = new Map();

		for (const manga of Array.isArray(data) ? data : []) {
			mangaBySlug.set(manga.slug, KiryuuUtils.mapManga(manga));
		}

		return slugs.map((slug) => mangaBySlug.get(slug)).filter(Boolean);
	}

	/**
	 * @param {string} slug
	 * @returns {Promise<import('./types/kiryuu').KiryuuManga>}
	 */
	async getManga(slug) {
		const params = new URLSearchParams();

		params.append('slug[]', slug);
		params.append('_embed', '');

		const { data } = await this.#axios.get(KiryuuUtils.API_MANGA, { params });
		const manga = Array.isArray(data) ? data[0] : null;

		if (!manga) {
			throw new Error('Manga not found');
		}

		return KiryuuUtils.mapManga(manga);
	}

	/**
	 * @param {import('./types/kiryuu').KiryuuManga} manga
	 * @returns {Promise<import('./types/kiryuu').KiryuuChapter[]>}
	 */
	async getChapters(manga) {
		const mangaId = this.#extractMangaId(manga);

		const { data } = await this.#axios.get(`${this.#base}/wp-admin/admin-ajax.php`, {
			params: {
				manga_id: mangaId,
				page: 1,
				action: 'chapter_list'
			}
		});

		const $ = cheerioLOAD(data);
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

		return chapters.map((ch) => KiryuuUtils.mapChapter(ch));
	}

	/**
	 * @param {string} mangaId
	 * @returns {Promise<string>}
	 */
	async getMangaId(mangaId) {
		if (/^\d+$/.test(mangaId)) {
			return mangaId;
		}

		const { data } = await this.#axios.get(`${KiryuuUtils.WEB_MANGA}/${mangaId}/`);
		const $ = cheerioLOAD(data);
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
		const { data } = await this.#axios.get(chapterUrl);
		const $ = cheerioLOAD(data);
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
