// @ts-check
import { DEFAULT_CONNECTION_CONFIG, jidDecode, jidNormalizedUser, proto } from 'baileys';
import { md5, toNumber, updateMessageWithReaction, updateMessageWithReceipt } from 'baileys/lib/Utils/index.js';
import { createRequire } from 'module';

import { getBaileysStore, upsertBaileysStore } from '../helper/database/adapters/baileys-store.js';

const require = createRequire(import.meta.url);
const KeyedDB = require('@adiwajshing/keyed-db').default;

const DEFAULT_PERSIST_INTERVAL_MS = 3000;

const waChatKey = (pin) => ({
	key: (c) =>
		(pin ? (c.pinned ? '1' : '0') : '') +
		(c.archived ? '0' : '1') +
		(c.conversationTimestamp ? c.conversationTimestamp.toString(16).padStart(8, '0') : '') +
		c.id,
	compare: (k1, k2) => k2.localeCompare(k1)
});

const waLabelAssociationKey = {
	key: (la) => (la.type === 'label_jid' ? la.chatId + la.labelId : la.chatId + la.messageId + la.labelId),
	compare: (k1, k2) => k2.localeCompare(k1)
};

class ObjectRepository {
	#map;

	constructor(entities = {}) {
		this.#map = new Map(Object.entries(entities));
	}

	findById(id) {
		return this.#map.get(id);
	}

	findAll() {
		return Array.from(this.#map.values());
	}

	upsertById(id, entity) {
		return this.#map.set(id, { ...entity });
	}

	deleteById(id) {
		return this.#map.delete(id);
	}

	count() {
		return this.#map.size;
	}

	toJSON() {
		return this.findAll();
	}
}

function makeOrderedDictionary(idGetter) {
	const array = [];
	const dict = {};

	const get = (id) => dict[id];

	const update = (item) => {
		const id = idGetter(item);
		const idx = array.findIndex((i) => idGetter(i) === id);

		if (idx >= 0) {
			array[idx] = item;
			dict[id] = item;
		}

		return false;
	};

	const upsert = (item, mode) => {
		const id = idGetter(item);

		if (get(id)) {
			update(item);
			return;
		}

		if (mode === 'append') {
			array.push(item);
		} else {
			array.splice(0, 0, item);
		}

		dict[id] = item;
	};

	const remove = (item) => {
		const id = idGetter(item);
		const idx = array.findIndex((i) => idGetter(i) === id);

		if (idx >= 0) {
			array.splice(idx, 1);
			delete dict[id];
			return true;
		}

		return false;
	};

	return {
		array,
		get,
		upsert,
		update,
		remove,
		updateAssign: (id, updateValue) => {
			if (updateValue?.messageStubType === 1 && !updateValue?.message) {
				return;
			}

			const item = get(id);

			if (item) {
				Object.assign(item, updateValue);
				delete dict[id];
				dict[idGetter(item)] = item;
				return true;
			}

			return false;
		},
		clear: () => {
			array.splice(0, array.length);

			for (const key of Object.keys(dict)) {
				delete dict[key];
			}
		},
		filter: (contain) => {
			let i = 0;

			while (i < array.length) {
				if (!contain(array[i])) {
					delete dict[idGetter(array[i])];
					array.splice(i, 1);
				} else {
					i += 1;
				}
			}
		},
		toJSON: () => array,
		fromJSON: (newItems) => {
			array.splice(0, array.length, ...newItems);
		}
	};
}

export class Store {
	#prisma;
	#sessionName;
	#logger;
	#persistIntervalMs;
	#flushTimer = null;
	#flushInProgress = false;
	#pendingFlush = false;
	#hydrated = false;
	#hydrationResolve;
	#hydration;

	chats;
	messages = {};
	contacts = {};
	groupMetadata = {};
	presences = {};
	labels;
	labelAssociations;
	state = { connection: 'close' };
	localContacts = {};

