const ipStore = new Map();

const DEFAULTS = {
	windowMs: 60_000,
	maxRequests: 10,
	message: 'Too many requests. Please wait before trying again.'
};

function rateLimit({ windowMs = DEFAULTS.windowMs, maxRequests = DEFAULTS.maxRequests, message = DEFAULTS.message } = {}) {
	const safeWindow = Math.max(1_000, Number(windowMs) || DEFAULTS.windowMs);
	const safeMax = Math.max(1, Number(maxRequests) || DEFAULTS.maxRequests);

	return function rateLimitMiddleware(req, res, next) {
		const ip = String(req.ip || req.socket?.remoteAddress || 'unknown');
		const now = Date.now();
		const entry = ipStore.get(ip);

		if (!entry || now - entry.windowStart > safeWindow) {
			ipStore.set(ip, { windowStart: now, count: 1 });
			return next();
		}

		entry.count += 1;

		if (entry.count > safeMax) {
			const retryAfter = Math.ceil((entry.windowStart + safeWindow - now) / 1000);

			res.setHeader('Retry-After', String(Math.max(1, retryAfter)));
			res.setHeader('X-RateLimit-Limit', String(safeMax));
			res.setHeader('X-RateLimit-Remaining', '0');
			res.setHeader('X-RateLimit-Reset', String(Math.ceil((entry.windowStart + safeWindow) / 1000)));
			return res.status(429).json({ ok: false, message });
		}

		res.setHeader('X-RateLimit-Limit', String(safeMax));
		res.setHeader('X-RateLimit-Remaining', String(Math.max(0, safeMax - entry.count)));
		res.setHeader('X-RateLimit-Reset', String(Math.ceil((entry.windowStart + safeWindow) / 1000)));
		next();
	};
}

function cleanup() {
	const now = Date.now();
	const window = Math.max(1_000, DEFAULTS.windowMs);

	for (const [ip, entry] of ipStore.entries()) {
		if (now - entry.windowStart > window * 2) {
			ipStore.delete(ip);
		}
	}
}

setInterval(cleanup, DEFAULTS.windowMs).unref();

export { rateLimit };
