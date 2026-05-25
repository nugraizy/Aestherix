/**
 * Fake Context for command tests.
 *
 * Returns a Context-shaped plain object. By default emulates a private-chat
 * text message from a non-owner non-banned non-premium user. Override any
 * field via the `overrides` argument.
 *
 * Convenience methods (`reply`, `react`, `send`) record their calls so the
 * test can assert on them.
 *
 * Usage:
 *   import { makeFakeContext } from '../../_fixtures/index.js';
 *   const ctx = makeFakeContext({ args: ['hello', 'world'] });
 *   await cmd.run(ctx, client, store);
 *   assert.deepEqual(ctx.replies[0], { text: 'pong!' });
 */

const SAMPLE_SENDER = '6281234567890@s.whatsapp.net';
const SAMPLE_GROUP = '120363000000000000@g.us';

export const makeFakeContext = (overrides = {}) => {
	const replies = [];
	const reactions = [];
	const sends = [];

	const isGroup = overrides.isGroup ?? false;
	const sender = overrides.sender ?? SAMPLE_SENDER;
	const from = overrides.from ?? (isGroup ? SAMPLE_GROUP : sender);
	const body = overrides.body ?? '';
	const args = overrides.args ?? (body ? body.split(/\s+/) : []);

	const ctx = {
		replies,
		reactions,
		sends,

		from,
		sender,
		participant: isGroup ? sender : '',
		pushname: 'Test User',

		isGroup,
		isFromMe: false,
		isOwner: false,
		isPremium: false,
		isBanned: false,
		isBlocked: false,
		isAdmin: false,
		isBotAdmin: false,
		isBotInstance: false,

		body,
		args,
		query: args.slice(1).join(' '),
		cmd: args[0] ?? '',
		prefix: '.',
		type: 'extendedTextMessage',
		typeQuoted: null,

		mention: [],
		message: {
			key: { id: `fake-${Date.now()}`, remoteJid: from, fromMe: false, participant: isGroup ? sender : undefined },
			message: { conversation: body },
			messageTimestamp: Math.floor(Date.now() / 1000),
			pushName: 'Test User'
		},
		raw: null,

		settings: {
			owner_number: '6281234567890',
			prefix: '.',
			limit: 10
		},
		groupSettings: isGroup
			? {
					antinsfw: false,
					antiurl: false,
					welcome: false
				}
			: {},

		async reply(text) {
			replies.push({ text });
			return { key: { id: `reply-${replies.length}` } };
		},
		async react(emoji) {
			reactions.push({ emoji });
			return { key: { id: `react-${reactions.length}` } };
		},
		async send(content, options) {
			sends.push({ content, options });
			return { key: { id: `send-${sends.length}` } };
		},
		async sendTo(jid, content, options) {
			sends.push({ jid, content, options, kind: 'sendTo' });
			return { key: { id: `sendTo-${sends.length}` } };
		},
		async delete() {
			return { key: { id: 'delete-1' } };
		},

		...overrides
	};

	ctx.raw = ctx.raw ?? ctx.message;

	return ctx;
};
