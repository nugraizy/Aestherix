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

		return entry && Date.now() - entry._fetchedAt < this.#ttl;
	}

	get(groupId) {
		return this.#metadata.get(groupId) || {};
	}

	async ensure(client, from, { forceRefresh = true } = {}) {
		const cached = this.#metadata.get(from);

		if (cached && Date.now() - cached._fetchedAt < this.#ttl) {
			return cached;
		}

		if (cached && !forceRefresh) {
			this.#fetch(client, from).catch(() => {});
			return cached;
		}

		return this.#fetch(client, from);
	}

	async #fetch(client, groupId) {
		const raw = await client.groupMetadata(groupId).catch(() => ({}));
		const participants = raw.participants || [];

		const entry = {
			...raw,
			adminGroups: participants.filter((v) => v.admin !== null).map((v) => v.id),
			participantsGroup: participants.map((v) => v.id),
			ownerPn: raw.ownerPn || null,
			_fetchedAt: Date.now()
		};

		this.#metadata.set(groupId, entry);

		return entry;
	}

	populate(metaMap) {
		if (!metaMap || typeof metaMap !== 'object') {
			return 0;
		}

		const now = Date.now();
		let count = 0;

		for (const [groupId, raw] of Object.entries(metaMap)) {
			if (!groupId || !raw) {
				continue;
			}

			const participants = raw.participants || [];

			this.#metadata.set(groupId, {
				...raw,
				adminGroups: participants.filter((v) => v.admin !== null).map((v) => v.id),
				participantsGroup: participants.map((v) => v.id),
				ownerPn: raw.ownerPn || null,
				_fetchedAt: now
			});

			count++;
		}

		return count;
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
