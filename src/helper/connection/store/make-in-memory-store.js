import { DEFAULT_CONNECTION_CONFIG, jidDecode, jidNormalizedUser, proto } from 'baileys';
import { md5, toNumber, updateMessageWithReaction, updateMessageWithReceipt } from 'baileys/lib/Utils/index.js';
import { createRequire } from 'module';
import { getBaileysStore, upsertBaileysStore } from '../../database/adapters/baileys-store.js';
import makeOrderedDictionary from './make-ordered-dictionary.js';
import { ObjectRepository } from './object-repository.js';

const require = createRequire(import.meta.url);

/**
 * @typedef {import('@adiwajshing/keyed-db').default} KeyedDB
 * @typedef {import('@adiwajshing/keyed-db/lib/Types').Comparable<any, string>} Comparable
 * @typedef {import('baileys').BaileysEventEmitter} BaileysEventEmitter
 * @typedef {import('baileys').Chat} Chat
 * @typedef {import('baileys').ConnectionState} ConnectionState
 * @typedef {import('baileys').Contact} Contact
 * @typedef {import('baileys').GroupMetadata} GroupMetadata
 * @typedef {import('baileys').PresenceData} PresenceData
 * @typedef {import('baileys').WAMessage} WAMessage
 * @typedef {import('baileys').WAMessageCursor} WAMessageCursor
 * @typedef {import('baileys').WAMessageKey} WAMessageKey
 * @typedef {import('baileys/lib/Types/LabelAssociation').LabelAssociation} LabelAssociation
 * @typedef {import('baileys/lib/Types/LabelAssociation').MessageLabelAssociation} MessageLabelAssociation
 * @typedef {import('baileys/lib/Utils/logger').ILogger} ILogger
 * @typedef {{ chatKey?: Comparable, labelAssociationKey?: Comparable, logger?: ILogger, socket?: any }} BaileysInMemoryStoreConfig
 */

export const waChatKey = (pin) => ({
	key: (c) =>
		(pin ? (c.pinned ? '1' : '0') : '') +
		(c.archived ? '0' : '1') +
		(c.conversationTimestamp ? c.conversationTimestamp.toString(16).padStart(8, '0') : '') +
		c.id,
	compare: (k1, k2) => k2.localeCompare(k1)
});

export const waMessageID = (m) => m.key.id || '';

export const waLabelAssociationKey = {
	key: (la) => (la.type === 'label_jid' ? la.chatId + la.labelId : la.chatId + la.messageId + la.labelId),
	compare: (k1, k2) => k2.localeCompare(k1)
};

const makeMessagesDictionary = () => makeOrderedDictionary(waMessageID);
const DEFAULT_PERSIST_INTERVAL_MS = 3 * 1000;

/**
 * @param {BaileysInMemoryStoreConfig} config
 */
