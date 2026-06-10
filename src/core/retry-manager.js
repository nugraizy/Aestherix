import { randomUUID } from 'node:crypto';
import fs from 'fs-extra';

const MEDIA_TTL = 3 * 60 * 1000;
const DISABLE_DURATION = 10 * 60 * 1000;
const MAX_RETRIES = 3;
const PERSIST_PATH = './databases/retry_state.json';

export class RetryManager {
	/** @type {Map<string, {buffer: Buffer, typeQuoted: string, mediaType: string, ts: number}>} */
	#mediaCache = new Map();

	/** @type {Map<string, {count: number, disabledUntil: number|null}>} key = "sender:cmd" */
	#retryCounters = new Map();

	/** @type {Map<string, number>} key = cmdName, value = disabledUntil timestamp */
	#disabledCommands = new Map();

	get maxRetries() {
		return MAX_RETRIES;
	}

	get disableDuration() {
		return DISABLE_DURATION;
	}

	generateId() {
		return randomUUID().slice(0, 8);
	}

	cacheMedia(id, { buffer, typeQuoted, mediaType }) {
		this.#mediaCache.set(id, { buffer, typeQuoted, mediaType, ts: Date.now() });
		this.#evictExpired();
	}

	getMedia(id) {
		const entry = this.#mediaCache.get(id);

		if (!entry) {
			return null;
		}

		if (Date.now() - entry.ts > MEDIA_TTL) {
			this.#mediaCache.delete(id);
			return null;
		}

		return entry;
	}

	recordFailure(sender, cmd) {
		const key = `${sender}:${cmd}`;
		const entry = this.#retryCounters.get(key) || { count: 0, disabledUntil: null };

		entry.count++;

		if (entry.count >= MAX_RETRIES) {
			entry.disabledUntil = Date.now() + DISABLE_DURATION;
			this.#disabledCommands.set(cmd, entry.disabledUntil);
		}

		this.#retryCounters.set(key, entry);

		this.persist();

		return { count: entry.count, disabled: entry.count >= MAX_RETRIES };
	}

	clearCounter(sender, cmd) {
		const key = `${sender}:${cmd}`;

		this.#retryCounters.delete(key);

		this.persist();
	}

	getFailureCount(sender, cmd) {
		const key = `${sender}:${cmd}`;

		return this.#retryCounters.get(key)?.count || 0;
	}

	isDisabled(cmd) {
		const until = this.#disabledCommands.get(cmd);

		if (!until) {
			return false;
		}

		if (Date.now() > until) {
			this.#disabledCommands.delete(cmd);
			this.persist();
			return false;
		}

		return true;
	}

	getDisableRemaining(cmd) {
		const until = this.#disabledCommands.get(cmd);

		if (!until || Date.now() > until) {
			return 0;
		}

		return Math.ceil((until - Date.now()) / 60000);
	}

	reEnable(cmd) {
		this.#disabledCommands.delete(cmd);

		for (const [key, entry] of this.#retryCounters) {
			if (key.endsWith(`:${cmd}`)) {
				entry.count = 0;
				entry.disabledUntil = null;
			}
		}

		this.persist();
	}

	#evictExpired() {
		const now = Date.now();

		for (const [id, entry] of this.#mediaCache) {
			if (now - entry.ts > MEDIA_TTL) {
				this.#mediaCache.delete(id);
			}
		}
	}

	async persist() {
		try {
			const data = {
				retryCounters: Object.fromEntries(this.#retryCounters),
				disabledCommands: Object.fromEntries(this.#disabledCommands)
			};

			await fs.writeJSON(PERSIST_PATH, data, { spaces: 2 });
		} catch { /* persist failure is non-critical */ }
	}

	async load() {
		try {
			if (!(await fs.pathExists(PERSIST_PATH))) {
				return;
			}

			const data = await fs.readJSON(PERSIST_PATH);
			const now = Date.now();

			if (data.retryCounters) {
				for (const [key, entry] of Object.entries(data.retryCounters)) {
					if (entry.disabledUntil && now > entry.disabledUntil) {
						continue;
					}

					this.#retryCounters.set(key, entry);
				}
			}

			if (data.disabledCommands) {
				for (const [cmd, until] of Object.entries(data.disabledCommands)) {
					if (now > until) {
						continue;
					}

					this.#disabledCommands.set(cmd, until);
				}
			}
		} catch { /* load failure is non-critical */ }
	}
}
