/**
 * Simple object repository used by the Baileys in-memory store.
 *
 * @template T
 */
export class ObjectRepository {
	/** @type {Map<string, T>} */
	entityMap;

	/**
	 * @param {Record<string, T>} [entities]
	 */
	constructor(entities = {}) {
		this.entityMap = new Map(Object.entries(entities));
	}

	findById(id) {
		return this.entityMap.get(id);
	}

	findAll() {
		return Array.from(this.entityMap.values());
	}

	upsertById(id, entity) {
		return this.entityMap.set(id, { ...entity });
	}

	deleteById(id) {
		return this.entityMap.delete(id);
	}

	count() {
		return this.entityMap.size;
	}

	toJSON() {
		return this.findAll();
	}
}