const makeInMemoryStore = (config) => {
	const socket = config.socket;
	const chatKey = config.chatKey || waChatKey(true);
	const labelAssociationKey = config.labelAssociationKey || waLabelAssociationKey;
	const logger = config.logger || DEFAULT_CONNECTION_CONFIG.logger.child({ stream: 'in-mem-store' });
	const KeyedDB = require('@adiwajshing/keyed-db').default;

	/** @type {KeyedDB} */
	const chats = new KeyedDB(chatKey, (c) => c.id);
	/** @type {Record<string, ReturnType<typeof makeMessagesDictionary>>} */
	const messages = {};
	/** @type {Record<string, Contact>} */
	const contacts = {};
	/** @type {Record<string, GroupMetadata>} */
	const groupMetadata = {};
	/** @type {Record<string, Record<string, PresenceData>>} */
	const presences = {};
	/** @type {ConnectionState} */
	const state = { connection: 'close' };
	const labels = new ObjectRepository();
	/** @type {KeyedDB} */
	const labelAssociations = new KeyedDB(labelAssociationKey, labelAssociationKey.key);

	const assertMessageList = (jid) => {
		if (!messages[jid]) {
			messages[jid] = makeMessagesDictionary();
		}

		return messages[jid];
	};

	const contactsUpsert = (newContacts) => {
		const oldContacts = new Set(Object.keys(contacts));

		for (const contact of newContacts) {
			oldContacts.delete(contact.id);
			contacts[contact.id] = Object.assign(contacts[contact.id] || {}, contact);
		}

		return oldContacts;
	};

	const labelsUpsert = (newLabels) => {
		for (const label of newLabels) {
			labels.upsertById(label.id, label);
		}
	};

	/**
	 * @param {BaileysEventEmitter} ev
	 */
	const bind = (ev) => {
		ev.on('connection.update', (update) => {
			Object.assign(state, update);
		});

		ev.on('messaging-history.set', ({ chats: newChats, contacts: newContacts, messages: newMessages, isLatest, syncType }) => {
			if (syncType === proto.HistorySync.HistorySyncType.ON_DEMAND) {
				return;
			}

			if (isLatest) {
				chats.clear();

				for (const id in messages) {
					delete messages[id];
				}
			}

			const chatsAdded = chats.insertIfAbsent(...newChats).length;

			logger.debug({ chatsAdded }, 'synced chats');

			const oldContacts = contactsUpsert(newContacts);

			if (isLatest) {
				for (const jid of oldContacts) {
					delete contacts[jid];
				}
			}

			logger.debug({ deletedContacts: isLatest ? oldContacts.size : 0, newContacts }, 'synced contacts');

			for (const msg of newMessages) {
				const jid = msg.key.remoteJid;
				const list = assertMessageList(jid);

				list.upsert(msg, 'prepend');
			}

			logger.debug({ messages: newMessages.length }, 'synced messages');
		});

		ev.on('contacts.upsert', (contactsBatch) => {
			contactsUpsert(contactsBatch);
		});

		ev.on('contacts.update', async (updates) => {
			for (const update of updates) {
				let contact;

				if (contacts[update.id]) {
					contact = contacts[update.id];
				} else {
					const contactHashes = await Promise.all(
						Object.keys(contacts).map(async (contactId) => {
							const { user } = jidDecode(contactId);

							return [contactId, (await md5(Buffer.from(user + 'WA_ADD_NOTIF', 'utf8'))).toString('base64').slice(0, 3)];
						})
					);

					contact = contacts[contactHashes.find(([, b]) => b === update.id)?.[0] || ''];
				}

				if (contact) {
					if (update.imgUrl === 'changed') {
						contact.imgUrl = socket ? await socket?.profilePictureUrl(contact.id) : undefined;
					} else if (update.imgUrl === 'removed') {
						delete contact.imgUrl;
					}
				} else {
					return logger.debug({ update }, 'got update for non-existant contact');
				}

				Object.assign(contacts[contact.id], contact);
			}
		});

		ev.on('chats.upsert', (newChats) => {
			chats.upsert(...newChats);
		});

		ev.on('chats.update', (updates) => {
			for (let update of updates) {
				const result = chats.update(update.id, (chat) => {
					if (update.unreadCount > 0) {
						update = { ...update };
						update.unreadCount = (chat.unreadCount || 0) + update.unreadCount;
					}

					Object.assign(chat, update);
				});

				if (!result) {
					logger.debug({ update }, 'got update for non-existant chat');
				}
			}
		});

		ev.on('labels.edit', (label) => {
			if (label.deleted) {
				return labels.deleteById(label.id);
			}

			if (labels.count() < 20) {
				return labels.upsertById(label.id, label);
			}

			logger.error('Labels count exceed');
		});

		ev.on('labels.association', ({ type, association }) => {
			switch (type) {
				case 'add':
					labelAssociations.upsert(association);
					break;
				case 'remove':
					labelAssociations.delete(association);
					break;
				default:
					console.error(`unknown operation type [${type}]`);
			}
		});

		ev.on('presence.update', ({ id, presences: update }) => {
			presences[id] = presences[id] || {};
			Object.assign(presences[id], update);
		});

		ev.on('chats.delete', (deletions) => {
			for (const item of deletions) {
				if (chats.get(item)) {
					chats.deleteById(item);
				}
			}
		});

		ev.on('messages.upsert', ({ messages: newMessages, type }) => {
			switch (type) {
				case 'append':
				case 'notify':
					for (const msg of newMessages) {
						const jid = jidNormalizedUser(msg.key.remoteJid);
						const list = assertMessageList(jid);

						list.upsert(msg, 'append');

						if (type === 'notify' && !chats.get(jid)) {
							ev.emit('chats.upsert', [
								{
									id: jid,
									conversationTimestamp: toNumber(msg.messageTimestamp),
									unreadCount: 1
								}
							]);
						}
					}

					break;
			}
		});

		ev.on('messages.update', (updates) => {
			for (const { update, key } of updates) {
				const list = assertMessageList(jidNormalizedUser(key.remoteJid));

				if (update?.status) {
					const listStatus = list.get(key.id)?.status;

					if (listStatus && update?.status <= listStatus) {
						logger.debug({ update, storedStatus: listStatus }, 'status stored newer then update');
						delete update.status;
						logger.debug({ update }, 'new update object');
					}
				}

				const result = list.updateAssign(key.id, update);

				if (!result) {
					logger.debug({ update }, 'got update for non-existent message');
				}
			}
		});

		ev.on('messages.delete', (item) => {
			if ('all' in item) {
				const list = messages[item.jid];

				list?.clear();
				return;
			}

			const jid = item.keys[0].remoteJid;
			const list = messages[jid];

			if (list) {
				const idSet = new Set(item.keys.map((k) => k.id));

				list.filter((m) => !idSet.has(m.key.id));
			}
		});

		ev.on('groups.update', (updates) => {
			for (const update of updates) {
				const id = update.id;

				if (groupMetadata[id]) {
					Object.assign(groupMetadata[id], update);
				} else {
					logger.debug({ update }, 'got update for non-existant group metadata');
				}
			}
		});

		ev.on('group-participants.update', ({ id, participants, action }) => {
			const metadata = groupMetadata[id];

			if (metadata) {
				switch (action) {
					case 'add':
						metadata.participants.push(
							...participants.map((participant) => ({
								id: participant,
								isAdmin: false,
								isSuperAdmin: false
							}))
						);
						break;
					case 'demote':
					case 'promote':
						for (const participant of metadata.participants) {
							if (participants.includes(participant.id)) {
								participant.isAdmin = action === 'promote';
							}
						}

						break;
					case 'remove':
						metadata.participants = metadata.participants.filter((participant) => !participants.includes(participant.id));
						break;
				}
			}
		});

		ev.on('message-receipt.update', (updates) => {
			for (const { key, receipt } of updates) {
				const obj = messages[key.remoteJid];
				const msg = obj?.get(key.id);

				if (msg) {
					updateMessageWithReceipt(msg, receipt);
				}
			}
		});

		ev.on('messages.reaction', (reactions) => {
			for (const { key, reaction } of reactions) {
				const obj = messages[key.remoteJid];
				const msg = obj?.get(key.id);

				if (msg) {
					updateMessageWithReaction(msg, reaction);
				}
			}
		});
	};

	const toJSON = () => ({
		chats,
		contacts,
		messages,
		labels,
		labelAssociations
	});

	const fromJSON = (json) => {
		chats.upsert(...json.chats);
		labelAssociations.upsert(...(json.labelAssociations || []));
		contactsUpsert(Object.values(json.contacts));
		labelsUpsert(Object.values(json.labels || {}));

		for (const jid in json.messages) {
			const list = assertMessageList(jid);

			for (const msg of json.messages[jid]) {
				list.upsert(proto.WebMessageInfo.fromObject(msg), 'append');
			}
		}
	};

	return {
		chats,
		contacts,
		messages,
		groupMetadata,
		state,
		presences,
		labels,
		labelAssociations,
		bind,
		loadMessages: async (jid, count, cursor) => {
			const list = assertMessageList(jid);
			const mode = !cursor || 'before' in cursor ? 'before' : 'after';
			const cursorKey = cursor ? ('before' in cursor ? cursor.before : cursor.after) : undefined;
			const cursorValue = cursorKey ? list.get(cursorKey.id) : undefined;

			let messagesResult;

			if (list && mode === 'before' && (!cursorKey || cursorValue)) {
				if (cursorValue) {
					const msgIdx = list.array.findIndex((m) => m.key.id === cursorKey?.id);

					messagesResult = list.array.slice(0, msgIdx);
				} else {
					messagesResult = list.array;
				}

				const diff = count - messagesResult.length;

				if (diff < 0) {
					messagesResult = messagesResult.slice(-count);
				}
			} else {
				messagesResult = [];
			}

			return messagesResult;
		},
		getLabels: () => labels,
		getChatLabels: (chatId) => labelAssociations.filter((la) => la.chatId === chatId).all(),
		getMessageLabels: (messageId) => {
			const associations = labelAssociations.filter((la) => la.messageId === messageId).all();

			return associations.map(({ labelId }) => labelId);
		},
		loadMessage: async (jid, id) => messages[jid]?.get(id),
		mostRecentMessage: async (jid) => messages[jid]?.array.slice(-1)[0],
		fetchImageUrl: async (jid, sock) => {
			const contact = contacts[jid];

			if (!contact) {
				return sock?.profilePictureUrl(jid);
			}

			if (typeof contact.imgUrl === 'undefined') {
				contact.imgUrl = await sock?.profilePictureUrl(jid);
			}

			return contact.imgUrl;
		},
		fetchGroupMetadata: async (jid, sock) => {
			if (!groupMetadata[jid]) {
				const metadata = await sock?.groupMetadata(jid);

				if (metadata) {
					groupMetadata[jid] = metadata;
				}
			}

			return groupMetadata[jid];
		},
		fetchMessageReceipts: async ({ remoteJid, id }) => {
			const list = messages[remoteJid];
			const msg = list?.get(id);

			return msg?.userReceipt;
		},
		toJSON,
		fromJSON,
		writeToFile: (path) => {
			const { writeFileSync } = require('fs');

			writeFileSync(path, JSON.stringify(toJSON()));
		},
		readFromFile: (path) => {
			const { readFileSync, existsSync } = require('fs');

			if (existsSync(path)) {
				logger.debug({ path }, 'reading from file');
				const jsonStr = readFileSync(path, { encoding: 'utf-8' });
				const json = JSON.parse(jsonStr);

				fromJSON(json);
			}
		}
	};
};

