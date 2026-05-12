/**
 * Context — per-message object passed to command handlers.
 *
 * In Phase 1 this is a thin wrapper that accepts the existing reassign()
 * result and adds convenience methods. In Phase 2+ the constructor will
 * compute all properties directly from the raw Baileys message.
 */

export class Context {
	#client;
	#store;

	constructor({ data, client, store }) {
		this.#client = client;
		this.#store = store;

		Object.assign(this, data);
	}

	get client() {
		return this.#client;
	}

	get store() {
		return this.#store;
	}

	async reply(text) {
		return this.#client.send(this.from, { text }, { quoted: this.message });
	}

	async react(emoji) {
		return this.#client.send(this.from, {
			react: { text: emoji, key: this.message.key }
		});
	}

	async send(content, options = {}) {
		return this.#client.send(this.from, content, { quoted: this.message, ...options });
	}

	async sendTo(jid, content, options = {}) {
		return this.#client.send(jid, content, options);
	}

	async delete() {
		return this.#client.send(this.from, { delete: this.message.key });
	}
}
