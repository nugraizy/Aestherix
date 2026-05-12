import { makePersistentStore } from '../helper/connection/store/make-in-memory-store.js';

export class Store {
	#inner = null;
	#sessionName;
	#prisma;
	#options;

	constructor(prisma, sessionName, options = {}) {
		this.#prisma = prisma;
		this.#sessionName = sessionName;
		this.#options = options;
	}

	get sessionName() {
		return this.#sessionName;
	}

	get inner() {
		return this.#inner;
	}

	get hydration() {
		return this.#inner?.hydration ?? Promise.resolve();
	}

	async initialize(socketConfig = {}) {
		this.#inner = await makePersistentStore({
			sessionName: this.#sessionName,
			prisma: this.#prisma,
			resetOnStart: this.#options.resetOnStart ?? false,
			persistIntervalMs: this.#options.persistIntervalMs,
			logger: this.#options.logger,
			socket: socketConfig.socket
		});

		return this;
	}

	bind(ev) {
		if (!this.#inner) throw new Error('Store: not initialized');
		this.#inner.bind(ev);
	}

	async loadMessage(jid, id) {
		return this.#inner?.loadMessage(jid, id);
	}

	async loadMessages(jid, count, cursor) {
		return this.#inner?.loadMessages(jid, count, cursor);
	}

	async fetchGroupMetadata(jid, sock) {
		return this.#inner?.fetchGroupMetadata(jid, sock);
	}

	async fetchImageUrl(jid, sock) {
		return this.#inner?.fetchImageUrl(jid, sock);
	}

	get chats() {
		return this.#inner?.chats;
	}

	get contacts() {
		return this.#inner?.contacts;
	}

	get messages() {
		return this.#inner?.messages;
	}

	get groupMetadata() {
		return this.#inner?.groupMetadata;
	}

	get labels() {
		return this.#inner?.labels;
	}

	toJSON() {
		return this.#inner?.toJSON();
	}
}
