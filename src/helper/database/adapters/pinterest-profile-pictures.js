/**
 * Pinterest profile picture history adapter.
 *
 * @module database/adapters/pinterest-profile-pictures
 */

/** @typedef {import('@prisma/client').PrismaClient} PrismaClient */

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
 * @returns {Promise<Array<{ timestamp: string, url: string, thumbnail: string }>>}
 */
export const listPinterestProfilePictures = async (db, { limit } = {}) => {
	const safeLimit = Number(limit) > 0 ? Math.min(1000, Number(limit)) : undefined;
	const rows = await db.pinterestProfilePicture.findMany({
		orderBy: { timestamp: 'asc' },
		...(safeLimit ? { take: safeLimit } : {})
	});

	return rows.map((row) => ({
		timestamp: String(row.timestamp),
		url: String(row.url),
		thumbnail: String(row.thumbnail || row.url)
	}));
};

/**
 * @param {PrismaClient} db
 * @param {Array<{ timestamp: string, url: string, thumbnail: string }>} entries
 * @returns {Promise<void>}
 */
export const upsertPinterestProfilePictures = async (db, entries) => {
	const normalized = entries.map(normalizeEntry).filter(Boolean);

	if (!normalized.length) {
		await db.pinterestProfilePicture.deleteMany({});
		return;
	}

	const timestamps = normalized.map((entry) => entry.timestamp);

	await db.$transaction([
		db.pinterestProfilePicture.deleteMany({
			where: { timestamp: { notIn: timestamps } }
		}),
		...normalized.map((entry) =>
			db.pinterestProfilePicture.upsert({
				where: { timestamp: entry.timestamp },
				update: { url: entry.url, thumbnail: entry.thumbnail || entry.url },
				create: { timestamp: entry.timestamp, url: entry.url, thumbnail: entry.thumbnail || entry.url }
			})
		)
	]);
};
