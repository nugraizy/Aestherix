import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { fetch } from 'undici';

puppeteer.use(StealthPlugin());

class ComixUtils {
	static get API_BASE() {
		return 'https://comix.to/api/v1';
	}

	static get WEB_BASE() {
		return 'https://comix.to';
	}

	static get DEFAULT_LIMIT() {
		return 28;
	}

	static get NSFW_GENRE_IDS() {
		return ['87264', '8', '87265', '13', '87266', '87267', '87268'];
	}

	static get DEFAULT_CONTENT_RATING() {
		return 'suggestive';
	}

	static get SORT_OPTIONS() {
		return [
			{ label: 'Best Match', value: 'relevance' },
			{ label: 'Latest update', value: 'chapter_updated_at' },
			{ label: 'Recently added', value: 'created_at' },
			{ label: 'Title', value: 'title' },
			{ label: 'Year', value: 'year' },
			{ label: 'Highest rated', value: 'score' },
			{ label: 'Most viewed - 7 days', value: 'views_7d' },
			{ label: 'Most viewed - 30 days', value: 'views_30d' },
			{ label: 'Most viewed - 90 days', value: 'views_90d' },
			{ label: 'Most viewed - all time', value: 'views_total' },
			{ label: 'Most followed', value: 'follows_total' }
		];
	}

	static get STATUS_OPTIONS() {
		return [
			{ label: 'Finished', value: 'finished' },
			{ label: 'Releasing', value: 'releasing' },
			{ label: 'On Hiatus', value: 'on_hiatus' },
			{ label: 'Discontinued', value: 'discontinued' },
			{ label: 'Not Yet Released', value: 'not_yet_released' }
		];
	}

	static get TYPE_OPTIONS() {
		return [
			{ label: 'Manga', value: 'manga' },
			{ label: 'Manhwa', value: 'manhwa' },
			{ label: 'Manhua', value: 'manhua' },
			{ label: 'Other', value: 'other' }
		];
	}

	static get DEMOGRAPHIC_OPTIONS() {
		return [
			{ label: 'Shounen', value: '2' },
			{ label: 'Shoujo', value: '1' },
			{ label: 'Seinen', value: '4' },
			{ label: 'Josei', value: '3' }
		];
	}

	static get GENRE_OPTIONS() {
		return [
			{ label: 'Romance', value: '23' },
			{ label: 'Drama', value: '11' },
			{ label: 'Comedy', value: '9' },
			{ label: 'Fantasy', value: '12' },
			{ label: 'Slice of Life', value: '25' },
			{ label: 'Action', value: '6' },
			{ label: 'Boys Love', value: '8' },
			{ label: 'Adventure', value: '7' },
			{ label: 'Adult', value: '87264' },
			{ label: 'Smut', value: '87268' },
			{ label: 'Psychological', value: '22' },
			{ label: 'Mystery', value: '20' },
			{ label: 'Historical', value: '14' },
			{ label: 'Mature', value: '87267' },
			{ label: 'Tragedy', value: '29' },
			{ label: 'Sci-Fi', value: '24' },
			{ label: 'Ecchi', value: '87265' },
			{ label: 'Horror', value: '15' },
			{ label: 'Girls Love', value: '13' },
			{ label: 'Isekai', value: '16' },
			{ label: 'Hentai', value: '87266' },
			{ label: 'Thriller', value: '28' },
			{ label: 'Sports', value: '26' },
			{ label: 'Crime', value: '10' },
			{ label: 'Philosophical', value: '21' },
			{ label: 'Mecha', value: '18' },
			{ label: 'Wuxia', value: '30' },
			{ label: 'Medical', value: '19' },
			{ label: 'Superhero', value: '27' },
			{ label: 'Magical Girls', value: '17' }
		];
	}

	static get FORMAT_OPTIONS() {
		return [
			{ label: '4-Koma', value: '93164' },
			{ label: 'Adaptation', value: '93167' },
			{ label: 'Anthology', value: '93165' },
			{ label: 'Award Winning', value: '93166' },
			{ label: 'Doujinshi', value: '93168' },
			{ label: 'Full Color', value: '93172' },
			{ label: 'Long Strip', value: '93170' },
			{ label: 'Oneshot', value: '93169' },
			{ label: 'Web Comic', value: '93171' }
		];
	}

	static get CONTENT_RATING_OPTIONS() {
		return [
			{ label: 'Safe only', value: 'safe' },
			{ label: 'Up to Suggestive', value: 'suggestive' },
			{ label: 'Up to Erotica', value: 'erotica' },
			{ label: 'Up to Pornographic', value: 'pornographic' }
		];
	}

	static buildYears(includeOlder) {
		const currentYear = new Date().getFullYear();
		const newest = currentYear + 1;
		const years = [];

		for (let year = newest; year >= 1928; year -= 1) {
			years.push({ label: String(year), value: String(year) });
		}

		if (includeOlder) {
			years.push({ label: 'Any', value: '' });
		}

		return years;
	}

