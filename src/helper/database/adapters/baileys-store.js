/**
 * Baileys in-memory store persistence adapter.
 *
 * @module database/adapters/baileys-store
 */

/** @typedef {import('@prisma/client').PrismaClient} PrismaClient */

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

const withRetry = async (operation, { retries = 3, baseDelayMs = 60 } = {}) => {
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

/**
 * Load the persisted store snapshot for a session.
 *
 * @param {PrismaClient} db
 * @param {string} sessionName
 * @returns {Promise<object|null>}
 */
export const getBaileysStore = async (db, sessionName) => {
	if (!sessionName) {
		return null;
	}

	const row = await db.baileysStore.findUnique({ where: { sessionName } });

	if (!row?.state) {
		return null;
	}

	try {
		return JSON.parse(row.state);
	} catch {
		return null;
	}
};

/**
 * Persist the store snapshot for a session.
 *
 * @param {PrismaClient} db
 * @param {string} sessionName
 * @param {object} state
 * @returns {Promise<void>}
 */
export const upsertBaileysStore = async (db, sessionName, state) => {
	if (!sessionName) {
		return;
	}

	const payload = JSON.stringify(state ?? {});

	await enqueueWrite(sessionName, () =>
		withRetry(() =>
			db.baileysStore.upsert({
				where: { sessionName },
				update: { state: payload },
				create: { sessionName, state: payload }
			})
		)
	);
};

/**
 * Delete the store snapshot for a session.
 *
 * @param {PrismaClient} db
 * @param {string} sessionName
 * @returns {Promise<void>}
 */
export const deleteBaileysStore = async (db, sessionName) => {
	if (!sessionName) {
		return;
	}

	await db.baileysStore.deleteMany({ where: { sessionName } });
};
