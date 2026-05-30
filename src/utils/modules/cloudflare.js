import { fetch } from 'undici';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const CHALLENGE_STATUS = new Set([403, 503]);
const CHALLENGE_RE = /just a moment|cf-chl|challenge-platform|attention required|verifying you are human/i;
const DEFAULT_TIMEOUT = 60_000;

let browserPromise = null;

function looksLikeChallenge(status, body) {
	if (CHALLENGE_STATUS.has(status)) {
		return true;
	}

	return typeof body === 'string' && CHALLENGE_RE.test(body.slice(0, 4000));
}

async function getBrowser() {
	if (!browserPromise) {
		browserPromise = puppeteer.launch({
			headless: true,
			args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-blink-features=AutomationControlled']
		});
	}

	return browserPromise;
}

/**
 * Close the shared fallback browser, if one was launched.
 *
 * @returns {Promise<void>}
 */
export async function closeCloudflareBrowser() {
	if (!browserPromise) {
		return;
	}

	const browser = await browserPromise.catch(() => null);

	browserPromise = null;

	if (browser) {
		await browser.close().catch(() => {});
	}
}

async function withPage(handler) {
	const browser = await getBrowser();
	const page = await browser.newPage();

	await page.setUserAgent(UA);
	await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });
	await page.setViewport({ width: 1280, height: 800 });

	try {
		return await handler(page);
	} finally {
		await page.close().catch(() => {});
	}
}

async function waitForClearance(page, json, timeoutMs) {
	await page
		.waitForFunction(
			(wantJson) => {
				const title = document.title || '';

				if (/just a moment|attention required|verifying/i.test(title)) {
					return false;
				}

				const body = document.body ? document.body.innerText.trim() : '';

				if (!body) {
					return false;
				}

				return wantJson ? body.startsWith('{') || body.startsWith('[') : true;
			},
			{ timeout: timeoutMs, polling: 1000 },
			json
		)
		.catch(() => {});
}

/**
 * Load a URL in a stealth browser, wait out the Cloudflare challenge, then return the body.
 *
 * @param {string} url
 * @param {{ json?: boolean, timeoutMs?: number }} [options]
 * @returns {Promise<string>} JSON body text when `json` is true, otherwise full HTML.
 */
export async function browserGet(url, { json = false, timeoutMs = DEFAULT_TIMEOUT } = {}) {
	return withPage(async (page) => {
		await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeoutMs }).catch(() => {});
		await waitForClearance(page, json, timeoutMs);

		return json ? page.evaluate(() => (document.body ? document.body.innerText : '')) : page.content();
	});
}

/**
 * GET text/HTML, falling back to the browser on a Cloudflare challenge.
 *
 * @param {string} url
 * @param {{ headers?: Record<string, string>, timeoutMs?: number }} [options]
 * @returns {Promise<string>}
 */
export async function cfFetchText(url, { headers = {}, timeoutMs = DEFAULT_TIMEOUT } = {}) {
	try {
		const res = await fetch(url, { headers: { 'User-Agent': UA, ...headers } });
		const text = await res.text();

		if (!looksLikeChallenge(res.status, text)) {
			return text;
		}
	} catch {
		// network error → try the browser
	}

	return browserGet(url, { json: false, timeoutMs });
}

/**
 * GET JSON, falling back to the browser on a Cloudflare challenge.
 *
 * @param {string} url
 * @param {{ headers?: Record<string, string>, timeoutMs?: number }} [options]
 * @returns {Promise<any>}
 */
export async function cfFetchJSON(url, { headers = {}, timeoutMs = DEFAULT_TIMEOUT } = {}) {
	try {
		const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': UA, ...headers } });

		if (!CHALLENGE_STATUS.has(res.status)) {
			const text = await res.text();

			if (!looksLikeChallenge(res.status, text)) {
				return JSON.parse(text);
			}
		}
	} catch {
		// fall through to browser
	}

	return JSON.parse(await browserGet(url, { json: true, timeoutMs }));
}

/**
 * Run a request inside a Cloudflare-cleared page on `originUrl` (carries the clearance cookie).
 *
 * @param {string} originUrl
 * @param {string} requestUrl
 * @param {{ method?: string, formFields?: Record<string, string> | null, timeoutMs?: number }} [options]
 * @returns {Promise<string>}
 */
export async function cfBrowserRequest(
	originUrl,
	requestUrl,
	{ method = 'GET', formFields = null, timeoutMs = DEFAULT_TIMEOUT } = {}
) {
	return withPage(async (page) => {
		await page.goto(originUrl, { waitUntil: 'domcontentloaded', timeout: timeoutMs }).catch(() => {});
		await waitForClearance(page, false, timeoutMs);

		return page.evaluate(
			async (url, httpMethod, fields) => {
				let body;

				if (fields) {
					body = new FormData();

					for (const [key, value] of Object.entries(fields)) {
						body.append(key, value);
					}
				}

				const res = await fetch(url, { method: httpMethod, body });

				return res.text();
			},
			requestUrl,
			method,
			formFields
		);
	});
}

/**
 * POST multipart form fields, falling back to an origin-cleared browser request on a challenge.
 *
 * @param {string} url
 * @param {Record<string, string>} fields
 * @param {{ originUrl?: string, headers?: Record<string, string>, timeoutMs?: number }} [options]
 * @returns {Promise<string>}
 */
export async function cfPostForm(url, fields, { originUrl, headers = {}, timeoutMs = DEFAULT_TIMEOUT } = {}) {
	try {
		const form = new FormData();

		for (const [key, value] of Object.entries(fields)) {
			form.append(key, value);
		}

		const res = await fetch(url, { method: 'POST', headers: { 'User-Agent': UA, ...headers }, body: form });
		const text = await res.text();

		if (!looksLikeChallenge(res.status, text)) {
			return text;
		}
	} catch {
		// fall through to browser
	}

	return cfBrowserRequest(originUrl || new URL(url).origin, url, { method: 'POST', formFields: fields, timeoutMs });
}
