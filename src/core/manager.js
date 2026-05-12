/** @implements {import('../types/Core/index.d.ts').Manager} */
export class Manager {
	#clients = new Map();

	get clients() {
		return this.#clients;
	}

	/**
	 * @param {string} name
	 * @param {import('../types/Core/index.d.ts').ClientSocket} client
	 */
	add(name, client) {
		this.#clients.set(name, client);
	}

	/**
	 * @param {string} name
	 * @returns {import('../types/Core/index.d.ts').ClientSocket | null}
	 */
	get(name) {
		return this.#clients.get(name) ?? null;
	}

	/**
	 * @param {string} name
	 * @returns {boolean}
	 */
	has(name) {
		return this.#clients.has(name);
	}

	/** @param {string} name */
	remove(name) {
		this.#clients.delete(name);
	}

	/** @returns {Array<{ name: string; client: import('../types/Core/index.d.ts').ClientSocket }>} */
	list() {
		return [...this.#clients.entries()].map(([name, client]) => ({ name, client }));
	}

	/**
	 * @param {string} phone
	 * @returns {{ name: string; client: import('../types/Core/index.d.ts').ClientSocket } | null}
	 */
	findByPhone(phone) {
		for (const [name, client] of this.#clients) {
			if (client.phone === phone) {return { name, client };}
		}

		return null;
	}

	async connectAll() {
		for (const [, client] of this.#clients) {
			if (client.state === 'disconnected') {
				await client.connect().catch(() => {});
			}
		}
	}

	async disconnectAll() {
		for (const [, client] of this.#clients) {
			await client.disconnect().catch(() => {});
		}

		this.#clients.clear();
	}
}

export const manager = new Manager();
