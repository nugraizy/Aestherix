import { AltchaSolver } from './altcha.js';

const BASE_URL = 'https://qobuz.squid.wtf';
const COOKIE_VALIDITY_MS = 28 * 60 * 1000;

/**
 * Manages the ALTCHA captcha flow to obtain and cache a qobuz.squid.wtf cookie.
 * No I/O beyond fetch — the heavy computation (SHA-256 brute-force) is delegated
 * to AltchaSolver.
 */
class CookieManager {
	/** @type {string | null} */
	_cookieHeader = null;

	/** @type {number} */
	_cookieExpiresAt = 0;

	/** @type {AltchaSolver} */
	_solver;

	/** @type {(url: string, init?: RequestInit) => Promise<Response>} */
	_fetch;

	/**
	 * @param {Object} [options]
	 * @param {AltchaSolver | { maxIterations?: number }} [options.solver]
	 * @param {(url: string, init?: RequestInit) => Promise<Response>} [options.fetchImpl]
	 */
	constructor({ solver, fetchImpl = fetch } = {}) {
		this._solver = solver instanceof AltchaSolver ? solver : new AltchaSolver(solver ?? {});
		this._fetch = fetchImpl;
	}

	/**
	 * Returns a valid cookie, solving altcha if the current one is expired or missing.
	 *
	 * @param {boolean} [forceRefresh=false] Force a new cookie even if the current one is valid.
	 * @returns {Promise<string>}
	 */
	async getCookie(forceRefresh = false) {
		if (!forceRefresh && this._cookieHeader && Date.now() < this._cookieExpiresAt) {
			return this._cookieHeader;
		}

		const ts = Date.now();
		const challengeResp = await this._fetch(`${BASE_URL}/api/altcha/challenge?ts=${ts}`);
		const { parameters, signature } = await challengeResp.json();

		const solution = this._solver.solve(parameters);
		const payloadB64 = this._solver.buildPayload({ parameters, signature }, solution);

		const verifyResp = await this._fetch(`${BASE_URL}/api/altcha/verify`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ payload: payloadB64 })
		});

		if (!verifyResp.ok) {
			const err = await verifyResp.json();

			throw new Error(`Captcha verify failed: ${JSON.stringify(err)}`);
		}

		const setCookie = verifyResp.headers.get('set-cookie');

		this._cookieHeader = setCookie.split(';')[0].trim();
		this._cookieExpiresAt = Date.now() + COOKIE_VALIDITY_MS;

		return this._cookieHeader;
	}

	/**
	 * Invalidates the cached cookie, forcing the next getCookie() call to solve a new challenge.
	 *
	 * @returns {void}
	 */
	clearCookie() {
		this._cookieHeader = null;
		this._cookieExpiresAt = 0;
	}
}

export { BASE_URL, CookieManager };