	static appendParam(params, key, value) {
		if (value === undefined || value === null) {
			return;
		}

		if (Array.isArray(value)) {
			value.forEach((item) => ComixUtils.appendParam(params, key, item));
			return;
		}

		const stringValue = String(value);

		if (stringValue.length === 0) {
			return;
		}

		params.append(key, stringValue);
	}

	static applyFilters(params, filters, excludeNsfw) {
		if (!filters) {
			return;
		}

		ComixUtils.appendParam(params, 'authors[]', filters.authors);
		ComixUtils.appendParam(params, 'artists[]', filters.artists);
		ComixUtils.appendParam(params, 'statuses[]', filters.statuses);
		ComixUtils.appendParam(params, 'types[]', filters.types);

		if (filters.contentRating) {
			params.set('content_rating', filters.contentRating);
		} else if (!params.has('content_rating')) {
			params.set('content_rating', ComixUtils.DEFAULT_CONTENT_RATING);
		}

		if (filters.demographics) {
			ComixUtils.appendParam(params, 'demographics[]', filters.demographics.include);
			ComixUtils.appendParam(
				params,
				'demographics[]',
				(filters.demographics.exclude || []).map((value) => `-${value}`)
			);
		}

		if (filters.genres) {
			const included = filters.genres.include || [];
			const excluded = filters.genres.exclude || [];

			if (included.length > 0 || excluded.length > 0) {
				params.set('genres_mode', filters.genresMode || 'and');
			}

			ComixUtils.appendParam(params, 'genres_in[]', included);
			ComixUtils.appendParam(params, 'genres_ex[]', excluded);
		}

		if (filters.formats) {
			const included = filters.formats.include || [];
			const excluded = filters.formats.exclude || [];

			ComixUtils.appendParam(params, 'genres_in[]', included);
			ComixUtils.appendParam(params, 'genres_ex[]', excluded);
		}

		if (filters.minChapter !== undefined && filters.minChapter !== null && filters.minChapter !== '') {
			const minChapter = Number(filters.minChapter);

			if (!Number.isFinite(minChapter) || minChapter <= 0) {
				throw new Error('Minimum chapter length must be a positive number');
			}

			params.set('min_chap', String(Math.floor(minChapter)));
		}

		if (filters.releaseYear) {
			if (filters.releaseYear.from) {
				params.set('year_from', String(filters.releaseYear.from));
			}

			if (filters.releaseYear.to) {
				params.set('year_to', String(filters.releaseYear.to));
			}
		}

		if (excludeNsfw) {
			const explicitlyIncluded = new Set(filters.genres?.include || []);
			const blockedGenres = filters.blockedGenres || ComixUtils.NSFW_GENRE_IDS;

			blockedGenres.forEach((id) => {
				if (!explicitlyIncluded.has(id)) {
					params.append('genres_ex[]', id);
				}
			});
		}
	}

	static getPoster(poster, quality) {
		if (!poster) {
			return '';
		}

		switch (quality) {
			case 'large':
				return poster.large || poster.medium || poster.small || '';
			case 'small':
				return poster.small || poster.medium || poster.large || '';
			default:
				return poster.medium || poster.large || poster.small || '';
		}
	}

	static getMangaGenres(manga) {
		const values = [];

		if (manga.type === 'manhwa') {
			values.push('Manhwa');
		} else if (manga.type === 'manhua') {
			values.push('Manhua');
		} else if (manga.type === 'manga') {
			values.push('Manga');
		} else if (manga.type) {
			values.push('Other');
		}

		const genres = manga.genres || manga.genre || [];
		const tags = manga.tags || manga.theme || [];
		const demographics = manga.demographics || manga.demographic || [];
		const formats = manga.formats || [];

		genres.forEach((item) => values.push(item.title));
		demographics.forEach((item) => values.push(item.title));
		formats.forEach((item) => values.push(item.title));
		tags.forEach((item) => values.push(item.title));

		if (manga.contentRating === 'erotica' || manga.contentRating === 'pornographic') {
			values.push('NSFW');
		}

		return [...new Set(values)];
	}

	static mapManga(manga, posterQuality) {
		const slug = manga.url ? manga.url.replace('/title', '') : `/${manga.hid}`;
		const authors = manga.authors || manga.author || [];
		const artists = manga.artists || manga.artist || [];
		const altTitles = manga.altTitles || manga.alt_titles || [];

		return {
			id: manga.hid,
			title: manga.title,
			slug,
			poster: ComixUtils.getPoster(manga.poster, posterQuality),
			type: manga.type,
			status: manga.status,
			contentRating: manga.contentRating,
			authors: authors.map((a) => a.title),
			artists: artists.map((a) => a.title),
			genres: ComixUtils.getMangaGenres(manga),
			altTitles,
			synopsis: manga.synopsis || '',
			rating: manga.ratedAvg || 0,
			year: manga.year || null,
			originalUrl: manga.url || ''
		};
	}

