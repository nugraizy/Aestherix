/**
 * Pinterest profile picture history adapter.
 *
 * @module database/adapters/pinterest-profile-pictures
 */

/** @typedef {import('@prisma/client').PrismaClient} PrismaClient */

let disposed = false;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryablePrismaError = (error) => {
	return Boolean(
		error &&
		(error.code === 'P2034' ||
			error.code === 'P2028' ||
			/Transaction.*aborted/i.test(error.message || '') ||
			/write conflict|deadlock/i.test(error.message || ''))
	);
};

const withRetry = async (operation, { retries = 3, baseDelayMs = 80 } = {}) => {
	let attempt = 0;

	while (true) {
		try {
			return await operation();
		} catch (error) {
			attempt += 1;

			if (attempt > retries || !isRetryablePrismaError(error)) {
				throw error;
			}

			const jitter = Math.floor(Math.random() * baseDelayMs);

			await sleep(baseDelayMs * attempt + jitter);
		}
	}
};

const writeQueues = new Map();

const enqueueWrite = (key, task) => {
	const previous = writeQueues.get(key) || Promise.resolve();
	const next = previous
		.catch(() => undefined)
		.then(task)
		.finally(() => {
			if (writeQueues.get(key) === next) {
				writeQueues.delete(key);
			}
		});

	writeQueues.set(key, next);
	return next;
};

const normalizeEntry = (entry) => {
	const timestamp = String(entry?.timestamp || '').trim();
	const url = String(entry?.url || '').trim();
	const thumbnail = String(entry?.thumbnail || '').trim();

	if (!timestamp || !/^https?:\/\//i.test(url)) {
		return null;
	}

	return { timestamp, url, thumbnail: thumbnail || url };
};

/**
 * @param {PrismaClient} db
 * @param {{ limit?: number }} [options]
 * @returns {Promise<Array<{ timestamp: string, url: string, thumbnail: string, colorPalette: string[] }>>}
 */
export const listPinterestProfilePictures = async (db, { limit } = {}) => {
	const safeLimit = Number(limit) > 0 ? Math.min(1000, Number(limit)) : undefined;
	const rows = await db.pinterestProfilePicture.findMany({
		orderBy: { timestamp: 'desc' },
		select: { timestamp: true, url: true, thumbnail: true, colorPalette: true },
		...(safeLimit ? { take: safeLimit } : {})
	});

	return rows.reverse().map((row) => ({
		timestamp: String(row.timestamp),
		url: String(row.url),
		thumbnail: String(row.thumbnail || row.url),
		colorPalette: parseColorPalette(row.colorPalette)
	}));
};

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

function parseColorPalette(raw) {
	const value = String(raw || '').trim();

	if (!value) {
		return [];
	}

	if (value.startsWith('[')) {
		try {
			const parsed = JSON.parse(value);

			if (Array.isArray(parsed)) {
				return parsed.map((item) => String(item || '').toLowerCase()).filter((item) => HEX_PATTERN.test(item));
			}
		} catch {
			return [];
		}
	}

	if (HEX_PATTERN.test(value)) {
		return [value.toLowerCase()];
	}

	return [];
}

/**
 * @param {PrismaClient} db
 * @param {string} timestamp
 * @param {string[]} hexes
 * @returns {Promise<void>}
 */
export const setPinterestProfilePictureColorPalette = async (db, timestamp, hexes) => {
	const safeTimestamp = String(timestamp || '').trim();
	const safePalette = (Array.isArray(hexes) ? hexes : [])
		.map((hex) => String(hex || '').toLowerCase())
		.filter((hex) => HEX_PATTERN.test(hex));

	if (!safeTimestamp || !safePalette.length) {
		return;
	}

	const serialized = JSON.stringify(safePalette);

	await enqueueWrite(`pinterestProfilePicture:${safeTimestamp}`, async () => {
		if (disposed) {
			return;
		}

		await withRetry(() =>
			db.pinterestProfilePicture
				.update({
					where: { timestamp: safeTimestamp },
					data: { colorPalette: serialized }
				})
				.catch((error) => {
					if (error?.code === 'P2025') {
						return null;
					}

					throw error;
				})
		);
	});
};

/**
 * @param {PrismaClient} db
 * @param {string} timestamp
 * @returns {Promise<{ ok: boolean }>}
 */
export const deletePinterestProfilePicture = async (db, timestamp) => {
	const safeTimestamp = String(timestamp || '').trim();

	if (!safeTimestamp) {
		return { ok: false };
	}

	await withRetry(() =>
		db.pinterestProfilePicture.delete({ where: { timestamp: safeTimestamp } }).catch((error) => {
			if (error?.code === 'P2025') {
				return null;
			}

			throw error;
		})
	);

	return { ok: true };
};

/**
 * @param {PrismaClient} db
 * @param {string} url
 * @returns {Promise<{ ok: boolean, count: number }>}
 */
export const deletePinterestProfilePictureByUrl = async (db, url) => {
	const safeUrl = String(url || '').trim();

	if (!safeUrl) {
		return { ok: false, count: 0 };
	}

	const result = await withRetry(() => db.pinterestProfilePicture.deleteMany({ where: { url: safeUrl } }));

	return { ok: true, count: result?.count || 0 };
};

/**
 * @param {PrismaClient} db
 * @param {Array<{ timestamp: string, url: string, thumbnail: string }>} entries
 * @returns {Promise<void>}
 */
export const upsertPinterestProfilePictures = async (db, entries) => {
	const normalized = entries.map(normalizeEntry).filter(Boolean);

	await enqueueWrite('pinterestProfilePicture', async () => {
		if (!normalized.length) {
			return;
		}

		for (const entry of normalized) {
			if (disposed) {
				return;
			}

			await withRetry(() =>
				db.pinterestProfilePicture.upsert({
					where: { timestamp: entry.timestamp },
					update: { url: entry.url, thumbnail: entry.thumbnail || entry.url },
					create: { timestamp: entry.timestamp, url: entry.url, thumbnail: entry.thumbnail || entry.url }
				})
			);
		}
	});
};

/**
 * Stop in-progress bulk writes so the process can exit gracefully.
 */
export const shutdownPinterestProfilePictures = () => {
	disposed = true;
};
