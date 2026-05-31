import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

export { puppeteer };

const LAUNCH_ARGS = [
	'--no-sandbox',
	'--disable-setuid-sandbox',
	'--disable-gpu',
	'--disable-blink-features=AutomationControlled'
];
const IDLE_MS = 5 * 60 * 1000;
const DIRECT_TIMEOUT_MS = 8_000;

class ComixBrowserPool {
	#browser = null;
	#launching = null;
	#pages = new Set();
	#reusable = null;
	#apiBlocked = false;
	#idleTimer = null;
	#lock = null;

	get apiBlocked() {
		return this.#apiBlocked;
	}

	get openTabs() {
		return this.#pages.size;
	}

	async browser() {
		if (this.#browser?.connected) {
			return this.#browser;
		}

		if (!this.#launching) {
			this.#launching = puppeteer.launch({ headless: true, args: LAUNCH_ARGS }).then((browser) => {
				this.#browser = browser;
				this.#launching = null;
				browser.on('disconnected', () => {
					this.#browser = null;
					this.#reusable = null;
					this.#pages.clear();
				});

				return browser;
			});
		}

		return this.#launching;
	}

	#armIdle() {
		clearTimeout(this.#idleTimer);
		this.#idleTimer = setTimeout(() => {
			this.close().catch(() => {});
		}, IDLE_MS);
		this.#idleTimer.unref?.();
	}

	async #reusableTab() {
		const browser = await this.browser();

		if (this.#reusable && !this.#reusable.page.isClosed()) {
			return this.#reusable;
		}

		const page = await browser.newPage();

		await ComixBrowserCapture.configurePage(page);

		const state = { page, resolve: null, reject: null };

		await page.exposeFunction('__COMIX_PAGES__', (payload) => state.resolve?.(payload));
		await page.evaluateOnNewDocument(ComixBrowserCapture.PAGES_HOOK_SCRIPT);
		page.on('response', (res) => {
			const url = res.url();

			if (url.includes('/api/v1/chapters/') && !url.includes('chapter-indexes') && res.status() === 403) {
				this.#apiBlocked = true;
				state.reject?.(new Error('Comix API returned 403 (IP blocked)'));
			}
		});

		this.#reusable = state;
		this.#pages.add(page);
		page.once('close', () => {
			this.#pages.delete(page);

			if (this.#reusable?.page === page) {
				this.#reusable = null;
			}
		});

		return state;
	}

	async #captureReusableDirect(pageUrl, timeoutMs) {
		const state = await this.#reusableTab();

		let timer;
		const payload = new Promise((resolve, reject) => {
			timer = setTimeout(() => reject(new Error('Comix direct capture timed out')), DIRECT_TIMEOUT_MS);
			state.resolve = resolve;
			state.reject = reject;
		});

		state.page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: timeoutMs }).catch(() => {});
		this.#armIdle();

		try {
			return await payload;
		} finally {
			clearTimeout(timer);
			state.resolve = null;
			state.reject = null;
		}
	}

	async captureDirect(pageUrl, timeoutMs) {
		const run = (this.#lock || Promise.resolve()).then(() => this.#captureReusableDirect(pageUrl, timeoutMs));

		this.#lock = run.catch(() => {});

		return run;
	}

	async close() {
		clearTimeout(this.#idleTimer);

		const browser = this.#browser;

		this.#browser = null;
		this.#reusable = null;
		this.#pages.clear();
		await browser?.close().catch(() => {});
	}
}

export const comixBrowserPool = new ComixBrowserPool();

export class ComixBrowserCapture {
	static get DEFAULT_HEADERS() {
		return {
			'User-Agent':
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
			'Accept-Language': 'en-US,en;q=0.9'
		};
	}

	static async configurePage(page) {
		await page.setUserAgent(ComixBrowserCapture.DEFAULT_HEADERS['User-Agent']);
		await page.setExtraHTTPHeaders({ 'Accept-Language': ComixBrowserCapture.DEFAULT_HEADERS['Accept-Language'] });
		await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
	}

	static async captureChapterList({ titleUrl, timeoutMs = 60_000 }) {
		const browser = await comixBrowserPool.browser();
		const first = await ComixBrowserCapture._captureOnePage(browser, titleUrl, 1, timeoutMs);

		if (!first?.items?.length) {
			throw new Error(`Failed to capture chapter list from ${titleUrl}`);
		}

		const allItems = [...first.items];
		const lastPage = Math.min(first.lastPage || 1, 50);

		if (lastPage > 1) {
			const targets = [];

			for (let page = 2; page <= lastPage; page++) {
				targets.push(page);
			}

			const CONCURRENCY = 5;
			const results = new Array(targets.length);
			let cursor = 0;

			const worker = async () => {
				while (cursor < targets.length) {
					const index = cursor++;

					results[index] = await ComixBrowserCapture._captureOnePage(browser, titleUrl, targets[index], timeoutMs);
				}
			};

			await Promise.all(Array.from({ length: Math.min(CONCURRENCY, targets.length) }, worker));

			for (const result of results) {
				if (result?.items?.length) {
					allItems.push(...result.items);
				}
			}
		}

		return JSON.stringify(allItems);
	}

	static async _captureOnePage(browser, titleUrl, targetPage, timeoutMs) {
		const context = await browser.createBrowserContext();
		const page = await context.newPage();

		await ComixBrowserCapture.configurePage(page);
		await page.setRequestInterception(true);
		page.on('request', (request) => {
			const type = request.resourceType();

			if (type === 'image' || type === 'media' || type === 'font' || type === 'stylesheet') {
				request.abort().catch(() => {});
			} else {
				request.continue().catch(() => {});
			}
		});

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
								window.__COMIX_PAGE_DATA__(JSON.stringify({ items: o.result.items, hasNext: !!m.hasNext, lastPage: m.lastPage || 0 }));
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

		page.goto(titleUrl, { waitUntil: 'domcontentloaded', timeout: timeoutMs }).catch(() => {});

		await Promise.race([resultPromise, new Promise((r) => setTimeout(r, 12_000))]);
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
		const browser = await comixBrowserPool.browser();

		if (comixBrowserPool.apiBlocked) {
			return ComixBrowserCapture._capturePagesIntercepted(browser, pageUrl, timeoutMs);
		}

		try {
			return await comixBrowserPool.captureDirect(pageUrl, timeoutMs);
		} catch {
			return ComixBrowserCapture._capturePagesIntercepted(browser, pageUrl, timeoutMs);
		}
	}

	static async _capturePagesIntercepted(browser, pageUrl, timeoutMs) {
		const context = await browser.createBrowserContext();
		const page = await context.newPage();

		await ComixBrowserCapture.configurePage(page);

		let resolveCapture, rejectCapture;
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
						headers: { 'x-enc': headers['x-enc'] || '', 'content-type': headers['content-type'] || 'application/json' },
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
