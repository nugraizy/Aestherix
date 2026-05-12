import { EventEmitter } from 'node:events';
import { fetchLatestBaileysVersion, isJidGroup, makeWASocket } from 'baileys';
import NodeCache from 'node-cache';
import P from 'pino';

import { Auth } from './auth.js';
import { Store } from './store.js';
import { Cache } from '../helper/modules/cache.js';

export class ClientSocket extends EventEmitter {
	#auth;
	#store;
	#socket = null;
	#options;
	#state = 'disconnected';
	#startedAt = null;

	constructor(auth, options = {}) {
		super();

		if (!(auth instanceof Auth)) throw new TypeError('ClientSocket: auth must be an Auth instance');

		this.#auth = auth;
		this.#options = {
			role: 'primary',
			flags: {},
			logger: P({ level: 'fatal' }),
			browser: ['Mac OS', 'Chrome', 'Chrome 114.0.5735.198'],
			...options
		};
		this.#store = null;
	}

	get auth() {
		return this.#auth;
	}

	get sessionName() {
		return this.#auth.sessionName;
	}

	get store() {
		return this.#store;
	}

	get socket() {
		return this.#socket;
	}

	get state() {
		return this.#state;
	}

	get role() {
		return this.#options.role;
	}

	get options() {
		return this.#options;
	}

	get phone() {
		return this.#socket?.user?.id?.split(':')[0] ?? null;
	}

	get uptime() {
		if (!this.#startedAt) return null;

		const ms = Date.now() - this.#startedAt;
		const minutes = Math.floor(ms / 60000);

		if (minutes < 60) return `${minutes}m`;

		const hours = Math.floor(minutes / 60);
		const remainingMinutes = minutes % 60;

		return `${hours}h ${remainingMinutes}m`;
	}

	async connect(prisma) {
		if (this.#state === 'connected') return this;

		this.#state = 'connecting';

		await this.#auth.initialize({ logger: this.#options.logger });

		if (prisma) {
			this.#store = new Store(prisma, this.sessionName, {
				logger: this.#options.logger,
				resetOnStart: this.#options.flags.resetOnStart
			});
			await this.#store.initialize();
		}

		const { version } = await fetchLatestBaileysVersion();

		this.#socket = makeWASocket({
			auth: this.#auth.state,
			logger: this.#options.logger,
			version,
			browser: this.#options.browser,
			printQRInTerminal: !this.#options.flags.pairMode,
			msgRetryCounterCache: new NodeCache(),
			markOnlineOnConnect: true,
			generateHighQualityLinkPreview: true,
			defaultQueryTimeoutMs: 0,
			mediaCache: new Cache(),
			userDevicesCache: new Cache(),
			cachedGroupMetadata: (jid) => isJidGroup(jid) ? this.#store?.groupMetadata?.[jid] : {},
			emitOwnEvents: true,
			getMessage: async (key) => {
				const msg = await this.#store?.loadMessage(key.remoteJid, key.id);
				return msg?.message || undefined;
			}
		});

		if (this.#store) {
			this.#store.bind(this.#socket.ev);
		}

		this.#bindEvents();
		this.#startedAt = Date.now();

		return this;
	}

	async disconnect() {
		if (this.#socket) {
			this.#socket.end(undefined);
		}

		this.#state = 'disconnected';
		this.#startedAt = null;
		this.removeAllListeners();
	}

	async send(jid, message, options = {}) {
		if (!this.#socket) throw new Error('ClientSocket: not connected');

		return this.#socket.sendMessage(jid, message, {
			...options,
			...(isJidGroup(jid) && { useCachedGroupMetadata: true })
		});
	}

	async reply(jid, text, quoted) {
		return this.send(jid, { text }, { quoted });
	}

	async relay(jid, message, options = {}) {
		if (!this.#socket) throw new Error('ClientSocket: not connected');

		return this.#socket.relayMessage(jid, message, options);
	}

	async requestPairingCode(phoneNumber, clientId = 'AESTHERX') {
		if (!this.#socket) throw new Error('ClientSocket: not connected');

		return this.#socket.requestPairingCode(phoneNumber, clientId);
	}

	get ev() {
		return this;
	}

	#bindEvents() {
		const forwardEvents = [
			'connection.update',
			'creds.update',
			'messages.upsert',
			'messages.update',
			'messages.delete',
			'message-receipt.update',
			'messages.reaction',
			'presence.update',
			'contacts.upsert',
			'contacts.update',
			'groups.upsert',
			'groups.update',
			'group-participants.update',
			'call',
			'labels.edit',
			'labels.association',
			'poll.update'
		];

		for (const event of forwardEvents) {
			this.#socket.ev.on(event, (data) => {
				this.emit(event, data);
			});
		}

		this.#socket.ev.on('connection.update', (update) => {
			if (update.connection === 'open') {
				this.#state = 'connected';
			} else if (update.connection === 'close') {
				this.#state = 'disconnected';
			}

			if (update.qr) {
				this.emit('qr', update.qr);
			}
		});

		this.#socket.ev.on('creds.update', () => {
			this.#auth.saveCreds().catch(() => {});
		});
	}
}
