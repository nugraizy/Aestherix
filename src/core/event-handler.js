import { checkAfk, deleteAfk, getAfk } from '../helper/index.js';
import { Cache } from '../helper/modules/cache.js';
import { getTimeSince } from '../utils/modules/index.js';
import { MessageHandler } from './message-handler.js';
import { ConnectionHandler } from './connection-handler.js';

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
		if (updates?.[0]?.update?.status === 4 || updates?.[0]?.update?.status === 3) {
			return;
		}

		const message = this.#store?.messages?.[updates[0].key.remoteJid]?.get(updates[0].key.id);

		if (!message) {
			return;
		}

		const handler = await this.#load('deleted', './handlers/deleted-message.js');

		await handler(this.#legacyClient(), message, false, this.#store);
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
		const handler = await this.#load('participants', './handlers/group-participants.js');

		await handler(this.#legacyClient(), update);
	}

	async handleGroupSettings(update) {
		const handler = await this.#load('groupSettings', './handlers/group-settings.js');

		await handler(this.#legacyClient(), update);
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
			content: [{
				tag: 'reject',
				attrs: { 'call-id': id, 'call-creator': from, count: '512202' },
				content: null
			}]
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

	#legacyClient() {
		return {
			instance: this.#client.socket,
			sessionName: this.#client.sessionName
		};
	}
}
