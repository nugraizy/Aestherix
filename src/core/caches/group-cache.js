import { Cache } from '../../helper/modules/cache.js';

const DEFAULT_TTL = 300_000;

export class GroupCache {
	#metadata = new Cache();
	#settings = new Cache();
	#ttl;

	constructor(options = {}) {
		this.#ttl = options.ttl ?? DEFAULT_TTL;
	}

	get metadata() {
		return this.#metadata;
	}

	get settings() {
		return this.#settings;
	}

	has(groupId) {
		const entry = this.#metadata.get(groupId);

		return entry && (Date.now() - entry._fetchedAt < this.#ttl);
	}

	get(groupId) {
		return this.#metadata.get(groupId) || {};
	}

	async ensure(client, groupId) {
		const cached = this.#metadata.get(groupId);

		if (cached && Date.now() - cached._fetchedAt < this.#ttl) {
			return cached;
		}

		return this.#fetch(client, groupId);
	}

	async #fetch(client, groupId) {
		const raw = await client.groupMetadata(groupId).catch(() => ({}));
		const participants = raw.participants || [];

		const entry = {
			...raw,
			adminGroups: participants.filter((v) => v.admin !== null).map((v) => v.phoneNumber),
			participantsGroup: participants.map((v) => v.phoneNumber),
			ownerPn: raw.ownerPn || null,
			_fetchedAt: Date.now()
		};

		this.#metadata.set(groupId, entry);

		return entry;
	}

	invalidate(groupId) {
		this.#metadata.delete(groupId);
	}

	update(groupId, patch) {
		const existing = this.#metadata.get(groupId);

		if (existing) {
			Object.assign(existing, patch, { _fetchedAt: Date.now() });
		}
	}

	clear() {
		this.#metadata.clear();
		this.#settings.clear();
	}
}