	static parsePageInfo(result) {
		const meta = result.meta || result.pagination || {};
		const page = meta.page || 1;
		const lastPage = Math.max(meta.lastPage || 1, meta.last_page || 1);
		const hasNext = page < lastPage;

		return { page, lastPage, hasNext };
	}

	static buildMangaQuery({
		page = 1,
		limit = ComixUtils.DEFAULT_LIMIT,
		sort = 'score',
		order = 'desc',
		query,
		filters,
		excludeNsfw = true,
		defaultTypes,
		defaultDemographics
	} = {}) {
		const params = new URLSearchParams();

		params.set('limit', String(limit));
		params.set('page', String(page));

		if (query) {
			params.set('keyword', query);
			params.set('order[relevance]', 'desc');
		} else if (sort) {
			params.set(`order[${sort}]`, order === 'asc' ? 'asc' : 'desc');
		}

		ComixUtils.applyFilters(params, filters, excludeNsfw);

		if (!params.has('types[]') && defaultTypes?.length) {
			const allTypes = ComixUtils.TYPE_OPTIONS.map((t) => t.value);

			if (defaultTypes.length < allTypes.length) {
				defaultTypes.forEach((t) => params.append('types[]', t));
			}
		}

		if (!params.has('demographics[]') && defaultDemographics?.length) {
			const allDemos = ComixUtils.DEMOGRAPHIC_OPTIONS.map((d) => d.value);

			if (defaultDemographics.length < allDemos.length) {
				defaultDemographics.forEach((d) => params.append('demographics[]', d));
			}
		}

		return params;
	}

