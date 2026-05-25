/**
 * Fake ClientSocket for command tests.
 *
 * Records every send/reply for inspection. Each method returns a resolved
 * promise so commands can `await` without surprises.
 *
 * Usage:
 *   import { makeFakeClient } from '../../_fixtures/index.js';
 *   const client = makeFakeClient();
 *   await myCommand.run(ctx, client, store);
 *   assert.equal(client.replies.length, 1);
 *   assert.match(client.replies[0].text, /pong/i);
 */

const noopAsync = () => Promise.resolve();
const resolveBuffer = () => Promise.resolve(Buffer.alloc(0));

export const makeFakeClient = (overrides = {}) => {
	const replies = [];
	const sends = [];
	const reactions = [];
	const updates = [];
	const downloads = [];

	const templateBuilderClass = class TemplateBuilderNative {
		constructor() {
			this.args = { destination: null, body: '', footer: '', header: null, buttons: [], mentions: [] };
			this.button = {
				reply: ({ display, id }) => ({ kind: 'reply', display, id }),
				url: ({ display, url }) => ({ kind: 'url', display, url })
			};
		}
		destination(d) {
			this.args.destination = d;
			return this;
		}
		body(b) {
			this.args.body = b;
			return this;
		}
		footer(f) {
			this.args.footer = f;
			return this;
		}
		header(h, m) {
			this.args.header = { text: h, media: m };
			return this;
		}
		buttons(...bs) {
			this.args.buttons = bs;
			return this;
		}
		mentions(jids) {
			this.args.mentions = jids;
			return this;
		}
		render() {
			return Promise.resolve({ key: { id: 'fake-id' } });
		}
		send() {
			sends.push({ kind: 'template', ...this.args });
			return Promise.resolve();
		}
	};

	const client = {
		replies,
		sends,
		reactions,
		updates,
		downloads,

		role: 'primary',
		state: 'connected',
		user: { id: 'bot@s.whatsapp.net', name: 'Bot' },
		sessionName: 'fake-session',

		TemplateBuilder: { Native: templateBuilderClass, Carousel: templateBuilderClass },

		reply(to, text, quoted) {
			replies.push({ to, text, quoted });
			return Promise.resolve({ key: { id: `reply-${replies.length}` } });
		},
		send(to, content, options = {}) {
			sends.push({ to, content, options });
			return Promise.resolve({ key: { id: `send-${sends.length}` } });
		},
		sendTo(to, content, options = {}) {
			sends.push({ to, content, options, kind: 'sendTo' });
			return Promise.resolve({ key: { id: `sendTo-${sends.length}` } });
		},
		relay: noopAsync,
		readMessages: noopAsync,
		sendPresenceUpdate: noopAsync,
		sendReceipt: noopAsync,
		updateGroup(jid, opts) {
			updates.push({ jid, opts });
			return Promise.resolve();
		},

		async waitMessage(jid, message) {
			replies.push({ to: jid, text: message });
			return { update: async (text) => replies.push({ to: jid, text, kind: 'update' }) };
		},

		downloadMediaMessage(media) {
			downloads.push({ media });
			return resolveBuffer();
		},
		prepareMedia: resolveBuffer,
		prepareSticker: resolveBuffer,
		applyExif: resolveBuffer,

		profilePictureUrl: () => Promise.resolve(null),
		fetchBlocklist: () => Promise.resolve([]),
		groupMetadata: () => Promise.resolve({ id: 'fake@g.us', participants: [] }),

		decodeJid: (jid) => jid,
		generateMessageID: () => `fake-msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,

		ev: { emit: () => {}, on: () => {}, off: () => {} },
		ws: { on: () => {}, off: () => {} },

		...overrides
	};

	return client;
};