	constructor(prisma, sessionName, options = {}) {
		this.#prisma = prisma;
		this.#sessionName = sessionName;
		this.#logger = options.logger || DEFAULT_CONNECTION_CONFIG.logger.child({ stream: 'store' });
		this.#persistIntervalMs = options.persistIntervalMs || DEFAULT_PERSIST_INTERVAL_MS;

		const chatKey = waChatKey(true);

		this.chats = new KeyedDB(chatKey, (c) => c.id);
		this.labels = new ObjectRepository();
		this.labelAssociations = new KeyedDB(waLabelAssociationKey, waLabelAssociationKey.key);

		this.#hydration = new Promise((resolve) => {
			this.#hydrationResolve = resolve;
		});
	}

	get sessionName() {
		return this.#sessionName;
	}

	get hydration() {
		return this.#hydration;
	}

	get isHydrated() {
		return this.#hydrated;
	}

	async initialize() {
		if (!this.#sessionName || !this.#prisma) {
			this.#hydrated = true;
			this.#hydrationResolve();
			return this;
		}

		try {
			const snapshot = await getBaileysStore(this.#prisma, this.#sessionName);

			if (snapshot) {
				this.#fromJSON(snapshot);
			}
		} catch (error) {
			this.#warn('Failed loading store snapshot:', error);
		} finally {
			this.#hydrated = true;
			this.#hydrationResolve();
		}

		this.#registerShutdownHooks();

		return this;
	}

	bind(ev) {
		ev.on('connection.update', (update) => {
			Object.assign(this.state, update);

			if (update.connection === 'close') {
				this.flush(true);
			}
		});

		ev.on('messaging-history.set', ({ chats: newChats, contacts: newContacts, messages: newMessages, isLatest, syncType }) => {
			if (syncType === proto.HistorySync.HistorySyncType.ON_DEMAND) {
				return;
			}

			if (isLatest) {
				this.chats.clear();

				for (const id in this.messages) {
					delete this.messages[id];
				}
			}

			this.chats.insertIfAbsent(...newChats);
			const oldContacts = this.#contactsUpsert(newContacts);

			if (isLatest) {
				for (const jid of oldContacts) {
					delete this.contacts[jid];
				}
			}

			for (const msg of newMessages) {
				this.#assertMessageList(msg.key.remoteJid).upsert(msg, 'prepend');
			}

			this.#scheduleFlush();
		});

		ev.on('contacts.upsert', (batch) => {
			this.#contactsUpsert(batch);
			this.#scheduleFlush();
		});

		ev.on('contacts.update', async (updates) => {
			for (const update of updates) {
				let contact = this.contacts[update.id];

				if (!contact) {
					const hashes = await Promise.all(
						Object.keys(this.contacts).map(async (id) => {
							const { user } = jidDecode(id);

							// baileys's md5 is typed as `() => ...` upstream but accepts a Buffer at runtime.
							// @ts-expect-error -- upstream type missing the Buffer parameter
							return [id, (await md5(Buffer.from(user + 'WA_ADD_NOTIF', 'utf8'))).toString('base64').slice(0, 3)];
						})
					);

					contact = this.contacts[hashes.find(([, b]) => b === update.id)?.[0] || ''];
				}

				if (!contact) {
					continue;
				}

				Object.assign(this.contacts[contact.id], contact);
			}

			this.#scheduleFlush();
		});

		ev.on('chats.upsert', (newChats) => {
			this.chats.upsert(...newChats);
			this.#scheduleFlush();
		});

		ev.on('chats.update', (updates) => {
			for (let update of updates) {
				this.chats.update(update.id, (chat) => {
					if (update.unreadCount > 0) {
						update = { ...update };
						update.unreadCount = (chat.unreadCount || 0) + update.unreadCount;
					}

					Object.assign(chat, update);
				});
			}

			this.#scheduleFlush();
		});

		ev.on('chats.delete', (deletions) => {
			for (const item of deletions) {
				if (this.chats.get(item)) {
					this.chats.deleteById(item);
				}
			}

			this.#scheduleFlush();
		});

		ev.on('labels.edit', (label) => {
			if (label.deleted) {
				this.labels.deleteById(label.id);
			} else if (this.labels.count() < 20) {
				this.labels.upsertById(label.id, label);
			}

			this.#scheduleFlush();
		});

		ev.on('labels.association', ({ type, association }) => {
			if (type === 'add') {
				this.labelAssociations.upsert(association);
			} else if (type === 'remove') {
				this.labelAssociations.delete(association);
			}

			this.#scheduleFlush();
		});

		ev.on('presence.update', ({ id, presences: update }) => {
			this.presences[id] = this.presences[id] || {};
			Object.assign(this.presences[id], update);
		});

		ev.on('messages.upsert', ({ messages: newMessages, type }) => {
			if (type !== 'append' && type !== 'notify') {
				return;
			}

			for (const msg of newMessages) {
				const jid = jidNormalizedUser(msg.key.remoteJid);

				this.#assertMessageList(jid).upsert(msg, 'append');

				if (type === 'notify' && !this.chats.get(jid)) {
					ev.emit('chats.upsert', [{ id: jid, conversationTimestamp: toNumber(msg.messageTimestamp), unreadCount: 1 }]);
				}
			}

			this.#scheduleFlush();
		});

		ev.on('messages.update', (updates) => {
			for (const { update, key } of updates) {
				const list = this.#assertMessageList(jidNormalizedUser(key.remoteJid));
				const existing = list.get(key.id);

				if (update?.status && existing?.status && update.status <= existing.status) {
					delete update.status;
				}

				list.updateAssign(key.id, update);
			}

			this.#scheduleFlush();
		});

		ev.on('messages.delete', (item) => {
			if ('all' in item) {
				this.messages[item.jid]?.clear();
				this.#scheduleFlush();
				return;
			}

			const jid = item.keys[0].remoteJid;
			const list = this.messages[jid];

			if (list) {
				const idSet = new Set(item.keys.map((k) => k.id));

				list.filter((m) => !idSet.has(m.key.id));
				this.#scheduleFlush();
			}
		});

		ev.on('groups.update', (updates) => {
			for (const update of updates) {
				if (this.groupMetadata[update.id]) {
					Object.assign(this.groupMetadata[update.id], update);
				}
			}
		});

		ev.on('group-participants.update', ({ id, participants, action }) => {
			const metadata = this.groupMetadata[id];

			if (!metadata) {
				return;
			}

			if (action === 'add') {
				metadata.participants.push(...participants.map((p) => ({ id: p, isAdmin: false, isSuperAdmin: false })));
			} else if (action === 'remove') {
				metadata.participants = metadata.participants.filter((p) => !participants.includes(p.id));
			} else {
				for (const p of metadata.participants) {
					if (participants.includes(p.id)) {
						p.isAdmin = action === 'promote';
					}
				}
			}
		});

		ev.on('message-receipt.update', (updates) => {
			for (const { key, receipt } of updates) {
				const msg = this.messages[key.remoteJid]?.get(key.id);

				if (msg) {
					updateMessageWithReceipt(msg, receipt);
					this.#scheduleFlush();
				}
			}
		});

		ev.on('messages.reaction', (reactions) => {
			for (const { key, reaction } of reactions) {
				const msg = this.messages[key.remoteJid]?.get(key.id);

				if (msg) {
					updateMessageWithReaction(msg, reaction);
					this.#scheduleFlush();
				}
			}
		});
	}

	async loadMessage(jid, id) {
		return this.messages[jid]?.get(id);
	}

	loadMessages(jid, count, cursor) {
		const list = this.#assertMessageList(jid);
		const mode = !cursor || 'before' in cursor ? 'before' : 'after';
		const cursorKey = cursor ? ('before' in cursor ? cursor.before : cursor.after) : undefined;
		const cursorValue = cursorKey ? list.get(cursorKey.id) : undefined;

		if (list && mode === 'before' && (!cursorKey || cursorValue)) {
			let result;

			if (cursorValue) {
				const idx = list.array.findIndex((m) => m.key.id === cursorKey?.id);

				result = list.array.slice(0, idx);
			} else {
				result = list.array;
			}

			const diff = count - result.length;

			if (diff < 0) {
				result = result.slice(-count);
			}

			return result;
		}

		return [];
	}

	async fetchGroupMetadata(jid, sock) {
		if (!this.groupMetadata[jid]) {
			const metadata = await sock?.groupMetadata(jid);

			if (metadata) {
				this.groupMetadata[jid] = metadata;
			}
		}

		return this.groupMetadata[jid];
	}

	async fetchImageUrl(jid, sock) {
		const contact = this.contacts[jid];

		if (!contact) {
			return sock?.profilePictureUrl(jid);
		}

		if (typeof contact.imgUrl === 'undefined') {
			contact.imgUrl = await sock?.profilePictureUrl(jid);
		}

		return contact.imgUrl;
	}

	async flush(force = false) {
		if (!this.#sessionName || !this.#prisma) {
			return;
		}

		if (!this.#hydrated) {
			this.#pendingFlush = this.#pendingFlush || force;
			await this.#hydration;
		}

		if (this.#flushInProgress) {
			this.#pendingFlush = this.#pendingFlush || force;
			return;
		}

		if (!this.#pendingFlush && !force) {
			return;
		}

		this.#flushInProgress = true;
		this.#pendingFlush = false;

		try {
			await upsertBaileysStore(this.#prisma, this.#sessionName, this.toJSON());
		} catch (error) {
			this.#pendingFlush = true;
			this.#warn('Failed saving store snapshot:', error);
		} finally {
			this.#flushInProgress = false;

			if (this.#pendingFlush && !this.#flushTimer) {
				this.#flushTimer = setTimeout(() => {
					this.#flushTimer = null;
					this.flush();
				}, this.#persistIntervalMs);
			}
		}
	}

	toJSON() {
		return {
			chats: this.chats,
			contacts: this.contacts,
			messages: this.messages,
			labels: this.labels,
			labelAssociations: this.labelAssociations
		};
	}

	#fromJSON(json) {
		this.chats.upsert(...json.chats);
		this.labelAssociations.upsert(...(json.labelAssociations || []));
		this.#contactsUpsert(Object.values(json.contacts));

		for (const label of Object.values(json.labels || {})) {
			this.labels.upsertById(label.id, label);
		}

		for (const jid in json.messages) {
			const list = this.#assertMessageList(jid);

			for (const msg of json.messages[jid]) {
				list.upsert(proto.WebMessageInfo.fromObject(msg), 'append');
			}
		}
	}

	#assertMessageList(jid) {
		if (!this.messages[jid]) {
			this.messages[jid] = makeOrderedDictionary((m) => m.key.id || '');
		}

		return this.messages[jid];
	}

	#contactsUpsert(newContacts) {
		const old = new Set(Object.keys(this.contacts));

		for (const contact of newContacts) {
			old.delete(contact.id);
			this.contacts[contact.id] = Object.assign(this.contacts[contact.id] || {}, contact);
		}

		return old;
	}

	#scheduleFlush() {
		if (!this.#sessionName || !this.#prisma) {
			return;
		}

		this.#pendingFlush = true;

		if (this.#flushTimer) {
			return;
		}

		this.#flushTimer = setTimeout(() => {
			this.#flushTimer = null;
			this.flush();
		}, this.#persistIntervalMs);
	}

	#registerShutdownHooks() {
		const handle = () => this.flush(true);

		process.once('SIGINT', handle);
		process.once('SIGTERM', handle);
		process.once('beforeExit', handle);
	}

	#warn(message, error) {
		if (this.#logger?.warn) {
			this.#logger.warn({ err: error }, message);
		} else {
			console.warn(message, error?.message || error);
		}
	}
}
