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
		const context = await browser.createBrowserContext();
		const first = await ComixBrowserCapture._captureChapterPage(context, titleUrl, 1, timeoutMs);

		if (!first?.items?.length) {
			await context.close().catch(() => {});
			throw new Error(`Failed to capture chapter list from ${titleUrl}`);
		}

		const allItems = [...first.items];
		const lastPage = first.lastPage || 1;

		if (lastPage > 1) {
			const targets = [];

			for (let page = 2; page <= lastPage; page++) {
				targets.push(page);
			}

			const CONCURRENCY = Math.min(targets.length, 20);
			const results = new Array(targets.length);
			let cursor = 0;

			const worker = async () => {
				while (cursor < targets.length) {
					const index = cursor++;

					results[index] = await ComixBrowserCapture._captureChapterPage(context, titleUrl, targets[index], timeoutMs);
				}
			};

			await Promise.all(Array.from({ length: Math.min(CONCURRENCY, targets.length) }, worker));

			for (const result of results) {
				if (result?.items?.length) {
					allItems.push(...result.items);
				}
			}
		}

		await context.close().catch(() => {});

		return JSON.stringify(allItems);
	}

	static async _captureChapterPage(context, titleUrl, targetPage, timeoutMs) {
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

		let captured = null;
		let resolveCapture;

		await page.exposeFunction('__COMIX_CH__', (json) => {
			if (!captured) {
				captured = json;
				resolveCapture?.();
			}
		});

		await page.evaluateOnNewDocument(`
			(function(){
				var _p = JSON.parse;
				JSON.parse = function() {
					var r = _p.apply(this, arguments);
					try {
						if (r && r.result && Array.isArray(r.result.items)) {
							var first = r.result.items[0];
							if (first && ('number' in first) && ('id' in first)) {
								var m = r.result.meta || r.result.pagination || {};
								window.__COMIX_CH__(JSON.stringify({ items: r.result.items, hasNext: !!m.hasNext, lastPage: m.lastPage || m.last_page || 0 }));
							}
						}
					} catch(e) {}
					return r;
				};
			})();
		`);

		page.goto(`${titleUrl}?page=${targetPage}`, { waitUntil: 'domcontentloaded', timeout: timeoutMs }).catch(() => {});

		await new Promise((resolve) => {
			resolveCapture = resolve;
			setTimeout(resolve, 5_000);
		});

		await page.close().catch(() => {});

		if (!captured) {
			return null;
		}

		try {
			return JSON.parse(captured);
		} catch {
			return null;
		}
	}

	static async captureChapterPage({ titleUrl, page = 1, timeoutMs = 30_000 }) {
		const browser = await comixBrowserPool.browser();
		const context = await browser.createBrowserContext();

		try {
			const result = await ComixBrowserCapture._captureChapterPage(context, titleUrl, page, timeoutMs);

			return result || { items: [], lastPage: 0, hasNext: false };
		} finally {
			await context.close().catch(() => {});
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

	static async captureBrowseList({ browseUrl, timeoutMs = 30_000 }) {
		const browser = await comixBrowserPool.browser();
		const context = await browser.createBrowserContext();
		const page = await context.newPage();

		// Extract the search query from the URL to match against API responses
		const urlObj = new URL(browseUrl);
		const searchQuery = urlObj.searchParams.get('q') || urlObj.searchParams.get('keyword') || '';

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

		let captured = null;
		let resolveCapture;
		const capturePromise = new Promise((resolve) => {
			resolveCapture = resolve;
		});

		await page.exposeFunction('__COMIX_BROWSE_DATA__', (json) => {
			if (!captured) {
				captured = json;
				resolveCapture();
			}
		});

		await page.evaluateOnNewDocument(`
			(function(){
				if (window.__comixBrowseCaptureV2) return;
				window.__comixBrowseCaptureV2 = true;
				var _IFACE = window.__COMIX_BROWSE_DATA__;
				var _SEARCH_QUERY = ${JSON.stringify(searchQuery)};
				var _p = JSON.parse;
				function _tryCapture(text){
					try {
						var o = _p(text);
						if (o && o.result && Array.isArray(o.result.items) && o.result.items.length > 0) {
							var first = o.result.items[0];
							if (first && first.hid && first.title) {
								_IFACE(JSON.stringify(o));
								return true;
							}
						}
					} catch(e){}
					return false;
				}
				JSON.parse = function(){
					var r = _p.apply(this, arguments);
					try { if (typeof arguments[0] === 'string') _tryCapture(arguments[0]); } catch(e){}
					return r;
				};
				var _f = window.fetch;
				window.fetch = function(){
					return _f.apply(this, arguments).then(function(r){
						try { r.clone().text().then(_tryCapture); } catch(e){}
						return r;
					});
				};
				var _x = XMLHttpRequest.prototype.open;
				var _s = XMLHttpRequest.prototype.send;
				XMLHttpRequest.prototype.open = function(m,u){ this.__url = u; return _x.apply(this, arguments); };
				XMLHttpRequest.prototype.send = function(){
					var s = this;
					s.addEventListener('load', function(){ try { _tryCapture(s.responseText); } catch(e){} });
					return _s.apply(this, arguments);
				};
			})();
		`);

		page.goto(browseUrl, { waitUntil: 'domcontentloaded', timeout: timeoutMs }).catch(() => {});

		try {
			await Promise.race([capturePromise, new Promise((r) => setTimeout(r, 20_000))]);

			if (!captured) {
				return null;
			}

			return JSON.parse(captured);
		} catch {
			return null;
		} finally {
			await context.close().catch(() => {});
		}
	}

	static async captureDetail({ detailUrl, timeoutMs = 15_000 }) {
		const browser = await comixBrowserPool.browser();
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

		page.goto(detailUrl, { waitUntil: 'domcontentloaded', timeout: timeoutMs }).catch(() => {});

		await new Promise((r) => setTimeout(r, 2_000));

		const manga = await page.evaluate(() => {
			const script = document.querySelector('script#initial-data');
			if (!script) return null;
			try {
				const data = JSON.parse(script.textContent);
				const queries = data?.queries;
				if (!queries) return null;
				for (const [key, value] of Object.entries(queries)) {
					if (key.includes('"detail"') && value?.hid && value?.title) {
						return value;
					}
				}
				for (const value of Object.values(queries)) {
					if (value?.hid && value?.title && value?.status !== undefined) {
						return value;
					}
				}
				return null;
			} catch {
				return null;
			}
		});

		await page.close().catch(() => {});
		await context.close().catch(() => {});

		return manga || null;
	}
}
