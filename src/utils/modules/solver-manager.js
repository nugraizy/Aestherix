import crypto from 'crypto';

const DEFAULT_WAIT_TIMEOUT_MS = 5 * 60 * 1000;
const SOLVED_CLEANUP_MS = 30_000;
const CLEARANCE_POLL_MS = 1000;
const CLEARANCE_TIMEOUT_MS = 5 * 60 * 1000;
const CLEARANCE_RE = /just a moment|attention required|verifying|cloudflare/i;

class SolverManager {
	#challenges = new Map();
	#waiters = new Map();
	#manualSolveService = null;
	#solverCache = null;
	#io = null;

	setManualSolveService(service) {
		this.#manualSolveService = service;
	}

	setSolverCache(cache) {
		this.#solverCache = cache;
	}

	setSocketLayer(socketLayer) {
		this.#io = socketLayer?.io || null;
	}

	async registerChallenge({ url, service, headers = {} }) {
		const existing = this.#findExisting(url, service);

		if (existing) {
			if (existing.status === 'solved' && existing.cookies) {
				return { cached: true, cookies: existing.cookies, headers: existing.headers };
			}

			return { cached: false, id: existing.id, solveUrl: existing.solveUrl };
		}

		const cached = await this.getCachedCookies(service, url);

		if (cached) {
			return { cached: true, cookies: cached.cookies, headers: cached.headers };
		}

		const id = crypto.randomBytes(8).toString('hex');
		const challenge = {
			id,
			url,
			service,
			requestHeaders: headers,
			status: 'pending',
			claimedBy: null,
			sessionId: null,
			createdAt: Date.now(),
			solvedAt: null,
			cookies: null,
			headers: null,
			solveUrl: `/manual-solve?challenge=${id}`
		};

		this.#challenges.set(id, challenge);
		this.#emit();

		return { cached: false, id, solveUrl: challenge.solveUrl };
	}

	async claimChallenge(id, userId) {
		const challenge = this.#challenges.get(id);

		if (!challenge) {
			return { ok: false, message: 'Challenge not found.' };
		}

		if (challenge.status === 'solved') {
			return { ok: false, message: 'Challenge already solved.' };
		}

		if (challenge.status === 'solving') {
			if (challenge.claimedBy === userId) {
				return { ok: true, sessionId: challenge.sessionId };
			}

			return { ok: false, message: 'Being solved by another user.' };
		}

		challenge.status = 'solving';
		challenge.claimedBy = userId || crypto.randomBytes(4).toString('hex');

		if (this.#manualSolveService) {
			const session = await this.#manualSolveService.startChallengeSession({
				url: challenge.url,
				label: `${challenge.service} challenge`,
				challengeId: id
			});

