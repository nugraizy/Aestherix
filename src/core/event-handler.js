import { checkAfk, deleteAfk, getAfk } from '../helper/index.js';
import { Cache } from '../helper/modules/cache.js';
import { getTimeSince } from '../utils/modules/index.js';
import { ConnectionHandler } from './connection-handler.js';
import { MessageHandler } from './message-handler.js';

export class EventHandler {
	#client;
	#store;
	#configuration;
	#options;
	#lazy = new Cache();
	#messageHandler;
	#connectionHandler;

	constructor(client, { router, store, configuration, options = {} }) {
		this.#client = client;
		this.#store = store;
		this.#configuration = configuration;
		this.#options = options;

		this.#messageHandler = new MessageHandler(client, {
			router,
			store,
			configuration,
			options
		});

		this.#connectionHandler = new ConnectionHandler(client, {
			configuration,
			options
		});
	}

	get messageHandler() {
		return this.#messageHandler;
	}

	get connectionHandler() {
		return this.#connectionHandler;
	}

	bind() {
		this.#client.on('connection.update', (update) => this.#connectionHandler.handle(update));
		this.#client.on('messages.upsert', (upsert) => this.#messageHandler.handle(upsert));
		this.#client.on('messages.update', (updates) => this.handleDeletedMessage(updates));
		this.#client.on('presence.update', (presence) => this.handlePresence(presence));
		this.#client.on('group-participants.update', (update) => this.handleParticipants(update));
		this.#client.on('groups.update', (update) => this.handleGroupSettings(update));
		this.#client.on('call', (calls) => this.handleCall(calls));

		return this;
	}

	async handleDeletedMessage(updates) {
		if (updates?.[0]?.update?.messageStubType !== 1) {
			return;
		}

		const deletedId = this.#store?.messages?.[updates[0].key.remoteJid]
			?.toJSON()
			?.filter((m) => m.key.id === updates[0].update.key.id)?.[0]?.message?.protocolMessage?.key?.id;

		if (!deletedId) {
			return;
		}

		const message = this.#store?.messages?.[updates[0].key.remoteJid]?.get(deletedId);

		if (!message) {
			return;
		}

		const handler = await this.#load('deleted', './handlers/deleted-message.js');

		await handler(this.#client, message, false);
	}

	async handlePresence(presence) {
		const from = presence.id;
		const participant = Object.keys(presence.presences)[0];
		const state = presence.presences[participant].lastKnownPresence;

		if (state !== 'composing') {
			return;
		}

		const afkContainer = getAfk(participant, from);

		if (!checkAfk(participant, from) || afkContainer.since === new Date().getTime()) {
			return;
		}

		const timeSinceAfk = getTimeSince(afkContainer.since);
		const text = `@${participant.split('@')[0]} detected writing. AFK since ${timeSinceAfk} ago. Now they are out from AFK. Reason : ${afkContainer.reasons}`;

		await this.#client.send(from, { text, mentions: [participant] });
		deleteAfk(participant, from);
	}

	async handleParticipants(update) {
		if (update?.id) {
			this.#configuration.groups.invalidate(update.id);
		}

		const handler = await this.#load('participants', './handlers/group-participants.js');

		await handler(this.#client, update);
	}

	async handleGroupSettings(update) {
		const updates = Array.isArray(update) ? update : [update];

		for (const u of updates) {
			if (u?.id) {
				this.#configuration.groups.update(u.id, {
					subject: u.subject,
					desc: u.desc,
					announce: u.announce,
					restrict: u.restrict
				});
			}
		}

		const handler = await this.#load('groupSettings', './handlers/group-settings.js');

		await handler(this.#client, update);
	}

	async handleCall(calls) {
		if (!this.#options.flags?.noCall) {
			return;
		}

		const [{ isGroup, status, id, from }] = calls;

		if (isGroup || status !== 'offer') {
			return;
		}

		const socket = this.#client.socket;
		const meJid = this.#client.decodeJid(this.#client.user?.id);

		await socket.sendNode({
			tag: 'call',
			attrs: { from: meJid, to: from, id: socket.generateMessageTag() },
			content: [
				{
					tag: 'reject',
					attrs: { 'call-id': id, 'call-creator': from, count: '512202' },
					content: null
				}
			]
		});

		await socket.updateBlockStatus(from, 'block');
	}

	async #load(key, modulePath) {
		if (!this.#lazy.has(key)) {
			const module = await import(modulePath);

			this.#lazy.set(key, module.default ?? module);
		}

		return this.#lazy.get(key);
	}
}
