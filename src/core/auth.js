import { makeCacheableSignalKeyStore } from 'baileys';
import P from 'pino';

import { useMultiAuthState, useSingleAuthState } from './auth-state.js';

export class Auth {
	#prisma;
	#sessionName;
	#mode;
	#state = null;
	#saveCreds = null;
	#clearState = null;
	#initialized = false;

	constructor(prisma, sessionName, options = {}) {
		if (!prisma) {
			throw new TypeError('Auth: prisma is required');
		}

		if (!sessionName) {
			throw new TypeError('Auth: sessionName is required');
		}

		this.#prisma = prisma;
		this.#sessionName = sessionName;
		this.#mode = options.mode ?? 'multi';
	}

	get sessionName() {
		return this.#sessionName;
	}

	get initialized() {
		return this.#initialized;
	}

	get state() {
		if (!this.#initialized) {
			throw new Error('Auth: not initialized. Call initialize() first.');
		}

		return this.#state;
	}

	get creds() {
		return this.state.creds;
	}

	async initialize(options = {}) {
		if (this.#initialized) {
			return this;
		}

		const authFn = this.#mode === 'single' ? useSingleAuthState : useMultiAuthState;
		const result = await authFn(this.#prisma, this.#sessionName);

		this.#state = result.state;
		this.#saveCreds = result.saveCreds;
		this.#clearState = result.clearState;

		if (options.cacheKeys !== false) {
			const logger = options.logger ?? P({ level: 'fatal' });

			this.#state = {
				creds: this.#state.creds,
				keys: makeCacheableSignalKeyStore(this.#state.keys, logger)
			};
		}

		this.#initialized = true;
		return this;
	}

	async saveCreds() {
		if (!this.#saveCreds) {
			throw new Error('Auth: not initialized');
		}

		return this.#saveCreds();
	}

	async clearState() {
		if (!this.#clearState) {
			throw new Error('Auth: not initialized');
		}

		await this.#clearState();
		this.#initialized = false;
		this.#state = null;
	}
}
