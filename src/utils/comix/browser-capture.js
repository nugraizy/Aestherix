import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

export { puppeteer };

export class ComixBrowserCapture {
	static get DEFAULT_HEADERS() {
		return {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
			'Accept-Language': 'en-US,en;q=0.9'
		};
	}

	static async configurePage(page) {
		await page.setUserAgent(ComixBrowserCapture.DEFAULT_HEADERS['User-Agent']);
		await page.setExtraHTTPHeaders({ 'Accept-Language': ComixBrowserCapture.DEFAULT_HEADERS['Accept-Language'] });
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
			let resolveCapture, rejectCapture;
			const capturePromise = new Promise((resolve, reject) => { resolveCapture = resolve; rejectCapture = reject; });

			const settleCapture = (payload) => {
				if (settled) {return;}

				settled = true;
				clearTimeout(timeout);
				resolveCapture(payload);
			};

			let timeout = setTimeout(() => rejectCapture(new Error(`Failed to capture decrypted payload from ${titleUrl}`)), timeoutMs);

			const resetTimeout = () => {
				clearTimeout(timeout);
				timeout = setTimeout(() => rejectCapture(new Error(`Failed to capture decrypted payload from ${titleUrl}`)), timeoutMs);
			};

			let fallbackStarted = false;

			page.on('response', (res) => {
				const url = res.url();
				const status = res.status();

				if (status === 403 && url.includes('/chapters') && gotFirstPage && !settled && !fallbackStarted) {
					fallbackStarted = true;
					page.evaluate(() => { if (typeof window.__comixStopPager === 'function') {window.__comixStopPager();} }).catch(() => {});
					ComixBrowserCapture._reloadFallback({ browser, titleUrl, firstPageItems, firstPageHasNext, timeoutMs })
						.then(settleCapture)
						.catch(() => { if (firstPageItems?.length) {settleCapture(JSON.stringify(firstPageItems));} });
				}
			});

			await page.exposeFunction('__COMIX_CHAPTERS__', (payload) => { settleCapture(payload); });
			await page.exposeFunction('__COMIX_RESET_TIMER__', () => { resetTimeout(); });
			await page.exposeFunction('__COMIX_GOT_PAGE__', (pageJson) => {
				gotFirstPage = true;

				if (!firstPageItems) {
					try { const parsed = JSON.parse(pageJson);

 firstPageItems = parsed.items; firstPageHasNext = parsed.hasNext; } catch { /* ignore parse errors */ }
				}
			});

			const script = ComixBrowserCapture._CHAPTERS_HOOK_SCRIPT;

			await page.evaluateOnNewDocument(script);
			page.goto(titleUrl, { waitUntil: 'domcontentloaded', timeout: timeoutMs }).catch(() => {});
			page.evaluate(script).catch(() => {});

			const result = await capturePromise;

			await page.close();
			return result;
		} finally {
			if (browser) {await browser.close();}
		}
	}

	static get _CHAPTERS_HOOK_SCRIPT() {
		return `
			(function(){
				if (window.__comixInit) return;
				window.__comixInit = true;
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
					try { _IFACE(JSON.stringify(_items)); } catch (e) {}
				}
				window.__comixStopPager = function(){ if (_pagerInterval) { clearInterval(_pagerInterval); _pagerInterval = null; } };
				function _rewriteUrl(url){
					if (typeof url === 'string' && url.indexOf('/chapters') !== -1 && /[?&]limit=\\d+/.test(url)) {
						return url.replace(/([?&]limit=)\\d+/, '$1' + '100');
					}
					return url;
				}
				function _handle(o){
					try{
					if(!_isChapters(o)) return;
					var m = o.result.meta || o.result.pagination || {};
					var p = m.page || 1;
					gotFirst = true;
					lastHasNext = !!m.hasNext;
					if (p > curPage) curPage = p;
					if (_seen[p]) return;
					_seen[p] = true;
					for (var i = 0; i < o.result.items.length; i++) _items.push(o.result.items[i]);
					try { _GOT_PAGE(JSON.stringify({ items: o.result.items, hasNext: !!m.hasNext })); } catch (e) {}
					if (m && m.hasNext) { try { _RESET(); } catch (e) {} _startPager(); } else { _submit(); }
					}catch(e){}
				}
				JSON.parse = function(){ var r = _p.apply(this, arguments); try{ if (typeof arguments[0] === 'string') _handle(r); }catch(e){} return r; };
				function _tryText(t){ try{ if (typeof t === 'string') _handle(_p(t)); }catch(e){} }
				var _f = window.fetch;
				window.fetch = function(i,d){
					if (typeof i === 'string') i = _rewriteUrl(i);
					else if (i && typeof i.url === 'string') { var nu = _rewriteUrl(i.url); if (nu !== i.url) i = new Request(nu, i); }
					return _f.call(this,i,d).then(function(r){ try{ r.clone().text().then(_tryText); }catch(e){} return r; });
				};
				var _x = XMLHttpRequest.prototype.open;
				XMLHttpRequest.prototype.open = function(m,u){ arguments[1] = _rewriteUrl(u); var s = this; s.addEventListener('load', function(){ _tryText(s.responseText); }); return _x.apply(this, arguments); };
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
						if (n && !n.disabled) { acted = curPage; idle = 0; n.click(); }
					}, 700);
				}
			})();
		`;
	}

	static async _reloadFallback({ browser, titleUrl, firstPageItems, firstPageHasNext, timeoutMs }) {
		const allItems = [...(firstPageItems || [])];
		const MAX_PAGES = 50;
		const CONCURRENCY = 3;

		if (!firstPageHasNext) {return JSON.stringify(allItems);}

		let nextPage = 2;
		let done = false;

		while (!done && nextPage <= MAX_PAGES) {
			const batch = [];

			for (let i = 0; i < CONCURRENCY && nextPage + i <= MAX_PAGES; i++) {batch.push(nextPage + i);}

			const results = await Promise.all(batch.map((p) => ComixBrowserCapture._captureOnePage(browser, titleUrl, p, timeoutMs)));

			for (let i = 0; i < results.length; i++) {
				const pageData = results[i];

				if (!pageData) { done = true; break; }

				allItems.push(...pageData.items);

				if (!pageData.hasNext) { done = true; break; }
			}

			nextPage += batch.length;
		}

		return JSON.stringify(allItems);
	}

	static async _captureOnePage(browser, titleUrl, targetPage, timeoutMs) {
		const context = await browser.createBrowserContext();
		const page = await context.newPage();

		await ComixBrowserCapture.configurePage(page);

		let result = null;
		let resolveResult;
		const resultPromise = new Promise((resolve) => { resolveResult = resolve; });

		await page.exposeFunction('__COMIX_PAGE_DATA__', (json) => { result = json; resolveResult(); });

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
								window.__COMIX_PAGE_DATA__(JSON.stringify({ items: o.result.items, hasNext: !!m.hasNext }));
							}
						}
					} catch(e){}
				}
				JSON.parse = function(){ var r = _p.apply(this, arguments); try { if (typeof arguments[0] === 'string') _tryCapture(arguments[0]); } catch(e){} return r; };
				window.fetch = (function(_f){ return function(i,d){ if (typeof i === 'string') i = _rewriteUrl(i); return _f.call(this,i,d).then(function(r){ try{ r.clone().text().then(function(t){ _tryCapture(t); }); }catch(e){} return r; }); }; })(window.fetch);
				var _x = XMLHttpRequest.prototype.open;
				XMLHttpRequest.prototype.open = function(m,u){ arguments[1] = _rewriteUrl(u); var s = this; s.addEventListener('load', function(){ _tryCapture(s.responseText); }); return _x.apply(this, arguments); };
			})();
		`);

		try { await page.goto(titleUrl, { waitUntil: 'networkidle2', timeout: timeoutMs }); } catch { /* navigation may fail */ }

		await Promise.race([resultPromise, new Promise((r) => setTimeout(r, 8000))]);
		await context.close();

		if (!result) {return null;}

		try { return JSON.parse(result); } catch { return null; }
	}

	static get PAGES_HOOK_SCRIPT() {
		return `
			(function(){
				var _done = false;
				var _IFACE = window.__COMIX_PAGES__;
				if (!_IFACE) return;
				var _p = JSON.parse;
				function _tryCapture(text) { if (_done) return; try { var obj = _p(text); if (obj && obj.result && obj.result.pages) { _done = true; _IFACE(text); } } catch (e) {} }
				JSON.parse = function() { var r = _p.apply(this, arguments); try { if (!_done && r && r.result && r.result.pages) { _done = true; _IFACE(arguments[0]); } } catch (e) {} return r; };
				var _f = window.fetch;
				window.fetch = function(i, d) { return _f.call(this, i, d).then(function(r) { try { r.clone().text().then(_tryCapture); } catch (e) {} return r; }); };
				var _x = XMLHttpRequest.prototype.open;
				XMLHttpRequest.prototype.open = function(m, u) { var s = this; s.addEventListener('load', function() { _tryCapture(s.responseText); }); return _x.apply(this, arguments); };
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

			return await ComixBrowserCapture._capturePagesDirect(browser, pageUrl, timeoutMs).catch(async () => {
				return ComixBrowserCapture._capturePagesIntercepted(browser, pageUrl, timeoutMs);
			});
		} finally {
			if (browser) {await browser.close();}
		}
	}

	static async _capturePagesDirect(browser, pageUrl, timeoutMs) {
		const context = await browser.createBrowserContext();
		const page = await context.newPage();

		await ComixBrowserCapture.configurePage(page);

		let resolveCapture, rejectCapture;
		const capturePromise = new Promise((resolve, reject) => { resolveCapture = resolve; rejectCapture = reject; });
		const timeout = setTimeout(() => rejectCapture(new Error(`Failed to capture chapter pages from ${pageUrl}`)), timeoutMs);

		await page.exposeFunction('__COMIX_PAGES__', (payload) => { clearTimeout(timeout); resolveCapture(payload); });

		await page.evaluateOnNewDocument(ComixBrowserCapture.PAGES_HOOK_SCRIPT);
		page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: timeoutMs }).catch(() => {});
		page.evaluate(ComixBrowserCapture.PAGES_HOOK_SCRIPT).catch(() => {});

		try { return await capturePromise; } finally { await context.close(); }
	}

	static async _capturePagesIntercepted(browser, pageUrl, timeoutMs) {
		const context = await browser.createBrowserContext();
		const page = await context.newPage();

		await ComixBrowserCapture.configurePage(page);

		let resolveCapture, rejectCapture;
		const capturePromise = new Promise((resolve, reject) => { resolveCapture = resolve; rejectCapture = reject; });
		const timeout = setTimeout(() => rejectCapture(new Error(`Failed to capture chapter pages from ${pageUrl}`)), timeoutMs);

		await page.exposeFunction('__COMIX_PAGES__', (payload) => { clearTimeout(timeout); resolveCapture(payload); });
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
					request.respond({ status: 200, contentType: headers['content-type'] || 'application/json', headers: { 'x-enc': headers['x-enc'] || '', 'content-type': headers['content-type'] || 'application/json' }, body });
				} catch { request.continue(); }
			} else {
				request.continue();
			}
		});

		page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: timeoutMs }).catch(() => {});

		try { return await capturePromise; } finally { await context.close(); }
	}
}