			challenge.sessionId = session.id;
			this.#startClearanceDetection(id, session.id);
		}

		this.#emit();

		return { ok: true, sessionId: challenge.sessionId, claimedBy: challenge.claimedBy };
	}

	async solveChallenge(id, cookies, headers) {
		const challenge = this.#challenges.get(id);

		if (!challenge || challenge.status === 'solved') {
			return;
		}

		challenge.status = 'solved';
		challenge.cookies = cookies;
		challenge.headers = headers;
		challenge.solvedAt = Date.now();

		if (this.#solverCache) {
			await this.#solverCache.saveCookies(challenge.service, challenge.url, cookies, headers);
			this.#solverCache.addHistoryEntry({
				id: challenge.id,
				url: challenge.url,
				service: challenge.service,
				status: 'solved',
				createdAt: challenge.createdAt,
				solvedAt: challenge.solvedAt,
				claimedBy: challenge.claimedBy
			});
		}

		const waiters = this.#waiters.get(id) || [];

		for (const { resolve, timeout } of waiters) {
			clearTimeout(timeout);
			resolve({ cookies, headers });
		}

		this.#waiters.delete(id);
		this.#emit();

		if (challenge.sessionId && this.#manualSolveService) {
			await this.#manualSolveService.stopSession(challenge.sessionId).catch(() => {});
		}

		setTimeout(() => {
			this.#challenges.delete(id);
			this.#emit();
		}, SOLVED_CLEANUP_MS);
	}

	async failChallenge(id, reason = 'expired') {
		const challenge = this.#challenges.get(id);

		if (!challenge || challenge.status === 'solved') {
			return;
		}

		challenge.status = 'failed';
		challenge.failedAt = Date.now();
		challenge.failReason = reason;

		if (this.#solverCache) {
			this.#solverCache.addHistoryEntry({
				id: challenge.id,
				url: challenge.url,
				service: challenge.service,
				status: 'failed',
				createdAt: challenge.createdAt,
				failedAt: challenge.failedAt,
				failReason: reason,
				claimedBy: challenge.claimedBy
			});
		}

		const waiters = this.#waiters.get(id) || [];

		for (const { reject, timeout } of waiters) {
			clearTimeout(timeout);
			reject(new Error(`Challenge failed: ${reason}`));
		}

		this.#waiters.delete(id);

		if (challenge.sessionId && this.#manualSolveService) {
			await this.#manualSolveService.stopSession(challenge.sessionId).catch(() => {});
		}

		this.#challenges.delete(id);
		this.#emit();
	}

	waitForSolve(id, timeoutMs = DEFAULT_WAIT_TIMEOUT_MS) {
		return new Promise((resolve, reject) => {
			const challenge = this.#challenges.get(id);

			if (!challenge) {
				return reject(new Error('Challenge not found.'));
			}

			if (challenge.status === 'solved') {
				return resolve({ cookies: challenge.cookies, headers: challenge.headers });
			}

			const timeout = setTimeout(() => {
				void this.failChallenge(id, 'timeout');
				reject(new Error('Manual solve timed out.'));
			}, timeoutMs);

			if (!this.#waiters.has(id)) {
				this.#waiters.set(id, []);
			}

			this.#waiters.get(id).push({ resolve, reject, timeout });
		});
	}

	listChallenges() {
		return Array.from(this.#challenges.values()).map((c) => ({
			id: c.id,
			url: c.url,
			service: c.service,
			status: c.status,
			claimedBy: c.claimedBy,
			sessionId: c.sessionId,
			createdAt: c.createdAt,
			solvedAt: c.solvedAt,
			solveUrl: c.solveUrl
		}));
	}

	getChallenge(id) {
		return this.#challenges.get(id) || null;
	}

	async getCachedCookies(service, url) {
		if (!this.#solverCache) {
			return null;
		}

		return this.#solverCache.getCookies(service, url);
	}

	async manualSolveChallenge(id) {
		const challenge = this.#challenges.get(id);

		if (!challenge) {
			return { ok: false, message: 'Challenge not found.' };
		}

		if (challenge.status === 'solved') {
			return { ok: true, message: 'Already solved.' };
		}

		const sessionId = challenge.sessionId;

		if (!sessionId || !this.#manualSolveService) {
			return { ok: false, message: 'No active session.' };
		}

		const session = this.#manualSolveService.getSession(sessionId);

		if (!session || !session.page || session.page.isClosed()) {
			return { ok: false, message: 'Session page not available.' };
		}

		try {
			const cookies = await session.page.cookies();
			const headers = {
				'User-Agent': await session.page.evaluate(() => navigator.userAgent),
				'Accept-Language': 'en-US,en;q=0.9'
			};

			await this.solveChallenge(id, cookies, headers);

			return { ok: true };
		} catch (error) {
			return { ok: false, message: error.message };
		}
	}

	#findExisting(url, service) {
		for (const challenge of this.#challenges.values()) {
			if (challenge.url === url && challenge.service === service) {
				return challenge;
			}
		}

		return null;
	}

	#emit() {
		if (this.#io) {
			this.#io.emit('solver:challenges', { challenges: this.listChallenges() });
		}
	}

	async #startClearanceDetection(challengeId, sessionId) {
		const manualSolve = this.#manualSolveService;

		if (!manualSolve) {
			return;
		}

		const challenge = this.#challenges.get(challengeId);
		const challengeUrl = challenge?.url || '';
		const deadline = Date.now() + CLEARANCE_TIMEOUT_MS;

		while (Date.now() < deadline) {
			await new Promise((r) => setTimeout(r, CLEARANCE_POLL_MS));

			const current = this.#challenges.get(challengeId);

			if (!current || current.status === 'solved') {
				return;
			}

			const session = manualSolve.getSession(sessionId);

			if (!session || session.closing) {
				return;
			}

			const page = session.page;

			if (!page || page.isClosed()) {
				return;
			}

			try {
				const currentUrl = page.url();
				const title = await page.title();
				const bodyText = await page.evaluate(() => (document.body ? document.body.innerText.slice(0, 2000) : ''));
				const cookies = await page.cookies();

				const hasClearanceCookie = cookies.some((c) => c.name === 'cf_clearance');
				const urlChanged = challengeUrl && currentUrl !== challengeUrl && !currentUrl.includes('challenge');
				const titleClear = title && !CLEARANCE_RE.test(title);
				const hasSuccessIndicator = /verification successful|turnstile solved|challenge completed|you are verified/i.test(
					bodyText
				);

				if (hasClearanceCookie || urlChanged || (titleClear && hasSuccessIndicator)) {
					const headers = {
						'User-Agent': await page.evaluate(() => navigator.userAgent),
						'Accept-Language': 'en-US,en;q=0.9'
					};

					await this.solveChallenge(challengeId, cookies, headers);
					return;
				}
			} catch {
				return;
			}
		}
	}
}

export const solverManager = new SolverManager();
