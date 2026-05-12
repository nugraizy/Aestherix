export class Manager {
	#clients = new Map();

	get clients() {
		return this.#clients;
	}

	add(name, client) {
		this.#clients.set(name, client);
	}

	get(name) {
		return this.#clients.get(name) ?? null;
	}

	has(name) {
		return this.#clients.has(name);
	}

	remove(name) {
		this.#clients.delete(name);
	}

	list() {
		return [...this.#clients.entries()].map(([name, client]) => ({ name, client }));
	}

	findByPhone(phone) {
		for (const [name, client] of this.#clients) {
			if (client.phone === phone) return { name, client };
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