	static normalizeSlugInput(input) {
		if (typeof input === 'string') {
			if (input.startsWith('http://') || input.startsWith('https://')) {
				const parsed = new URL(input);
				const host = parsed.host.replace(/^www\./, '');

				if (host !== 'comix.to') {
					throw new Error('Unsupported Comix URL');
				}

				return parsed.pathname
					.replace(/^\//, '')
					.replace(/^title\//, '')
					.replace(/^manga\//, '')
					.split('/')[0];
			}

			return input
				.replace(/^\//, '')
				.replace(/^title\//, '')
				.replace(/^manga\//, '')
				.split('/')[0];
		}

		if (input && typeof input === 'object') {
			const candidate = input.slug || input.url || input.id || '';

			return typeof candidate === 'string' ? ComixUtils.normalizeSlugInput(candidate) : '';
		}

		return '';
	}

	static extractMangaId(slug) {
		if (!slug) {
			return '';
		}

		const cleaned = slug.replace(/^\//, '');
		const parts = cleaned.split('-');

		return parts[0] || cleaned;
	}

	static mapChapter(chapter, slug, webBase) {
		const number = String(chapter.number).replace(/\.0$/, '');
		const chapterSlug = `${chapter.id}-chapter-${number}`;

		return {
			id: chapter.id,
			number: chapter.number,
			name: chapter.name || `Chapter ${number}`,
			votes: chapter.votes || 0,
			createdAt: chapter.createdAtFormatted || '',
			isOfficial: chapter.isOfficial || false,
			groupId: chapter.group?.id || null,
			scanlator: chapter.group ? chapter.group.name : chapter.isOfficial ? 'Official' : 'Unknown',
			url: `${webBase}/title/${slug}/${chapterSlug}`,
			chapterSlug
		};
	}

	static deduplicateChapters(chapters) {
		const byNumber = new Map();

		for (const chapter of chapters) {
			const key = String(chapter.number).replace(/\.0$/, '');
			const current = byNumber.get(key);

			if (!current) {
				byNumber.set(key, chapter);
				continue;
			}

			const newIsOfficial = chapter.isOfficial;
			const currentIsOfficial = current.isOfficial;
			const newIsGroup10702 = chapter.groupId === 10702;
			const currentIsGroup10702 = current.groupId === 10702;

			let better = false;

			if (newIsOfficial && !currentIsOfficial) {
				better = true;
			} else if (!newIsOfficial && currentIsOfficial) {
				better = false;
			} else if (newIsGroup10702 && !currentIsGroup10702) {
				better = true;
			} else if (!newIsGroup10702 && currentIsGroup10702) {
				better = false;
			} else if ((chapter.votes || 0) > (current.votes || 0)) {
				better = true;
			} else if ((chapter.votes || 0) < (current.votes || 0)) {
				better = false;
			} else {
				better = chapter.id > current.id;
			}

			if (better) {
				byNumber.set(key, chapter);
			}
		}

		return Array.from(byNumber.values()).sort((a, b) => {
			const aNum = Number(String(a.number).replace(/\.0$/, ''));
			const bNum = Number(String(b.number).replace(/\.0$/, ''));

			if (Number.isFinite(aNum) && Number.isFinite(bNum) && aNum !== bNum) {
				return bNum - aNum;
			}

			return (b.votes || 0) - (a.votes || 0);
		});
	}

	static normalizeChapterInput(input) {
		if (typeof input === 'number') {
			return String(input);
		}

		if (typeof input === 'string') {
			if (input.startsWith('http://') || input.startsWith('https://')) {
				const parsed = new URL(input);
				const host = parsed.host.replace(/^www\./, '');

				if (host !== 'comix.to') {
					throw new Error('Unsupported Comix URL');
				}

				const segments = parsed.pathname.split('/').filter(Boolean);

				if (segments.length >= 3 && segments[0] === 'title') {
					const chapterSegment = segments[2] || '';

					if (!chapterSegment.includes('-')) {
						throw new Error('Outdated chapter URL. Please refresh the chapter list');
					}
				}

				const last = segments[segments.length - 1] || '';

				return last.split('-')[0] || '';
			}

			const cleaned = input.replace(/^\//, '');

			if (cleaned.includes('/')) {
				const parts = cleaned.split('/');
				const chapterSegment = parts[parts.length - 1] || '';

				if (!chapterSegment.includes('-')) {
					throw new Error('Outdated chapter URL. Please refresh the chapter list');
				}

				return chapterSegment.split('-')[0] || chapterSegment;
			}

			return cleaned.split('-')[0] || cleaned;
		}

		if (input && typeof input === 'object') {
			return input.chapterId || input.id || input.url || '';
		}

		return '';
	}

	static extractIdFromUrl(query) {
		try {
			const parsed = new URL(query);
			const host = parsed.host.replace(/^www\./, '');

			if (host !== 'comix.to') {
				return null;
			}

			if (parsed.pathname.startsWith('/title/')) {
				const raw = parsed.pathname.split('/')[2] || '';

				return raw.split('-')[0] || null;
			}

			return null;
		} catch {
			return null;
		}
	}
}

class ComixBrowserCapture {
	static get DEFAULT_HEADERS() {
		return {
			'User-Agent':
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
			'Accept-Language': 'en-US,en;q=0.9'
		};
	}

	static async configurePage(page) {
		await page.setUserAgent(ComixBrowserCapture.DEFAULT_HEADERS['User-Agent']);
		await page.setExtraHTTPHeaders({
			'Accept-Language': ComixBrowserCapture.DEFAULT_HEADERS['Accept-Language']
		});
		await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
	}

	static async captureChapterList({ titleUrl, timeoutMs = 60_000 }) {
		let browser = null;

		try {
			browser = await puppeteer.launch({
				headless: true,
				args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-blink-features=AutomationControlled']
			});

			const page = await browser.newPage();

			await ComixBrowserCapture.configurePage(page);

			let settled = false;
			let gotFirstPage = false;
			let firstPageItems = null;
			let firstPageHasNext = false;
			let resolveCapture;
			let rejectCapture;
			const capturePromise = new Promise((resolve, reject) => {
				resolveCapture = resolve;
				rejectCapture = reject;
			});

			const settleCapture = (payload) => {
				if (settled) {
					return;
				}

				settled = true;
				clearTimeout(timeout);
				resolveCapture(payload);
			};

			let timeout = setTimeout(
				() => rejectCapture(new Error(`Failed to capture decrypted payload from ${titleUrl}`)),
				timeoutMs
			);

			const resetTimeout = () => {
				clearTimeout(timeout);
				timeout = setTimeout(
					() => rejectCapture(new Error(`Failed to capture decrypted payload from ${titleUrl}`)),
					timeoutMs
				);
			};

			let fallbackStarted = false;

			page.on('response', (res) => {
				const url = res.url();
				const status = res.status();

				if (status === 403 && url.includes('/chapters') && gotFirstPage && !settled && !fallbackStarted) {
					fallbackStarted = true;
					page
						.evaluate(() => {
							if (typeof window.__comixStopPager === 'function') {
								window.__comixStopPager();
							}
						})
						.catch(() => {});
					ComixBrowserCapture._reloadFallback({ browser, titleUrl, firstPageItems, firstPageHasNext, timeoutMs })
						.then(settleCapture)
						.catch(() => {
							if (firstPageItems?.length) {
								settleCapture(JSON.stringify(firstPageItems));
							}
						});
				}
			});

			await page.exposeFunction('__COMIX_CHAPTERS__', (payload) => {
				settleCapture(payload);
			});

			await page.exposeFunction('__COMIX_RESET_TIMER__', () => {
				resetTimeout();
			});

			await page.exposeFunction('__COMIX_GOT_PAGE__', (pageJson) => {
				gotFirstPage = true;

				if (!firstPageItems) {
					try {
						const parsed = JSON.parse(pageJson);

						firstPageItems = parsed.items;
						firstPageHasNext = parsed.hasNext;
					} catch {
						// Ignore parsing error
					}
				}
			});

			const script = `
				(function(){
					if (window.__comixInit) return;
					window.__comixInit = true;
					try { console.log('comix:init'); } catch (e) {}
					var _seen = {};
					var _IFACE = window.__COMIX_CHAPTERS__;
					var _RESET = window.__COMIX_RESET_TIMER__;
					var _GOT_PAGE = window.__COMIX_GOT_PAGE__;
					var gotFirst = false;
					var lastHasNext = false;
					var curPage = 0;
					var _items = [];
					var _submitted = false;
					var _pagerInterval = null;
					var _p = JSON.parse;
					function _isChapters(o){
						if(!(o&&o.result&&o.result.items&&o.result.items.length)) return false;
						var it = o.result.items[0];
						return it && ('id' in it) && ('url' in it) && ('number' in it);
					}
					function _submit(){
						if (_submitted) return;
						_submitted = true;
						try { console.log('comix:submit', _items.length); } catch (e) {}
						try { _IFACE(JSON.stringify(_items)); } catch (e) {}
					}
					window.__comixStopPager = function(){
						if (_pagerInterval) { clearInterval(_pagerInterval); _pagerInterval = null; }
					};
					function _rewriteUrl(url){
						if (typeof url === 'string' && url.indexOf('/chapters') !== -1 && /[?&]limit=\\d+/.test(url)) {
							return url.replace(/([?&]limit=)\\d+/, '$1' + '100');
						}
						return url;
					}
					function _handle(o,t){
						try{
						if(!_isChapters(o)) return;
						var m = o.result.meta || o.result.pagination || {};
						var p = m.page || 1;
						gotFirst = true;
						lastHasNext = !!m.hasNext;
						if (p > curPage) curPage = p;
						if (_seen[p]) return;
						_seen[p] = true;
						try { console.log('comix:page', p, 'hasNext', !!m.hasNext); } catch (e) {}
						for (var i = 0; i < o.result.items.length; i++) _items.push(o.result.items[i]);
						try { _GOT_PAGE(JSON.stringify({ items: o.result.items, hasNext: !!m.hasNext })); } catch (e) {}
						if (m && m.hasNext) {
							try { _RESET(); } catch (e) {}
							_startPager();
						} else {
							_submit();
						}
						}catch(e){}
					}
					JSON.parse = function(){
						var r = _p.apply(this, arguments);
						try{ if (typeof arguments[0] === 'string') _handle(r, arguments[0]); }catch(e){}
						return r;
					};
					function _tryText(t){ try{ if (typeof t === 'string') _handle(_p(t), t); }catch(e){} }
					var _f = window.fetch;
					window.fetch = function(i,d){
						if (typeof i === 'string') i = _rewriteUrl(i);
						else if (i && typeof i.url === 'string') {
							var nu = _rewriteUrl(i.url);
							if (nu !== i.url) i = new Request(nu, i);
						}
						return _f.call(this,i,d).then(function(r){
							try{ r.clone().text().then(_tryText); }catch(e){}
							return r;
						});
					};
					var _x = XMLHttpRequest.prototype.open;
					XMLHttpRequest.prototype.open = function(m,u){
						arguments[1] = _rewriteUrl(u);
						var s = this;
						s.addEventListener('load', function(){ _tryText(s.responseText); });
						return _x.apply(this, arguments);
					};
					var _pagerStarted = false;
					function _startPager(){
						if (_pagerStarted) return;
						_pagerStarted = true;
						var acted = -1, idle = 0, safety = 0;
						_pagerInterval = setInterval(function(){
							if (++safety > 500) { clearInterval(_pagerInterval); return; }
							if (!gotFirst) return;
							if (!lastHasNext) { clearInterval(_pagerInterval); return; }
							if (acted === curPage) { if (++idle > 14) { acted = -1; idle = 0; } return; }
							var n = document.querySelector('.npager__nav[aria-label="Next page"]');
							if (n && !n.disabled) { acted = curPage; idle = 0; try { console.log('comix:next', curPage); } catch (e) {} n.click(); }
						}, 700);
					}
				})();
			`;

			await page.evaluateOnNewDocument(script);
			page.goto(titleUrl, { waitUntil: 'domcontentloaded', timeout: timeoutMs }).catch(() => {});
			page.evaluate(script).catch(() => {});

			const result = await capturePromise;

			await page.close();
			return result;
		} finally {
			if (browser) {
				await browser.close();
			}
		}
	}

	/**
	 * Reload-per-page fallback for chapter capture.
	 *
	 * When Cloudflare blocks in-page XHR pagination (403), this method
	 * fetches remaining pages by loading a fresh title page for each one.
	 * Each cold load passes Cloudflare's challenge, and a URL-rewrite hook
	 * changes `page=1` → `page=N` so the initial XHR requests the right page.
	 *
	 * @param {Object} options
	 * @param {import('puppeteer').Browser} options.browser - Existing browser instance
	 * @param {string} options.titleUrl - Title page URL
	 * @param {Array} options.firstPageItems - Items already captured from page 1
	 * @param {boolean} options.firstPageHasNext - Whether page 1 had hasNext=true
	 * @param {number} options.timeoutMs - Per-page timeout
	 * @returns {Promise<string>} JSON string of all chapter items
	 */
	static async _reloadFallback({ browser, titleUrl, firstPageItems, firstPageHasNext, timeoutMs }) {
		const allItems = [...(firstPageItems || [])];
		const MAX_PAGES = 50;
		const CONCURRENCY = 3;

		if (!firstPageHasNext) {
			return JSON.stringify(allItems);
		}

		let nextPage = 2;
		let done = false;

		while (!done && nextPage <= MAX_PAGES) {
			const batch = [];

			for (let i = 0; i < CONCURRENCY && nextPage + i <= MAX_PAGES; i++) {
				batch.push(nextPage + i);
			}

			const results = await Promise.all(
				batch.map((p) => ComixBrowserCapture._captureOnePage(browser, titleUrl, p, timeoutMs))
			);

			for (let i = 0; i < results.length; i++) {
				const pageData = results[i];
				const pageNum = batch[i];

				if (!pageData) {
					done = true;
					break;
				}

				allItems.push(...pageData.items);

				if (!pageData.hasNext) {
					done = true;
					break;
				}
			}

			nextPage += batch.length;
		}

		return JSON.stringify(allItems);
	}

	/**
	 * Capture a single page of chapters by loading a fresh title page
	 * with a URL-rewrite hook that redirects `page=1` to `page=N`.
	 *
	 * @param {import('puppeteer').Browser} browser
	 * @param {string} titleUrl
	 * @param {number} targetPage
	 * @param {number} timeoutMs
	 * @returns {Promise<{items: Array, hasNext: boolean}|null>}
	 */
	static async _captureOnePage(browser, titleUrl, targetPage, timeoutMs) {
		const context = await browser.createBrowserContext();
		const page = await context.newPage();

		await ComixBrowserCapture.configurePage(page);

		let result = null;
		let resolveResult;
		const resultPromise = new Promise((resolve) => {
			resolveResult = resolve;
		});

		await page.exposeFunction('__COMIX_PAGE_DATA__', (json) => {
			result = json;
			resolveResult();
		});

		await page.evaluateOnNewDocument(`
			(function(){
				var TARGET_PAGE = ${targetPage};
				var _p = JSON.parse;
				var captured = false;
				function _rewriteUrl(url){
					if (typeof url === 'string' && url.indexOf('/chapters') !== -1 && /[?&]page=/.test(url)) {
						url = url.replace(/([?&]page=)\\d+/, '$1' + TARGET_PAGE);
						url = url.replace(/([?&]limit=)\\d+/, '$1100');
					}
					return url;
				}
				function _tryCapture(text){
					if (captured) return;
					try {
						var o = _p(text);
						if (o && o.result && o.result.items && o.result.items.length) {
							var it = o.result.items[0];
							if (it && ('id' in it) && ('url' in it) && ('number' in it)) {
								captured = true;
								var m = o.result.meta || o.result.pagination || {};
								window.__COMIX_PAGE_DATA__(JSON.stringify({
									items: o.result.items,
									hasNext: !!m.hasNext
								}));
							}
						}
					} catch(e){}
				}
				JSON.parse = function(){
					var r = _p.apply(this, arguments);
					try { if (typeof arguments[0] === 'string') _tryCapture(arguments[0]); } catch(e){}
					return r;
				};
				window.fetch = (function(_f){
					return function(i,d){
						if (typeof i === 'string') i = _rewriteUrl(i);
						return _f.call(this,i,d).then(function(r){
							try{ r.clone().text().then(function(t){ _tryCapture(t); }); }catch(e){}
							return r;
						});
					};
				})(window.fetch);
				var _x = XMLHttpRequest.prototype.open;
				XMLHttpRequest.prototype.open = function(m,u){
					arguments[1] = _rewriteUrl(u);
					var s = this;
					s.addEventListener('load', function(){ _tryCapture(s.responseText); });
					return _x.apply(this, arguments);
				};
			})();
		`);

		try {
			await page.goto(titleUrl, { waitUntil: 'networkidle2', timeout: timeoutMs });
		} catch {
			// Ignore navigation errors
		}

		await Promise.race([resultPromise, new Promise((r) => setTimeout(r, 8000))]);

		await context.close();

		if (!result) {
			return null;
		}

		try {
			return JSON.parse(result);
		} catch {
			return null;
		}
	}

	static get PAGES_HOOK_SCRIPT() {
		return `
			(function(){
				var _done = false;
				var _IFACE = window.__COMIX_PAGES__;
				if (!_IFACE) return;
				var _p = JSON.parse;
				function _tryCapture(text) {
					if (_done) return;
					try {
						var obj = _p(text);
						if (obj && obj.result && obj.result.pages) {
							_done = true;
							_IFACE(text);
						}
					} catch (e) {}
				}
				JSON.parse = function() {
					var r = _p.apply(this, arguments);
					try {
						if (!_done && r && r.result && r.result.pages) {
							_done = true;
							_IFACE(arguments[0]);
						}
					} catch (e) {}
					return r;
				};
				var _f = window.fetch;
				window.fetch = function(i, d) {
					return _f.call(this, i, d).then(function(r) {
						try { r.clone().text().then(_tryCapture); } catch (e) {}
						return r;
					});
				};
				var _x = XMLHttpRequest.prototype.open;
				XMLHttpRequest.prototype.open = function(m, u) {
					var s = this;
					s.addEventListener('load', function() { _tryCapture(s.responseText); });
					return _x.apply(this, arguments);
				};
			})();
		`;
	}

	static async captureChapterPages({ pageUrl, timeoutMs = 30_000 }) {
		let browser = null;

		try {
			browser = await puppeteer.launch({
				headless: true,
				args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-blink-features=AutomationControlled']
			});

			const result = await ComixBrowserCapture._capturePagesDirect(browser, pageUrl, timeoutMs).catch(async () => {
				return ComixBrowserCapture._capturePagesIntercepted(browser, pageUrl, timeoutMs);
			});

			return result;
		} finally {
			if (browser) {
				await browser.close();
			}
		}
	}

	static async _capturePagesDirect(browser, pageUrl, timeoutMs) {
		const context = await browser.createBrowserContext();
		const page = await context.newPage();

		await ComixBrowserCapture.configurePage(page);

		let resolveCapture;
		let rejectCapture;
		const capturePromise = new Promise((resolve, reject) => {
			resolveCapture = resolve;
			rejectCapture = reject;
		});

		const timeout = setTimeout(() => rejectCapture(new Error(`Failed to capture chapter pages from ${pageUrl}`)), timeoutMs);

		await page.exposeFunction('__COMIX_PAGES__', (payload) => {
			clearTimeout(timeout);
			resolveCapture(payload);
		});

		const script = ComixBrowserCapture.PAGES_HOOK_SCRIPT;

		await page.evaluateOnNewDocument(script);
		page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: timeoutMs }).catch(() => {});
		page.evaluate(script).catch(() => {});

		try {
			return await capturePromise;
		} finally {
			await context.close();
		}
	}

	static async _capturePagesIntercepted(browser, pageUrl, timeoutMs) {
		const context = await browser.createBrowserContext();
		const page = await context.newPage();

		await ComixBrowserCapture.configurePage(page);

		let resolveCapture;
		let rejectCapture;
		const capturePromise = new Promise((resolve, reject) => {
			resolveCapture = resolve;
			rejectCapture = reject;
		});

		const timeout = setTimeout(() => rejectCapture(new Error(`Failed to capture chapter pages from ${pageUrl}`)), timeoutMs);

		await page.exposeFunction('__COMIX_PAGES__', (payload) => {
			clearTimeout(timeout);
			resolveCapture(payload);
		});

		await page.evaluateOnNewDocument(ComixBrowserCapture.PAGES_HOOK_SCRIPT);

		await page.setRequestInterception(true);
		const proxied = new Set();

		page.on('request', async (request) => {
			const url = request.url();

			if (url.includes('/api/v1/chapters/') && !url.includes('chapter-indexes') && !proxied.has(url)) {
				proxied.add(url);

				try {
					const proxyCtx = await browser.createBrowserContext();
					const proxyPage = await proxyCtx.newPage();

					await ComixBrowserCapture.configurePage(proxyPage);

					const response = await proxyPage.goto(url, { waitUntil: 'networkidle2', timeout: 20_000 });
					const headers = response?.headers() || {};
					const body = await proxyPage.evaluate(() => document.body.innerText);

					await proxyCtx.close();

					request.respond({
						status: 200,
						contentType: headers['content-type'] || 'application/json',
						headers: {
							'x-enc': headers['x-enc'] || '',
							'content-type': headers['content-type'] || 'application/json'
						},
						body
					});
				} catch {
					request.continue();
				}
			} else {
				request.continue();
			}
		});

		page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: timeoutMs }).catch(() => {});

		try {
			return await capturePromise;
		} finally {
			await context.close();
		}
	}
}

class ComixResponse {
	constructor({ comix, items, pageInfo, context }) {
		this.comix = comix;
		this.items = items || [];
		this.pageInfo = pageInfo || { page: 1, lastPage: 1, hasNext: false };
		this.context = context || {};
	}

	hasNext() {
		return Boolean(this.pageInfo?.hasNext);
	}

	nextPage() {
		if (typeof this.context.nextPage !== 'function') {
			throw new Error('No next page available');
		}

		return this.context.nextPage();
	}

	getDetail(index = 0) {
		if (!this.items.length) {
			throw new Error('No items available');
		}

		return this.comix.getDetail(this.items[index]);
	}

	getChapters(index = 0, options = {}) {
		if (this.context.type === 'detail' && this.context.item) {
			return this.comix.getChapters(this.context.item, options);
		}

		if (!this.items.length) {
			throw new Error('No items available');
		}

		return this.comix.getChapters(this.items[index], options);
	}

	getChapterPages(chapterInput) {
		if (!chapterInput && this.items.length) {
			return this.comix.getChapterPages(this.items[0]);
		}

		return this.comix.getChapterPages(chapterInput);
	}
}

class ComixItemResponse extends ComixResponse {
	constructor({ comix, item }) {
		super({
			comix,
			items: [item],
			pageInfo: { page: 1, lastPage: 1, hasNext: false },
			context: { type: 'detail', item }
		});
	}

	getDetail() {
		return Promise.resolve(this);
	}
}

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
		let browser = null;

		try {
			browser = await puppeteer.launch({
				headless: true,
				args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-blink-features=AutomationControlled']
			});

			const page = await browser.newPage();

			await ComixBrowserCapture.configurePage(page);

			const response = await page.goto(url, {
				waitUntil: 'networkidle2',
				timeout: 60_000
			});

			const status = response?.status() ?? 0;
			const text = await page.evaluate(() => document.body.innerText);

			await page.close();

			return {
				status,
				json: async () => JSON.parse(text)
			};
		} finally {
			if (browser) {
				await browser.close();
			}
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
			releaseYears: {
				from: ComixUtils.buildYears(true),
				to: ComixUtils.buildYears(false)
			}
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

	async fetchMangaList(params) {
		const url = new URL(`${this.apiBase}/manga`);

		url.search = params.toString();
		const data = await this.fetchJSON(url.toString());
		const items = data?.result?.items || [];
		const pageInfo = ComixUtils.parsePageInfo(data?.result || {});

		return { items, pageInfo };
	}

	fetchMangaById(id) {
		const url = new URL(`${this.apiBase}/manga/${id}`);

		return this.fetchJSON(url.toString());
	}

	async getComics(options = {}) {
		const params = ComixUtils.buildMangaQuery(options);
		const { items, pageInfo } = await this.fetchMangaList(params);
		const posterQuality = options.posterQuality || 'large';
		const mapped = items.map((manga) => ComixUtils.mapManga(manga, posterQuality));

		return new ComixResponse({
			comix: this,
			items: mapped,
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
			const data = await this.fetchMangaById(idFromUrl);
			const posterQuality = options.posterQuality || 'large';
			const manga = ComixUtils.mapManga(data.result, posterQuality);

			return new ComixResponse({
				comix: this,
				items: [manga],
				pageInfo: { page: 1, lastPage: 1, hasNext: false },
				context: { type: 'search', nextPage: null }
			});
		}

		const params = ComixUtils.buildMangaQuery({ ...options, query });
		const { items, pageInfo } = await this.fetchMangaList(params);
		const posterQuality = options.posterQuality || 'large';
		const mapped = items.map((manga) => ComixUtils.mapManga(manga, posterQuality));

		for (const manga of mapped) {
			this.mangaCache.set(String(manga.id), manga);
		}

		return new ComixResponse({
			comix: this,
			items: mapped,
			pageInfo,
			context: {
				type: 'search',
				nextPage: pageInfo.hasNext ? () => this.search(query, { ...options, page: pageInfo.page + 1 }) : null
			}
		});
	}

	async filter(filters = {}, options = {}) {
		const params = ComixUtils.buildMangaQuery({ ...options, filters });
		const { items, pageInfo } = await this.fetchMangaList(params);
		const posterQuality = options.posterQuality || 'large';
		const mapped = items.map((manga) => ComixUtils.mapManga(manga, posterQuality));

		return new ComixResponse({
			comix: this,
			items: mapped,
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

		return {
			popular,
			latest,
			recentlyAdded,
			mostViewed30Days: mostViewed
		};
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

		if (!data?.result) {
			if (mappedInput) {
				return new ComixItemResponse({ comix: this, item: mappedInput });
			}

			throw new Error('Comix detail not found');
		}

		const manga = ComixUtils.mapManga(data.result, posterQuality);

		return new ComixItemResponse({ comix: this, item: manga });
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
			const url = detail?.result?.url || '';
			const extracted = url.replace(/.*\/title\//, '').replace(/^\//, '');

			if (extracted) {
				fullSlug = extracted;
			}
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

		const parsed = JSON.parse(rawPayload || '[]');
		const items = Array.isArray(parsed) ? parsed : [];

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
		const data = JSON.parse(raw || '{}');
		const payload = data?.payload || data;
		const pages = payload?.result?.pages || {};
		const baseUrl = (pages.baseUrl || '').replace(/\/+$/, '');
		const items = pages.items || [];

		return items.map((page, index) => {
			const url = page.url.startsWith('http') ? page.url : `${baseUrl}/${page.url.replace(/^\/+/, '')}`;

			return { index, url };
		});
	}
}

export { Comix, ComixItemResponse, ComixResponse, ComixUtils };