export default makeInMemoryStore;

const warnStoreError = (logger, message, error) => {
	if (logger?.warn) {
		logger.warn({ err: error }, message);
		return;
	}

	console.warn(message, error?.message || error);
};

/**
 * @typedef {{
 *   sessionName: string,
 *   prisma: import('@prisma/client').PrismaClient,
 *   resetOnStart?: boolean,
 *   persistIntervalMs?: number,
 * } & BaileysInMemoryStoreConfig} PersistentStoreConfig
 */

/**
 * @param {PersistentStoreConfig} config
 */
export const makePersistentStore = async (config) => {
	const sessionName = String(config.sessionName || '').trim();
	const persistIntervalMs = Number(config.persistIntervalMs || DEFAULT_PERSIST_INTERVAL_MS);
	const store = makeInMemoryStore(config);

	if (!sessionName || !config.prisma) {
		return store;
	}

	try {
		const snapshot = await getBaileysStore(config.prisma, sessionName);

		if (snapshot) {
			store.fromJSON(snapshot);
		}
	} catch (error) {
		warnStoreError(config.logger, 'Failed loading store snapshot:', error);
	}

	setInterval(() => {
		void upsertBaileysStore(config.prisma, sessionName, store.toJSON()).catch((error) => {
			warnStoreError(config.logger, 'Failed saving store snapshot:', error);
		});
	}, persistIntervalMs);

	return store;
};
