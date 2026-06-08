<script>
	import { createEventDispatcher, onDestroy, onMount, tick } from 'svelte';
	import { get } from '../../lib/api.js';
	import { highlight } from '../../lib/highlight.js';
	import { createQueryState, loadLocal, saveLocal } from '../../lib/urlState.js';
	import { showError } from '../../lib/toast.js';
	import Dropdown from '../ui/Dropdown.svelte';
	import SkeletonCard from '../ui/SkeletonCard.svelte';
	import Slider from '../ui/Slider.svelte';
	import Toggle from '../ui/Toggle.svelte';
	import Tooltip from '../ui/Tooltip.svelte';

	const API = '/api/dashboard';
	const dispatch = createEventDispatcher();
	const SOURCES = [
		{ value: 'shinigami', label: 'Shinigami' },
		{ value: 'kiryuu', label: 'Kiryuu' },
		{ value: 'atsumaru', label: 'Atsumaru' },
		{ value: 'komikcast', label: 'Komikcast' },
		{ value: 'comix', label: 'Comix' }
	];
	const BOOKMARKS_KEY = 'aestherix.tools.comics.bookmarks';
	const READER_SETTINGS_KEY = 'aestherix.tools.comics.reader';
	const PROGRESS_KEY = 'aestherix.tools.comics.progress';
	const HISTORY_KEY = 'aestherix.tools.comics.history';
	const LAST_KEY = 'aestherix.tools.comics.last';
	const CHAPTER_BOOKMARKS_KEY = 'aestherix.tools.comics.chapter-bookmarks';

	const comicQuery = createQueryState('c_', {
		src: { type: 'string', default: '' },
		id:  { type: 'string', default: '' },
		ch:  { type: 'string', default: '' }
	});

	const _initUrl = comicQuery.read();
	const _initLast = loadLocal(LAST_KEY);
	const _initId = _initUrl.id || _initLast.id || '';

	let source = 'shinigami';
	let view = _initId && _initUrl.ch ? 'reader' : _initId ? 'chapters' : 'search';
	let loading = view === 'reader';
	let query = '';
	let results = [];
	let isHome = true;
	let homePage = 1;
	let homeHasNext = false;
	let loadingMore = false;
	let popularFilter = '';
	let historyFilter = '';
	let filterDefs = [];
	let activeFilters = {};
	let draftFilters = {};
	let showFilters = false;
	let manga = null;
	let chapters = [];
	let segments = [];
	let activeSegIndex = 0;
	let loadingNext = false;
	let loadingPrev = false;
	let adjusting = false;
	const KEEP_BEHIND = 2;
	const KEEP_AHEAD = 6;
	let chapterIndex = -1;
	let restored = false;
	let error = '';
	let pdfBusy = false;
	let groupFilter = 'all';
	let dedup = false;
	let sortAsc = true;
	let bookmarks = loadBookmarks();
	let chapterBookmarks = loadChapterBookmarks();
	let bookmarkOnly = false;
	let progress = loadProgress();
	let readHistory = loadHistory();
	let showHistory = false;

	let readerBody;
	let autoScroll = false;
	let autoEnabled = false;
	let scrubIndex = 0;
	let scrubTotal = 0;
	let scrubbing = false;
	let scrollFrame = null;
	let showReaderSettings = false;
	let settingsWrap;
	let showReaderFilters = false;
	let readerFiltersWrap;
	let showGoUp = false;
	let barHidden = false;
	let barHeight = 0;
	let lastScrollTop = 0;
	let pinFrame = null;
	let clickScrollFrame = null;
	let pagesCache = {};
	const readerSettings = loadReaderSettings();
	let autoSpeed = readerSettings.autoSpeed ?? 3;
	let clickToScroll = readerSettings.clickToScroll ?? true;
	let doomMode = readerSettings.doomMode ?? false;

	$: persistReaderSettings(autoSpeed, clickToScroll, doomMode);

	$: scanlators = [...new Set(chapters.map((c) => c.scanlator).filter(Boolean))];
	$: groupOptions = [{ value: 'all', label: 'All groups' }, ...scanlators.map((s) => ({ value: s, label: s }))];
	$: bmSet = manga ? chapterBookmarks[bookmarkKey(manga)] || {} : {};
	$: filteredChapters = applyChapterFilters(chapters, groupFilter, dedup, sortAsc).filter((c) => !bookmarkOnly || bmSet[c.id]);
	$: currentChapter = segments[activeSegIndex]?.chapter || (chapterIndex >= 0 ? filteredChapters[chapterIndex] : null);
	$: hasNextChapter = segments.length ? segments[segments.length - 1].chapterIndex < filteredChapters.length - 1 : false;
	$: mangaProgress = (manga && progress[bookmarkKey(manga)]) || {};
	$: historyList = Object.values(readHistory).sort((a, b) => (b.time || 0) - (a.time || 0));
	$: filteredHistory = historyFilter.trim()
		? historyList.filter((h) => (h.title || '').toLowerCase().includes(historyFilter.trim().toLowerCase()))
		: historyList;
	$: displayed = isHome && popularFilter.trim()
		? results.filter((m) => (m.title || '').toLowerCase().includes(popularFilter.trim().toLowerCase()))
		: results;
	$: if (restored) syncUrl(source, view, manga, currentChapter);
	$: chapterOptions = filteredChapters.map((c, i) => ({ value: i, label: chapterLabel(c) }));

	function chapterLabel(c) {
		const base = `Ch. ${c.number}`;
		return c.name && c.name !== `Chapter ${c.number}` ? `${base} — ${c.name}` : base;
	}

	function applyChapterFilters(list, group, dd, asc) {
		let out = group === 'all' ? list : list.filter((c) => (c.scanlator || '') === group);

		if (dd) {
			const seen = new Set();

			out = out.filter((c) => {
				const key = String(c.number);

				if (seen.has(key)) return false;
				seen.add(key);

				return true;
			});
		}

		return asc ? out : [...out].reverse();
	}

	function loadBookmarks() {
		try {
			return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '{}');
		} catch {
			return {};
		}
	}

	function loadChapterBookmarks() {
		try {
			return JSON.parse(localStorage.getItem(CHAPTER_BOOKMARKS_KEY) || '{}');
		} catch {
			return {};
		}
	}

	function toggleChapterBookmark(chapter) {
		if (!manga) return;

		const key = bookmarkKey(manga);
		const saved = { ...(chapterBookmarks[key] || {}) };

		if (saved[chapter.id]) delete saved[chapter.id];
		else saved[chapter.id] = true;

		chapterBookmarks = { ...chapterBookmarks, [key]: saved };

		try {
			localStorage.setItem(CHAPTER_BOOKMARKS_KEY, JSON.stringify(chapterBookmarks));
		} catch {
			// ignore storage failures
		}
	}

	function loadProgress() {
		try {
			return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
		} catch {
			return {};
		}
	}

	function loadHistory() {
		try {
			return JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}');
		} catch {
			return {};
		}
	}

	function clearHistory() {
		readHistory = {};
		try {
			localStorage.removeItem(HISTORY_KEY);
		} catch {
			// ignore
		}
	}

	function openHistory(entry) {
		source = entry.source;
		showHistory = false;
		loadFilterDefs();
		openManga({ id: entry.id, title: entry.title, poster: entry.poster });
	}

	function ago(t) {
		const s = (Date.now() - (t || 0)) / 1000;

		if (s < 60) return 'just now';
		if (s < 3600) return `${Math.floor(s / 60)}m ago`;
		if (s < 86400) return `${Math.floor(s / 3600)}h ago`;

		return `${Math.floor(s / 86400)}d ago`;
	}

	function updateProgress(chapterId, page, total) {
		if (!manga) return;
		const key = bookmarkKey(manga);
		const map = progress[key] || {};
		const cur = map[chapterId];
		const nextPage = Math.max(cur?.page ?? 0, page);

		if (cur && cur.page === nextPage && cur.total === total) return;

		progress = { ...progress, [key]: { ...map, [chapterId]: { page: nextPage, total } } };

		try {
			localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
		} catch {
			// ignore storage failures
		}
	}

	function chapterDone(p) {
		return p?.total ? p.page + 1 >= p.total : false;
	}

	function loadReaderSettings() {
		try {
			return JSON.parse(localStorage.getItem(READER_SETTINGS_KEY) || '{}');
		} catch {
			return {};
		}
	}

	function persistReaderSettings(speed, click, doom) {
		try {
			localStorage.setItem(READER_SETTINGS_KEY, JSON.stringify({ autoSpeed: speed, clickToScroll: click, doomMode: doom }));
		} catch {
			// ignore storage failures
		}
	}

	function tickScroll() {
		if (!autoScroll || !readerBody) {
			scrollFrame = null;
			return;
		}

		readerBody.scrollTop += autoSpeed;

		if (readerBody.scrollTop + readerBody.clientHeight >= readerBody.scrollHeight - 1) {
			autoScroll = false;
			autoEnabled = false;
			scrollFrame = null;
			return;
		}

		scrollFrame = requestAnimationFrame(tickScroll);
	}

	function startAuto() {
		autoScroll = true;
		if (!scrollFrame) scrollFrame = requestAnimationFrame(tickScroll);
	}

	function setAutoEnabled(on) {
		autoEnabled = on;
		if (on) {
			showReaderSettings = false;
			barHidden = true;
			startAuto();
		} else {
			autoScroll = false;
		}
	}

	function pauseAutoScroll() {
		autoScroll = false;
	}

	function handleReaderClick(e) {
		if (!readerBody) return;
		if (e.target.closest('button, a, input')) return;

		if (autoEnabled) {
			if (autoScroll) autoScroll = false;
			else startAuto();
			return;
		}

		if (!clickToScroll) return;

		cancelPin();

		const h = readerBody.clientHeight;
		const rect = readerBody.getBoundingClientRect();
		const dir = e.clientY - rect.top < h * 0.25 ? -1 : 1;

		animateScrollBy(dir * h * 0.85);
	}

	function scrubTo(idx) {
		cancelPin();

		const target = readerBody?.querySelector(`img.page[data-seg="${activeSegIndex}"][data-pi="${idx}"]`);

		if (target) {
			readerBody.scrollTop += target.getBoundingClientRect().top - readerBody.getBoundingClientRect().top;
		}
	}

	function animateScrollBy(delta) {
		if (clickScrollFrame) cancelAnimationFrame(clickScrollFrame);

		const duration = 260;
		const t0 = performance.now();
		let moved = 0;

		const step = (t) => {
			const p = Math.min(1, (t - t0) / duration);
			const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
			const want = delta * eased;

			readerBody.scrollTop += want - moved;
			moved = want;
			clickScrollFrame = p < 1 ? requestAnimationFrame(step) : null;
		};

		clickScrollFrame = requestAnimationFrame(step);
	}

	function bookmarkKey(item) {
		return `${source}/${item.id}`;
	}

	function saveBookmark(chapter) {
		if (!manga) return;
		const key = bookmarkKey(manga);

		bookmarks = { ...bookmarks, [key]: { ref: chapter.id, number: chapter.number, name: chapter.name } };
		readHistory = {
			...readHistory,
			[key]: { source, id: manga.id, title: manga.title, poster: manga.poster, number: chapter.number, time: Date.now() }
		};

		try {
			localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
			localStorage.setItem(HISTORY_KEY, JSON.stringify(readHistory));
		} catch {
			// ignore storage failures
		}
	}

	function mergeManga(base, detail) {
		const out = { ...base };

		for (const [key, value] of Object.entries(detail)) {
			if (Array.isArray(value) ? value.length : value) out[key] = value;
		}

		return out;
	}

	function proxied(src, url) {
		return url ? `${API}/tools/comics/image?source=${src}&url=${encodeURIComponent(url)}` : '';
	}

	function imgSrc(page) {
		if (page.token) return `${API}/tools/comics/image?token=${page.token}`;
		return `${API}/tools/comics/image?source=${source}&url=${encodeURIComponent(page.url)}`;
	}

	function posterSrc(url) {
		return proxied(source, url);
	}

	async function loadFilterDefs() {
		try {
			const data = await get(`/tools/comics/filters?source=${source}`);
			filterDefs = data?.filters || [];
		} catch {
			filterDefs = [];
		}

		activeFilters = {};
		draftFilters = {};
	}

	function filterQuery() {
		return Object.keys(activeFilters).length ? `&filters=${encodeURIComponent(JSON.stringify(activeFilters))}` : '';
	}

	function cleanFilters(obj) {
		const out = {};

		for (const [key, val] of Object.entries(obj)) {
			if (Array.isArray(val) ? val.length : val !== '' && val != null) out[key] = val;
		}

		return out;
	}

	function toggleFilters() {
		if (!showFilters) draftFilters = { ...activeFilters };
		showFilters = !showFilters;
	}

	function setSelect(id, value) {
		draftFilters = { ...draftFilters, [id]: value };
	}

	function toggleMulti(id, value) {
		const arr = draftFilters[id] || [];

		draftFilters = { ...draftFilters, [id]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] };
	}

	function applyFilters() {
		activeFilters = cleanFilters(draftFilters);
		showFilters = false;
		loadHome();
	}

	function resetFilters() {
		draftFilters = {};
		activeFilters = {};
		loadHome();
	}

	async function loadHome() {
		loading = true;
		error = '';
		results = [];
		isHome = true;
		homePage = 1;

		try {
			const data = await get(`/tools/comics/home?source=${source}&page=1${filterQuery()}`);
			results = data?.results || [];
			homeHasNext = !!data?.hasNext;
			if (!results.length) error = 'No featured titles for this source — type a title to search.';
		} catch (e) {
			error = e.message || 'Failed to load home.';
		}

		loading = false;
	}

	async function loadMoreHome() {
		if (loadingMore || !homeHasNext) return;
		loadingMore = true;

		try {
			const next = homePage + 1;
			const data = await get(`/tools/comics/home?source=${source}&page=${next}${filterQuery()}`);
			const more = (data?.results || []).filter((m) => !results.some((r) => r.id === m.id));

			results = [...results, ...more];
			homePage = next;
			homeHasNext = !!data?.hasNext && (data?.results || []).length > 0;
		} catch (e) {
			showError(e.message || 'Failed to load more.');
		}

		loadingMore = false;
	}

	function infinite(node) {
		const io = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) loadMoreHome();
			},
			{ rootMargin: '200px' }
		);

		io.observe(node);

		return { destroy: () => io.disconnect() };
	}

	async function doSearch() {
		if (!query.trim()) return loadHome();
		loading = true;
		error = '';
		results = [];
		isHome = false;

		try {
			const data = await get(`/tools/comics/search?source=${source}&q=${encodeURIComponent(query.trim())}`);
			results = data?.results || [];
			if (!results.length) error = 'No results found.';
		} catch (e) {
			error = e.message || 'Search failed.';
		}

		loading = false;
	}

	function changeSource(next) {
		source = next;
		query = '';
		loadFilterDefs();
		loadHome();
	}

	function syncUrl(src, currentView, item, chapter) {
		const id = currentView !== 'search' && item ? item.id : '';
		const chId = currentView === 'reader' && chapter ? chapter.id : '';

		comicQuery.write({ src, id, ch: chId });
		saveLocal(LAST_KEY, { src, id, ch: chId });
	}

	onMount(async () => {
		try {
			const src = _initUrl.src || _initLast.src;
			const id = _initUrl.id || _initLast.id;
			const ch = _initUrl.ch || _initLast.ch;

			if (src && SOURCES.some((s) => s.value === src)) source = src;

			await loadFilterDefs();

			if (id) {
				await openManga({ id });
				await tick();

				if (ch) {
					const idx = filteredChapters.findIndex((c) => c.id === ch);

					if (idx >= 0) await openReader(idx);
				}
			} else {
				await loadHome();
			}
		} catch {
			// ensure UI always renders even if init fails
		}

		restored = true;
		dispatch('ready');
	});

	onDestroy(() => comicQuery.strip());

	async function openManga(item, { refresh = false } = {}) {
		manga = { ...item };
		view = 'chapters';
		loading = true;
		error = '';
		chapters = [];
		groupFilter = 'all';
		dedup = false;
		pagesCache = {};

		try {
			const data = await get(`/tools/comics/detail?source=${source}&id=${encodeURIComponent(item.id)}${refresh ? '&refresh=1' : ''}`);
			manga = mergeManga(item, data?.manga || {});
			chapters = data?.chapters || [];
			if (!chapters.length) error = 'No chapters found.';
		} catch (e) {
			error = e.message || 'Failed to load detail.';
		}

		loading = false;
	}

	function onReaderScroll() {
		if (!readerBody) return;

		const st = readerBody.scrollTop;
		showGoUp = st > 500;

		if (scrubbing) barHidden = false;
		else if (st < 80) barHidden = false;
		else if (st > lastScrollTop + 6) barHidden = true;
		else if (st < lastScrollTop - 6) barHidden = false;
		lastScrollTop = st;

		if (pinFrame || adjusting || !segments.length) return;

		const imgs = readerBody.querySelectorAll('img.page');

		if (imgs.length) {
			const threshold = readerBody.getBoundingClientRect().top + readerBody.clientHeight * 0.5;
			let cur = imgs[0];

			for (let i = 0; i < imgs.length; i++) {
				if (imgs[i].getBoundingClientRect().top <= threshold) cur = imgs[i];
				else break;
			}

			const si = Number(cur.dataset.seg);
			const pi = Number(cur.dataset.pi);
			const seg = segments[si];

			if (seg) {
				if (si !== activeSegIndex) {
					activeSegIndex = si;
					chapterIndex = seg.chapterIndex;
					saveBookmark(seg.chapter);
				}

				scrubIndex = pi;
				scrubTotal = seg.pages.length;
				updateProgress(seg.chapter.id, pi, seg.pages.length);
			}
		}

		if (doomMode && !loadingNext && canLoadNext() && needMore()) {
			loadNextSegment();
		}

		if (doomMode && !loadingPrev && canLoadPrev() && st < readerBody.clientHeight) {
			loadPrevSegment();
		}
	}

	function bufferAhead() {
		let segs = 0;
		let pgs = 0;

		for (let i = activeSegIndex + 1; i < segments.length; i++) {
			segs++;
			pgs += segments[i].pages.length;
		}

		return { segs, pgs };
	}

	function needMore() {
		const { segs, pgs } = bufferAhead();

		return segs < 6 && (segs < 2 || pgs < 10);
	}

	function canLoadNext() {
		const last = segments[segments.length - 1];

		return last && last.chapterIndex < filteredChapters.length - 1;
	}

	async function loadNextSegment() {
		if (loadingNext) return;
		loadingNext = true;

		try {
			while (canLoadNext() && needMore()) {
				const last = segments[segments.length - 1];
				const nextIdx = last.chapterIndex + 1;
				const chapter = filteredChapters[nextIdx];
				let pgs = pagesCache[chapter.id];

				if (!pgs) {
					const data = await get(`/tools/comics/pages?source=${source}&ref=${encodeURIComponent(chapter.id)}`);
					pgs = data?.pages || [];
					pagesCache[chapter.id] = pgs;
				}

				segments = [...segments, { chapterIndex: nextIdx, chapter, pages: pgs }];
			}
		} catch (e) {
			showError(e.message || 'Failed to load next chapter.');
		}

		loadingNext = false;
		trimBehind();
	}

	function anchorImg() {
		const bodyTop = readerBody.getBoundingClientRect().top;
		const imgs = readerBody.querySelectorAll('img.page');

		for (const img of imgs) {
			if (img.getBoundingClientRect().bottom > bodyTop + 1) return img;
		}

		return null;
	}

	async function preserve(mutate, hold = false) {
		const el = anchorImg();
		const chapterId = el ? segments[Number(el.dataset.seg)]?.chapter.id : null;
		const pi = el ? el.dataset.pi : null;
		const before = el ? el.getBoundingClientRect().top : 0;

		adjusting = true;
		mutate();
		await tick();

		const align = () => {
			if (chapterId == null || !readerBody) return;

			const si = segments.findIndex((s) => s.chapter.id === chapterId);
			const target = si >= 0 && readerBody.querySelector(`img.page[data-seg="${si}"][data-pi="${pi}"]`);

			if (target) readerBody.scrollTop += target.getBoundingClientRect().top - before;
		};

		align();

		if (!hold) {
			adjusting = false;
			return;
		}

		cancelPin();

		let frames = 0;
		const stop = () => {
			cancelPin();
			adjusting = false;
		};

		readerBody.addEventListener('wheel', stop, { once: true, passive: true });
		readerBody.addEventListener('touchstart', stop, { once: true, passive: true });

		const step = () => {
			if (!readerBody || view !== 'reader') return stop();

			align();
			pinFrame = ++frames < 30 ? requestAnimationFrame(step) : null;
			if (!pinFrame) adjusting = false;
		};

		pinFrame = requestAnimationFrame(step);
	}

	function trimBehind() {
		const start = Math.max(0, activeSegIndex - KEEP_BEHIND);

		if (start <= 0) return;

		preserve(() => {
			segments = segments.slice(start);
			activeSegIndex -= start;
		});
	}

	function trimAhead() {
		const end = Math.min(segments.length, activeSegIndex + KEEP_AHEAD + 1);

		if (end < segments.length) segments = segments.slice(0, end);
	}

	function canLoadPrev() {
		return !!segments[0] && segments[0].chapterIndex > 0;
	}

	async function loadPrevSegment() {
		if (loadingPrev || !canLoadPrev()) return;
		loadingPrev = true;

		try {
			const prevIdx = segments[0].chapterIndex - 1;
			const chapter = filteredChapters[prevIdx];
			let pgs = pagesCache[chapter.id];

			if (!pgs) {
				const data = await get(`/tools/comics/pages?source=${source}&ref=${encodeURIComponent(chapter.id)}`);
				pgs = data?.pages || [];
				pagesCache[chapter.id] = pgs;
			}

			await preserve(() => {
				segments = [{ chapterIndex: prevIdx, chapter, pages: pgs }, ...segments];
				activeSegIndex += 1;
			}, true);

			trimAhead();
		} catch (e) {
			showError(e.message || 'Failed to load previous chapter.');
		}

		loadingPrev = false;
	}

	async function openReader(index) {
		chapterIndex = index;
		const chapter = filteredChapters[index];
		view = 'reader';
		showGoUp = false;
		barHidden = false;
		lastScrollTop = 0;
		activeSegIndex = 0;

		if (pagesCache[chapter.id]) {
			segments = [{ chapterIndex: index, chapter, pages: pagesCache[chapter.id] }];
			loading = false;
			saveBookmark(chapter);
			await tick();
			restoreScroll(chapter);
			if (doomMode) loadNextSegment();
			return;
		}

		loading = true;
		segments = [];

		try {
			const data = await get(`/tools/comics/pages?source=${source}&ref=${encodeURIComponent(chapter.id)}`);
			const pgs = data?.pages || [];
			pagesCache[chapter.id] = pgs;
			segments = [{ chapterIndex: index, chapter, pages: pgs }];
			saveBookmark(chapter);
			await tick();
			restoreScroll(chapter);
			if (doomMode) loadNextSegment();
		} catch (e) {
			showError(e.message || 'Failed to load pages.');
			view = 'chapters';
		}

		loading = false;
	}

	function restoreScroll(chapter) {
		if (!readerBody) return;

		const p = (progress[bookmarkKey(manga)] || {})[chapter.id];

		if (!p?.total || p.page <= 0 || chapterDone(p)) {
			readerBody.scrollTop = 0;
			return;
		}

		pinToPage(p.page);
	}

	function cancelPin() {
		if (pinFrame) cancelAnimationFrame(pinFrame);
		pinFrame = null;
	}

	function pinToPage(pageIdx) {
		cancelPin();

		let frames = 0;
		const stop = () => cancelPin();

		readerBody.addEventListener('wheel', stop, { once: true, passive: true });
		readerBody.addEventListener('touchstart', stop, { once: true, passive: true });

		const step = () => {
			if (!readerBody || view !== 'reader') return cancelPin();

			const imgs = readerBody.querySelectorAll('img.page');
			const target = imgs[Math.min(imgs.length - 1, pageIdx)];

			if (target) {
				const delta = target.getBoundingClientRect().top - readerBody.getBoundingClientRect().top;

				if (Math.abs(delta) > 1) readerBody.scrollTop += delta;
			}

			pinFrame = ++frames < 40 ? requestAnimationFrame(step) : null;
		};

		pinFrame = requestAnimationFrame(step);
	}

	function closeReader() {
		cancelPin();
		if (clickScrollFrame) cancelAnimationFrame(clickScrollFrame);
		clickScrollFrame = null;
		autoScroll = false;
		autoEnabled = false;
		if (scrollFrame) cancelAnimationFrame(scrollFrame);
		scrollFrame = null;
		showReaderSettings = false;
		view = 'chapters';
		segments = [];
		activeSegIndex = 0;
		chapterIndex = -1;
	}

	function backToSearch() {
		view = 'search';
		manga = null;
		chapters = [];
		if (!results.length) loadHome();
	}

	function changeChapter(delta) {
		const next = chapterIndex + delta;
		if (next >= 0 && next < filteredChapters.length) openReader(next);
	}

	function onKey(e) {
		if (view !== 'reader') return;
		if (e.key === 'Escape') closeReader();
		else if (e.key === 'ArrowRight') changeChapter(1);
		else if (e.key === 'ArrowLeft') changeChapter(-1);
	}

	function handleOutsideSettings(e) {
		if (showReaderSettings && settingsWrap && !settingsWrap.contains(e.target)) {
			showReaderSettings = false;
		}
	}

	function handleOutsideFilters(e) {
		if (showReaderFilters && readerFiltersWrap && !readerFiltersWrap.contains(e.target)) {
			showReaderFilters = false;
		}
	}

	async function downloadPdf(chapter) {
		pdfBusy = true;

		try {
			const res = await fetch(`${API}/tools/comics/pdf`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ source, refs: [chapter.id], title: `${manga?.title || 'comic'}-ch-${chapter.number}` })
			});

			if (!res.ok) {
				const body = await res.json().catch(() => null);
				throw new Error(body?.message || `PDF failed (${res.status})`);
			}

			const blob = await res.blob();
			const a = document.createElement('a');
			a.href = URL.createObjectURL(blob);
			a.download = `${(manga?.title || 'comic').replace(/[^a-z0-9_-]/gi, '_')}-ch-${chapter.number}.pdf`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(a.href);
		} catch (e) {
			showError(e.message || 'PDF download failed.');
		}

		pdfBusy = false;
	}
