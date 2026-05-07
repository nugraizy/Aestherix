/**
 * Prisma-backed Baileys auth state.
 *
 * Ported from https://github.com/TobyG74/ChisatoBOT/blob/master/src/auth/auth.ts
 * to ESM JavaScript so it works without a TypeScript build step.
 *
 * Two variants are exported:
 *
 *  • useMultiAuthState   – stores each signal key in its own row (recommended).
 *  • useSingleAuthState  – stores creds + all keys in a single row (simpler
 *                          schema usage, slightly lower consistency guarantees).
 *
 * Both return the same { state, saveCreds, clearState } shape.
 *
 * @module database/auth
 */

/** @typedef {import('@prisma/client').PrismaClient} PrismaClient */

let _baileys = null;

async function getBaileys() {
	if (!_baileys) {
		const dynamicImport = new Function('s', 'return import(s)');

		_baileys = await dynamicImport('baileys');
	}

	return _baileys;
}

/**
 * Sanitise a file name so it can be used as a DB `sessionId`.
 * Mirrors the `fixFileName` helper in the reference implementation.
 *
 * @param {string} fileName
 * @returns {string}
 */
const fixFileName = (fileName) => fileName.replace(/\//g, '__').replace(/:/g, '-');

const buildSessionId = (sessionName, fileName) => {
	const name = String(sessionName || '').trim();

	if (!name) {
		return fixFileName(fileName);
	}

	return fixFileName(`${name}:${fileName}`);
};

/**
 * Retry an async operation with exponential back-off when MongoDB reports a
 * write conflict or deadlock (error code 112 / P2034).
 *
 * @template T
 * @param {() => Promise<T>} fn
 * @param {number} [maxRetries=5]
 * @returns {Promise<T>}
 */
const withRetry = async (fn, maxRetries = 5) => {
	for (let attempt = 0; attempt < maxRetries; attempt++) {
		try {
			return await fn();
		} catch (err) {
			const isConflict =
				err?.code === 'P2034' ||
				(typeof err?.message === 'string' && (err.message.includes('write conflict') || err.message.includes('deadlock')));

			if (!isConflict || attempt === maxRetries - 1) {
				throw err;
			}

			await new Promise((r) => setTimeout(r, 50 * 2 ** attempt));
		}
	}
};

/**
 * Prisma-backed multi-key auth state.
 *
 * Each Baileys signal key / credential value is stored in its own `Session`
 * row, identified by a sanitised `sessionId`.
 *
 * @param {PrismaClient} db
 * @returns {Promise<{
 *   state:      import('baileys').AuthenticationState,
 *   saveCreds:  () => Promise<void>,
 *   clearState: () => Promise<void>
 * }>}
 */
export const useMultiAuthState = async (db, sessionName = '') => {
	const { BufferJSON, initAuthCreds, proto } = await getBaileys();

	const writeData = async (data, fileName) => {
		try {
			const sessionId = buildSessionId(sessionName, fileName);
			const session = JSON.stringify(data, BufferJSON.replacer);

			await withRetry(() =>
				db.session.upsert({
					where: { sessionId },
					update: { session },
					create: { sessionId, session }
				})
			);
		} catch {
			//
		}
	};

	const readData = async (fileName) => {
		try {
			const sessionId = buildSessionId(sessionName, fileName);
			const row = await db.session.findFirst({ where: { sessionId } });

			return row?.session ? JSON.parse(row.session, BufferJSON.reviver) : null;
		} catch {
			return null;
		}
	};

	const removeData = async (fileName) => {
		try {
			const sessionId = buildSessionId(sessionName, fileName);

			await db.session.deleteMany({ where: { sessionId } });
		} catch {
			//
		}
	};

	const creds = (await readData('creds')) || initAuthCreds();

	return {
		state: {
			creds,
			keys: {
				get: async (type, ids) => {
					/** @type {Record<string, unknown>} */
					const data = {};

					await Promise.all(
						ids.map(async (id) => {
							let value = await readData(`${type}-${id}`);

							if (type === 'app-state-sync-key' && value) {
								value = proto.Message.AppStateSyncKeyData.fromObject(value);
							}

							data[id] = value;
						})
					);

					return data;
				},

				set: async (data) => {
					for (const category in data) {
						for (const id in data[category]) {
							const value = data[category][id];
							const file = `${category}-${id}`;

							try {
								await (value ? writeData(value, file) : removeData(file));
							} catch {
								//
							}
						}
					}
				}
			}
		},

		saveCreds: async () => {
			try {
				await writeData(creds, 'creds');
			} catch {
				//
			}
		},

		clearState: async () => {
			try {
				await db.session.deleteMany({});
			} catch {
				//
			}
		}
	};
};

/**
 * In-memory single-row auth state backed by Prisma.
 *
 * All signal keys and credentials are held in memory and flushed to a single
 * `Session` row on every `saveCreds` call.  This is simpler but puts the
 * entire state payload in one database record.
 *
 * @param {PrismaClient} db
 * @returns {Promise<{
 *   state:      import('baileys').AuthenticationState,
 *   saveCreds:  () => Promise<void>,
 *   clearState: () => Promise<void>
 * }>}
 */
export const useSingleAuthState = async (db, sessionName = '') => {
	const { BufferJSON, initAuthCreds, proto } = await getBaileys();

	/** @type {Record<string, string>} Maps Baileys key types to storage keys. */
	const KEY_MAP = {
		'identity-key': 'identityKeys',
		'pre-key': 'preKeys',
		session: 'sessions',
		'sender-key': 'senderKeys',
		'app-state-sync-key': 'appStateSyncKeys',
		'app-state-sync-version': 'appStateVersions',
		'sender-key-memory': 'senderKeyMemory',
		'device-list': 'deviceLists',
		'lid-mapping': 'lidMappings',
		tctoken: 'tcTokens'
	};

	const SESSION_ID = buildSessionId(sessionName, 'creds');

	let creds;
	let keys = {};

	const storedRow = await db.session.findFirst({ where: { sessionId: SESSION_ID } });

	if (storedRow?.session) {
		const parsed = JSON.parse(storedRow.session, BufferJSON.reviver);

		creds = parsed.creds;
		keys = parsed.keys ?? {};
	} else {
		if (!storedRow) {
			await db.session.create({ data: { sessionId: SESSION_ID } });
		}

		creds = initAuthCreds();
	}

	const saveCreds = async () => {
		try {
			const session = JSON.stringify({ creds, keys }, BufferJSON.replacer);

			await db.session.update({
				where: { sessionId: SESSION_ID },
				data: { session }
			});
		} catch {
			//
		}
	};

	return {
		state: {
			creds,
			keys: {
				get: (type, ids) => {
					const storageKey = KEY_MAP[type];

					return ids.reduce((dict, id) => {
						const value = keys[storageKey]?.[id];

						if (value) {
							if (type === 'app-state-sync-key') {
								dict[id] = proto.Message.AppStateSyncKeyData.fromObject(value);
							} else {
								dict[id] = value;
							}
						}

						return dict;
					}, {});
				},

				set: async (data) => {
					for (const _key in data) {
						const storageKey = KEY_MAP[_key];

						keys[storageKey] = keys[storageKey] || {};
						Object.assign(keys[storageKey], data[_key]);
					}

					try {
						await saveCreds();
					} catch {
						//
					}
				}
			}
		},

		saveCreds,

		clearState: async () => {
			try {
				await db.session.deleteMany({ where: { sessionId: SESSION_ID } });
			} catch {
				//
			}
		}
	};
};