</script>

<svelte:window on:keydown={onKey} on:click={(e) => { handleOutsideSettings(e); handleOutsideFilters(e); }} on:blur={pauseAutoScroll} />
<svelte:document on:visibilitychange={() => document.hidden && pauseAutoScroll()} />

{#if restored}
<div class="comics">
	{#if view === 'search'}
		<div class="search-row">
			<Dropdown value={source} options={SOURCES} on:change={(e) => changeSource(e.detail)} />
			<input class="input" type="text" placeholder="Search title..." bind:value={query} on:keydown={(e) => e.key === 'Enter' && doSearch()} />
			<button class="btn primary" type="button" disabled={loading} on:click={doSearch}>{loading ? '...' : 'Search'}</button>
			<button class="btn filter-btn" class:active={showHistory} type="button" on:click={() => (showHistory = !showHistory)}>
				<i class="nf nf-md-clock_outline"></i> History
			</button>
			{#if isHome && filterDefs.length}
				<button class="btn filter-btn" class:active={showFilters} type="button" on:click={toggleFilters}>
					<i class="nf nf-md-filter_variant"></i> Filters{#if Object.keys(activeFilters).length}<span class="filter-count">{Object.keys(activeFilters).length}</span>{/if}
				</button>
			{/if}
		</div>

		{#if showHistory && !historyList.length}
			<p class="muted">No reading history yet.</p>
		{/if}

		{#if showFilters && isHome}
			<div class="filter-panel">
				{#each filterDefs as f (f.id)}
					<div class="filter-field">
						<span class="filter-label">{f.label}</span>
						{#if f.type === 'select'}
							<Dropdown value={draftFilters[f.id] ?? f.default ?? ''} options={f.options} size="sm" on:change={(e) => setSelect(f.id, e.detail)} />
						{:else}
							<div class="chips">
								{#each f.options as opt (opt.value)}
									<button class="chip" class:on={(draftFilters[f.id] || []).includes(opt.value)} type="button" on:click={() => toggleMulti(f.id, opt.value)}>{opt.label}</button>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
				<div class="filter-actions">
					<button class="btn primary" type="button" on:click={applyFilters}>Apply</button>
					<button class="btn" type="button" on:click={resetFilters}>Reset</button>
				</div>
			</div>
		{/if}

		{#if error}<p class="err">{error}</p>{/if}

		{#if showHistory}
			<div class="results-head">
				<p class="results-label">Reading History</p>
				<div class="history-actions">
					<button class="link-btn" type="button" on:click={clearHistory}>Clear</button>
					{#if historyList.length}
						<input class="input filter-input" type="text" placeholder="Filter history..." bind:value={historyFilter} />
					{/if}
				</div>
			</div>
			<div class="grid">
				{#each filteredHistory as h (h.source + '/' + h.id)}
					<button class="result" type="button" on:click={() => openHistory(h)}>
						{#if h.poster}
							<img class="poster" src={proxied(h.source, h.poster)} alt="" loading="lazy" on:error={(e) => (e.target.style.visibility = 'hidden')} />
						{:else}
							<span class="poster placeholder"><i class="nf nf-md-book_open_page_variant"></i></span>
						{/if}
						<span class="result-title">{@html highlight(h.title, historyFilter)}</span>
						<span class="result-sub">Ch. {h.number} · {ago(h.time)}</span>
					</button>
				{/each}
			</div>
			{#if historyFilter.trim() && !filteredHistory.length}
				<p class="muted">No history matches "{historyFilter}".</p>
			{/if}
		{:else if loading && !results.length}
			<SkeletonCard count={8} minWidth="130px" />
		{:else if results.length}
			<div class="results-head">
				<p class="results-label">{isHome ? 'Popular' : 'Search results'}</p>
				{#if isHome}
					<input class="input filter-input" type="text" placeholder="Filter popular..." bind:value={popularFilter} />
				{/if}
			</div>
			<div class="grid">
				{#each displayed as item (item.id)}
					<button class="result" type="button" on:click={() => openManga(item)}>
						{#if item.poster}
							<img class="poster" src={posterSrc(item.poster)} alt="" loading="lazy" on:error={(e) => (e.target.style.visibility = 'hidden')} />
						{:else}
							<span class="poster placeholder"><i class="nf nf-md-book_open_page_variant"></i></span>
						{/if}
						<span class="result-title">{@html highlight(item.title, isHome ? popularFilter : query)}</span>
					</button>
				{/each}
			</div>
			{#if isHome && popularFilter.trim() && !displayed.length}
				<p class="muted">No popular titles match "{popularFilter}".</p>
			{/if}
			{#if isHome && homeHasNext && !popularFilter.trim()}
				<div class="infinite-sentinel" use:infinite></div>
				{#if loadingMore}<p class="muted load-status">Loading more...</p>{/if}
			{/if}
		{/if}
	{:else if view === 'chapters'}
		<div class="chapters-head">
			<button class="link-btn" type="button" on:click={backToSearch}><i class="nf nf-fa-chevron_left"></i> Results</button>
		</div>

		{#if manga}
			<div class="detail-layout" style:--splash={manga.poster ? `url('${posterSrc(manga.poster)}')` : 'none'}>
				<div class="detail">
					<div class="detail-info">
						{#if manga.poster}
							<img class="detail-cover" src={posterSrc(manga.poster)} alt="" on:error={(e) => (e.target.style.display = 'none')} />
						{/if}
						<h4 class="manga-title">{manga.title}</h4>
						<div class="detail-tags">
							{#if manga.type}<span class="tag">{manga.type}</span>{/if}
							{#if manga.status}<span class="tag">{manga.status}</span>{/if}
							{#if manga.rating}<span class="tag">⭐ {manga.rating}</span>{/if}
						</div>
						{#if manga.authors?.length}<p class="detail-meta"><span>Author:</span> {manga.authors.join(', ')}</p>{/if}
						{#if manga.artists?.length}<p class="detail-meta"><span>Artist:</span> {manga.artists.join(', ')}</p>{/if}
						{#if manga.genres?.length}
							<div class="genres">
								{#each manga.genres as g (g)}<span class="genre">{g}</span>{/each}
							</div>
						{/if}
						{#if manga.synopsis}<p class="synopsis">{manga.synopsis}</p>{/if}
						{#if bookmarks[bookmarkKey(manga)]}<p class="bookmark">Last read: Ch. {bookmarks[bookmarkKey(manga)].number}</p>{/if}
					</div>
				</div>

				<div class="chapters-panel">
					{#if loading}
						<p class="muted">Loading chapters...</p>
					{:else if error}
						<p class="err">{error}</p>
					{:else if chapters.length}
						<div class="filter-bar">
							<span class="chapter-count">{filteredChapters.length} chapter(s)</span>
							{#if scanlators.length > 1}
								<Dropdown value={groupFilter} options={groupOptions} size="sm" on:change={(e) => (groupFilter = e.detail)} />
							{/if}
							<Tooltip text="Toggle chapter order">
								<button class="toggle-btn" type="button" on:click={() => (sortAsc = !sortAsc)}>
									<i class="nf nf-fa-chevron_down" style:transform={sortAsc ? 'none' : 'rotate(180deg)'}></i> {sortAsc ? 'Oldest' : 'Latest'}
								</button>
							</Tooltip>
							<Tooltip text="Hide duplicate chapter numbers, keeping the first of each.">
								<button class="toggle-btn" class:active={dedup} type="button" on:click={() => (dedup = !dedup)}>
									<i class="nf nf-md-filter_variant"></i> Dedup
								</button>
							</Tooltip>
							<Tooltip text="Fetch the newest chapters now (bypasses the 1h cache)">
								<button class="toggle-btn" type="button" disabled={loading} on:click={() => openManga(manga, { refresh: true })}>
									<i class="nf nf-md-refresh"></i> Refresh
								</button>
							</Tooltip>
							<Tooltip text="Show only bookmarked chapters">
								<button class="toggle-btn" class:active={bookmarkOnly} type="button" on:click={() => (bookmarkOnly = !bookmarkOnly)}>
									<svg class="bm-icon on" viewBox="0 0 24 24" aria-hidden="true"><path d="M17 3H7a2 2 0 0 0-2 2v16l7-3 7 3V5a2 2 0 0 0-2-2z" /></svg> Saved
								</button>
							</Tooltip>
						</div>

						<div class="chapter-list">
							{#each filteredChapters as chapter, i (chapter.id)}
								<div class="chapter-row" class:read={bookmarks[bookmarkKey(manga)]?.number === chapter.number} class:done={chapterDone(mangaProgress[chapter.id])}>
									<button class="chapter-main" type="button" on:click={() => openReader(i)}>
										<span class="chapter-num">Ch. {chapter.number}</span>
										{#if chapter.name && chapter.name !== `Chapter ${chapter.number}`}
											<span class="chapter-name">{chapter.name}</span>
										{/if}
										{#if chapter.scanlator}<span class="chapter-group">{chapter.scanlator}</span>{/if}
										{#if mangaProgress[chapter.id]?.total}
											<span class="chapter-pct" class:done={chapterDone(mangaProgress[chapter.id])}>{mangaProgress[chapter.id].page + 1}/{mangaProgress[chapter.id].total}</span>
										{/if}
									</button>
									<Tooltip text={bmSet[chapter.id] ? 'Remove bookmark' : 'Bookmark chapter'}>
										<button class="icon-btn" class:active={bmSet[chapter.id]} type="button" aria-label="Bookmark chapter" on:click={() => toggleChapterBookmark(chapter)}>
											<svg class="bm-icon" class:on={bmSet[chapter.id]} viewBox="0 0 24 24" aria-hidden="true"><path d="M17 3H7a2 2 0 0 0-2 2v16l7-3 7 3V5a2 2 0 0 0-2-2z" /></svg>
										</button>
									</Tooltip>
									<Tooltip text="Download this chapter as PDF">
										<button class="icon-btn" type="button" aria-label="Download PDF" disabled={pdfBusy} on:click={() => downloadPdf(chapter)}>
											<i class="nf nf-md-download_circle"></i>
										</button>
									</Tooltip>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		{/if}
	{/if}
</div>
{/if}

{#if view === 'reader'}
<div class="reader">
		<header class="reader-bar" class:hidden={barHidden} bind:clientHeight={barHeight}>
			<button class="link-btn" type="button" on:click={closeReader}><i class="nf nf-fa-chevron_left"></i> Chapters</button>
			<div class="reader-select">
				<Dropdown value={chapterIndex} options={chapterOptions} size="sm" align="center" menuClass="reader-chapter-menu" on:change={(e) => openReader(e.detail)} />
			</div>
			<div class="reader-nav">
				<Tooltip text="Previous chapter (←)">
					<button class="icon-btn" type="button" aria-label="Previous chapter" disabled={chapterIndex <= 0} on:click={() => changeChapter(-1)}><i class="nf nf-fa-chevron_left"></i></button>
				</Tooltip>
				<Tooltip text="Next chapter (→)">
					<button class="icon-btn" type="button" aria-label="Next chapter" disabled={chapterIndex >= filteredChapters.length - 1} on:click={() => changeChapter(1)}><i class="nf nf-fa-chevron_right"></i></button>
				</Tooltip>
				<div class="settings-wrap" bind:this={settingsWrap}>
					<Tooltip text="Reader settings">
						<button class="icon-btn" class:active={showReaderSettings} type="button" aria-label="Reader settings" on:click={() => (showReaderSettings = !showReaderSettings)}><i class="nf nf-md-cog"></i></button>
					</Tooltip>
					{#if showReaderSettings}
						<div class="reader-settings">
							<div class="setting">
								<span>Auto-scroll</span>
								<Toggle checked={autoEnabled} size="sm" on:change={(e) => setAutoEnabled(e.detail)} />
							</div>
							<label class="setting">
								<span>Auto-scroll speed</span>
								<Slider min={1} max={10} bind:value={autoSpeed} />
							</label>
							<div class="setting">
								<span>Click to scroll</span>
								<Toggle checked={clickToScroll} size="sm" on:change={(e) => (clickToScroll = e.detail)} />
							</div>
							<div class="setting">
								<span>Doom Scrolling Mode</span>
								<Toggle checked={doomMode} size="sm" on:change={(e) => (doomMode = e.detail)} />
							</div>
						</div>
					{/if}
				</div>
				<div class="reader-filters-wrap" bind:this={readerFiltersWrap}>
					<Tooltip text="Chapter filters">
						<button class="icon-btn" class:active={showReaderFilters} type="button" aria-label="Chapter filters" on:click={() => (showReaderFilters = !showReaderFilters)}>
							<i class="nf nf-md-filter_variant"></i>
							{#if groupFilter !== 'all' || dedup || !sortAsc || bookmarkOnly}
								<span class="filter-indicator"></span>
							{/if}
						</button>
					</Tooltip>
					{#if showReaderFilters}
						<div class="reader-filters">
							{#if scanlators.length > 1}
								<div class="setting">
									<span>Group</span>
									<Dropdown value={groupFilter} options={groupOptions} size="sm" on:change={(e) => (groupFilter = e.detail)} />
								</div>
							{/if}
							<div class="setting">
								<span>Order</span>
								<button class="toggle-btn" type="button" on:click={() => (sortAsc = !sortAsc)}>
									<i class="nf nf-fa-chevron_down" style:transform={sortAsc ? 'none' : 'rotate(180deg)'}></i> {sortAsc ? 'Oldest' : 'Latest'}
								</button>
							</div>
							<div class="setting">
								<span>Dedup</span>
								<Toggle checked={dedup} size="sm" on:change={(e) => (dedup = e.detail)} />
							</div>
							<div class="setting">
								<span>Bookmarked only</span>
								<Toggle checked={bookmarkOnly} size="sm" on:change={(e) => (bookmarkOnly = e.detail)} />
							</div>
						</div>
					{/if}
				</div>
				<Tooltip text="Download this chapter as PDF">
					<button class="icon-btn" type="button" aria-label="Download PDF" disabled={pdfBusy} on:click={() => downloadPdf(currentChapter)}><i class="nf nf-md-download_circle"></i></button>
				</Tooltip>
			</div>
			{#if scrubTotal > 1}
				<div class="reader-scrub">
					<div class="scrub-wrap">
						<input class="scrub" type="range" min="0" max={scrubTotal - 1} value={scrubIndex}
							on:input={(e) => { scrubbing = true; scrubTo(+e.target.value); }}
							on:change={() => (scrubbing = false)}
							on:pointerup={() => (scrubbing = false)}
							aria-label="Page progress" />
						<div class="scrub-dots" aria-hidden="true">
							{#each Array(scrubTotal) as _, i (i)}<span class="scrub-dot" class:on={i <= scrubIndex}></span>{/each}
						</div>
					</div>
					<span class="scrub-label">{scrubIndex + 1}/{scrubTotal}</span>
				</div>
			{/if}
		</header>
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div class="reader-body" bind:this={readerBody} on:click={handleReaderClick} on:scroll={onReaderScroll} style:padding-top="{barHeight}px" role="presentation">
			{#if loading}
				<p class="muted reader-loading">Loading pages...</p>
			{:else}
				{#each segments as seg, si (seg.chapterIndex)}
					{#if si > 0}
						<div class="chapter-divider">
							<span class="cd-done">Finished Ch. {segments[si - 1].chapter.number}</span>
							<span class="cd-next">Current Ch. {seg.chapter.number}</span>
						</div>
					{/if}
					{#each seg.pages as page, pi (pi)}
						<img class="page" data-seg={si} data-pi={pi} src={imgSrc(page)} alt="Page {pi + 1}" loading="lazy" draggable="false" on:contextmenu|preventDefault />
					{/each}
				{/each}
				<div class="reader-end">
					{#if loadingNext}
						<span class="muted">Loading next chapter…</span>
					{:else if hasNextChapter && !doomMode}
						<button class="btn primary" type="button" on:click={() => changeChapter(1)}>Next Chapter →</button>
					{:else if !hasNextChapter}
						<span class="muted">End of chapters</span>
					{/if}
				</div>
			{/if}
		</div>
		{#if showGoUp}
			<button class="go-up" type="button" aria-label="Scroll to top" on:click={() => readerBody?.scrollTo({ top: 0, behavior: 'smooth' })}>
				<i class="nf nf-fa-chevron_down"></i>
			</button>
	{/if}
</div>
{/if}

<style>
	.comics { display: flex; flex-direction: column; gap: var(--space-3); }
	.search-row { display: flex; gap: var(--space-2); flex-wrap: wrap; }
	.search-row .input[type='text'] { flex: 1; min-width: 160px; }
	.err { margin: 0; color: #ff8e74; font-size: var(--fs-sm); }
	.results-label { margin: 0; font-size: var(--fs-xs); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); }
	.results-head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); }
	.history-actions { display: flex; align-items: center; gap: var(--space-2); }
	.filter-btn { display: inline-flex; align-items: center; gap: 0.35rem; }
	.filter-btn.active { color: var(--accent); border-color: var(--accent); }
	.filter-count { display: inline-grid; place-items: center; min-width: 1.1rem; height: 1.1rem; padding: 0 0.3rem; border-radius: var(--radius-pill); background: var(--accent); color: var(--bg); font-size: 0.6rem; font-weight: 700; }
	.filter-panel { display: flex; flex-direction: column; gap: var(--space-3); padding: var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--panel); max-height: 50vh; overflow-y: auto; }
	.filter-field { display: flex; flex-direction: column; gap: 0.4rem; }
	.filter-label { font-size: var(--fs-xs); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); }
	.chips { display: flex; flex-wrap: wrap; gap: 0.3rem; }
	.chip { font-size: var(--fs-xs); padding: 0.2rem 0.6rem; border-radius: var(--radius-pill); border: 1px solid var(--border); background: var(--bg); color: var(--muted); cursor: pointer; transition: color var(--tx-base), border-color var(--tx-base); }
	.chip:hover { color: var(--text); }
	.chip.on { color: var(--accent); border-color: var(--accent); background: color-mix(in srgb, var(--accent) 14%, transparent); }
	.filter-actions { display: flex; gap: var(--space-2); }
	.filter-input { max-width: 200px; }
	.infinite-sentinel { height: 1px; }
	.load-status { text-align: center; }
	.muted { margin: 0; color: var(--muted); font-size: var(--fs-sm); }

	.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: var(--space-3); }
	.result { display: flex; flex-direction: column; gap: 0.4rem; padding: 0; background: none; border: none; cursor: pointer; text-align: left; color: var(--text); }
	.poster { width: 100%; aspect-ratio: 2 / 3; object-fit: cover; border-radius: var(--radius-sm); border: 1px solid var(--border); background: var(--bg); transition: border-color var(--tx-base); }
	.poster.placeholder { display: grid; place-items: center; font-size: 2rem; color: var(--muted); }
	.result:hover .poster { border-color: var(--accent); }
	.result-title { font-size: var(--fs-xs); line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
	.result-title :global(mark.cmd-hl) { background: color-mix(in srgb, var(--accent) 32%, transparent); color: var(--accent); padding: 0 2px; border-radius: 3px; font-weight: 700; }
	.result-sub { font-size: 0.65rem; color: var(--accent); }

	.chapters-head { display: flex; align-items: center; gap: var(--space-2); }
	.manga-title { margin: 0; font-size: var(--fs-md); }
	.link-btn { display: inline-flex; align-items: center; gap: 0.3rem; background: none; border: none; color: var(--muted); font-size: var(--fs-sm); font-weight: 600; cursor: pointer; }
	.link-btn:hover { color: var(--accent); }
	.link-btn :global(.nf) { font-size: 0.7em; line-height: 1; }

	.detail-layout { display: flex; gap: var(--space-3); align-items: stretch; }
	.detail { position: relative; overflow: hidden; flex: 0 0 300px; padding: var(--space-4); border: 1px solid var(--border); border-radius: var(--radius-md); min-height: 340px; }
	.detail::before { content: ''; position: absolute; inset: -24px; background-image: var(--splash); background-size: cover; background-position: center; filter: blur(14px) brightness(0.5); transform: scale(1.15); z-index: 0; }
	.detail::after { content: ''; position: absolute; inset: 0; background: radial-gradient(120% 80% at 50% 0%, transparent 0%, rgba(0, 0, 0, 0.55) 100%), linear-gradient(to top, rgba(0, 0, 0, 0.92), rgba(0, 0, 0, 0.3)); z-index: 1; }
	.detail-info { position: relative; z-index: 2; display: flex; flex-direction: column; gap: 0.45rem; min-width: 0; max-height: 62vh; overflow-y: auto; color: #fff; margin-right: calc(-1 * var(--space-4)); padding-right: var(--space-4); }
	.detail-cover { width: 130px; aspect-ratio: 2 / 3; object-fit: cover; border-radius: var(--radius-sm); align-self: center; box-shadow: 0 8px 22px rgba(0, 0, 0, 0.55); }
	.detail .manga-title { color: #fff; }
	.detail-tags { display: flex; flex-wrap: wrap; gap: 0.3rem; }
	.tag { font-size: var(--fs-xs); font-weight: 600; padding: 0.1rem 0.5rem; border-radius: var(--radius-pill); background: color-mix(in srgb, var(--accent) 30%, transparent); color: #fff; text-transform: capitalize; }
	.detail-meta { margin: 0; font-size: var(--fs-xs); color: rgba(255, 255, 255, 0.85); }
	.detail-meta span { color: #fff; font-weight: 600; }
	.genres { display: flex; flex-wrap: wrap; gap: 0.25rem; }
	.genre { font-size: 0.65rem; padding: 0.05rem 0.4rem; border-radius: var(--radius-pill); background: rgba(255, 255, 255, 0.14); border: 1px solid rgba(255, 255, 255, 0.25); color: #fff; }
	.synopsis { margin: 0.2rem 0 0; font-size: var(--fs-xs); color: rgba(255, 255, 255, 0.82); line-height: 1.5; }
	.bookmark { margin: 0.2rem 0 0; font-size: var(--fs-xs); color: var(--accent); }

	.chapters-panel { position: relative; overflow: hidden; flex: 1; min-width: 0; display: flex; flex-direction: column; gap: var(--space-2); padding: var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-md); max-height: 70vh; }
	.chapters-panel::before { content: ''; position: absolute; inset: 0; background-image: var(--splash); background-size: cover; background-position: center; filter: blur(34px) brightness(0.4); opacity: 0.22; z-index: 0; }
	.chapters-panel > * { position: relative; z-index: 1; }

	.filter-bar { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; }
	.chapter-count { font-size: var(--fs-xs); color: var(--muted); margin-right: auto; }
	.toggle-btn { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.3rem 0.7rem; font-size: var(--fs-xs); font-weight: 600; border-radius: var(--radius-pill); border: 1px solid var(--border); background: var(--bg); color: var(--muted); cursor: pointer; transition: color var(--tx-base), border-color var(--tx-base); }
	.toggle-btn:hover { color: var(--text); }
	.toggle-btn.active { color: var(--accent); border-color: var(--accent); background: color-mix(in srgb, var(--accent) 14%, transparent); }

	.chapter-list { display: flex; flex-direction: column; gap: 0.25rem; flex: 1; min-height: 0; overflow-y: auto; padding-right: var(--space-4); }

	@media (max-width: 720px) {
		.detail-layout { flex-direction: column; }
		.detail { flex: none; min-height: 0; }
	}
	.chapter-row { display: flex; align-items: center; gap: var(--space-2); background: var(--panel); border: 1px solid var(--border); border-radius: var(--radius-sm); }
	.chapter-row.read { border-color: color-mix(in srgb, var(--accent) 45%, var(--border)); }
	.chapter-row.done .chapter-main { color: var(--muted); opacity: 0.65; }
	.chapter-pct { font-size: var(--fs-xs); font-weight: 600; color: var(--accent); padding: 0 0.4rem; white-space: nowrap; flex-shrink: 0; margin-left: auto; }
	.chapter-pct.done { color: var(--muted); }
	.chapter-main { flex: 1; display: flex; align-items: baseline; gap: 0.5rem; padding: 0.5rem 0.7rem; background: none; border: none; color: var(--text); text-align: left; cursor: pointer; min-width: 0; }
	.chapter-main:hover { color: var(--accent); }
	.chapter-num { font-weight: 600; font-size: var(--fs-sm); white-space: nowrap; }
	.chapter-name { font-size: var(--fs-xs); color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.chapter-group { font-size: 0.65rem; color: var(--muted); padding: 0.05rem 0.4rem; border-radius: var(--radius-pill); background: var(--bg); border: 1px solid var(--border); white-space: nowrap; flex-shrink: 0; }
	.icon-btn { display: grid; place-items: center; width: 34px; height: 34px; background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--muted); cursor: pointer; transition: color var(--tx-base), border-color var(--tx-base); }
	.icon-btn:hover:not(:disabled) { color: var(--accent); border-color: var(--accent); }
	.icon-btn:disabled { opacity: 0.4; cursor: default; }
	.chapter-row .icon-btn { background: none; border: none; }
	.chapter-row .icon-btn i { font-size: 1.2rem; }
	.bm-icon { width: 1.2rem; height: 1.2rem; fill: none; stroke: currentColor; stroke-width: 2; stroke-linejoin: round; }
	.bm-icon.on { fill: currentColor; stroke: none; }
	.toggle-btn .bm-icon { width: 0.95rem; height: 0.95rem; }

	.reader { position: fixed; inset: 0; z-index: 200; background: #0b0b12; display: flex; flex-direction: column; }
	.reader-bar { position: absolute; top: 0; left: 0; right: 0; z-index: 10; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-2); padding: 0.6rem 1rem; background: var(--panel); border-bottom: 1px solid var(--border); transition: transform var(--tx-base); }
	.reader-bar.hidden { transform: translateY(-100%); }
	.reader-scrub { flex: 1 0 100%; display: flex; align-items: center; gap: var(--space-2); }
	.scrub-wrap { position: relative; flex: 1; display: flex; align-items: center; min-width: 0; }
	.scrub { flex: 1; accent-color: var(--accent); cursor: pointer; min-width: 0; }
	.scrub-dots { position: absolute; top: 50%; left: 7px; right: 7px; transform: translateY(-50%); display: flex; justify-content: space-between; pointer-events: none; }
	.scrub-dot { width: 4px; height: 4px; border-radius: 50%; background: color-mix(in srgb, var(--muted) 55%, transparent); }
	.scrub-dot.on { background: var(--accent); }
	.scrub-label { font-size: var(--fs-xs); color: var(--muted); white-space: nowrap; }
	.reader-select { flex: 1; display: flex; justify-content: center; min-width: 0; max-width: 300px; }
	.reader-select :global(.dropdown) { width: 100%; }
	.reader-select :global(.trigger) { width: 100%; text-align: center; }
	:global(.reader-chapter-menu) { max-width: 300px; }
	:global(.reader-chapter-menu .app-dropdown-option-label) { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.settings-wrap { position: relative; display: inline-flex; }
	.reader-settings { position: absolute; top: calc(100% + 6px); right: 0; width: 210px; display: flex; flex-direction: column; gap: 0.6rem; padding: 0.7rem; background: var(--panel); border: 1px solid var(--border); border-radius: var(--radius-sm); box-shadow: var(--shadow-md); z-index: 10; }
	.reader-filters-wrap { position: relative; display: inline-flex; }
	.reader-filters { position: absolute; top: calc(100% + 6px); right: 0; width: 220px; display: flex; flex-direction: column; gap: 0.5rem; padding: 0.7rem; background: var(--panel); border: 1px solid var(--border); border-radius: var(--radius-sm); box-shadow: var(--shadow-md); z-index: 10; }
	.reader-filters .setting { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; font-size: var(--fs-xs); color: var(--text); }
	.reader-filters .toggle-btn { font-size: var(--fs-xs); padding: 0.25rem 0.6rem; }
	.filter-indicator { position: absolute; top: 4px; right: 4px; width: 6px; height: 6px; border-radius: 50%; background: var(--accent); }
	.icon-btn { position: relative; }
	.setting { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; font-size: var(--fs-xs); color: var(--text); }
	.setting :global(.slider) { flex: 1; max-width: 110px; }
	.reader-nav { display: flex; align-items: center; gap: 0.3rem; }
	.icon-btn.active { color: var(--accent); border-color: var(--accent); }
	.reader-body { flex: 1; overflow-y: auto; display: flex; flex-direction: column; align-items: center; }
	.reader-loading { padding: var(--space-4); }
	.page { width: 100%; max-width: 800px; display: block; user-select: none; -webkit-user-select: none; -webkit-user-drag: none; }
	.chapter-divider { width: 100%; max-width: 800px; display: flex; flex-direction: column; align-items: center; gap: 0.3rem; padding: 2.5rem 1rem; margin: 0 auto; background: var(--panel); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
	.cd-done { font-size: var(--fs-sm); color: var(--muted); }
	.cd-next { font-size: var(--fs-lg); font-weight: 700; color: var(--accent); }
	.reader-end { padding: var(--space-4); display: grid; place-items: center; }
	.go-up { position: absolute; right: 16px; bottom: 16px; z-index: 20; width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; background: var(--accent); color: var(--bg); border: none; cursor: pointer; box-shadow: var(--shadow-md); opacity: 0.9; transition: opacity var(--tx-base); }
	.go-up:hover { opacity: 1; }
	.go-up .nf { transform: rotate(180deg); font-size: 0.95rem; }

	@media (max-width: 640px) {
		.grid { grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: var(--space-2); }
		.search-row { flex-direction: column; }
		.search-row .input[type='text'] { min-width: 100%; }
		.search-row .btn { width: 100%; }
		.filter-btn { flex: 1; justify-content: center; }
		.results-head { flex-direction: column; align-items: flex-start; }
		.filter-input { max-width: 100%; width: 100%; }
		.filter-panel { padding: var(--space-2); }
		.filter-actions { flex-direction: column; }
		.filter-actions .btn { width: 100%; }
		.detail-layout { flex-direction: column; }
		.detail { flex: none; min-height: 0; }
		.detail-cover { width: 100px; }
		.chapters-panel { max-height: none; }
		.filter-bar { flex-direction: column; align-items: flex-start; }
		.chapter-count { margin-bottom: var(--space-1); }
		.chapter-row { flex-wrap: wrap; }
		.chapter-main { flex: 1 1 100%; }
		.chapter-row .icon-btn { flex-shrink: 0; }
		.reader-bar { flex-wrap: wrap; padding: 0.4rem 0.5rem; gap: 0.4rem; }
		.reader-select { order: 3; flex: 1 0 100%; max-width: none; }
		.reader-nav { gap: 0.15rem; }
		.reader-nav .icon-btn { width: 36px; height: 36px; }
		.reader-settings { width: 180px; right: -40px; }
		.reader-filters { width: 190px; right: -20px; }
		.go-up { width: 48px; height: 48px; }
	}
</style>
