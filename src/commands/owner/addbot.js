import { isJidGroup } from 'baileys';

import { Auth } from '../../core/auth.js';
import { ClientSocket } from '../../core/client-socket.js';
import { EventHandler } from '../../core/event-handler.js';
import { manager } from '../../core/manager.js';
import { Router } from '../../core/router.js';
import { initContact, updateContact } from '../../core/utils.js';
import configuration from '../../helper/config/connect.js';
import prisma from '../../helper/database/prisma.js';

const parseFlags = (args) => {
	const flags = {};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];

		if (!arg.startsWith('--')) {
			continue;
		}

		const key = arg.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
		const next = args[i + 1];

		if (!next || next.startsWith('--')) {
			flags[key] = true;
		} else {
			flags[key] = next;
			i++;
		}
	}

	return flags;
};

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'addbot',
	description: 'Add and connect a new sub-bot instance.',
	usage: '!addbot <session_name> [--pair-number 628xxx] [--prefix !] [--flags]',
	aliases: ['newbot'],
	category: 'Owner',
	cooldown: 10,
	limit: 0,
	status: 'enable',
	restrict: false,
	premium: false,

	async run({ from, args, message, isOwner, sender }, client) {
		if (!isOwner) {
			return;
		}

		const sessionName = args[1];

		if (!sessionName) {
			return client.reply(from, 'Usage: !addbot <session_name> [--pair-number 628xxx] [--flags]', message);
		}

		if (manager.has(sessionName)) {
			return client.reply(from, `❌ Bot "${sessionName}" already exists.`, message);
		}

		const flags = parseFlags(args.slice(2));

		await client.reply(from, `⏳ Creating bot "${sessionName}"...`, message);

		const auth = new Auth(prisma, sessionName);
		const sub = new ClientSocket(auth, {
			role: 'sub',
			flags,
			cachedGroupMetadata: (jid) => (isJidGroup(jid) ? configuration.cache.metadata.get(jid) : {})
		});

		manager.add(sessionName, sub);

		const pairNumber = flags.pairNumber || flags.pairmode || sender.replace(/@s\.whatsapp\.net$/, '');

		flags.pairMode = true;
		let paired = false;

		sub.on('connection.update', async (conn) => {
			const { connection, lastDisconnect } = conn;

			if (connection === 'open' && !paired) {
				paired = true;
				const phone = sub.socket.user?.id?.split(':')[0] ?? 'unknown';

				await client.reply(from, `✅ Bot "${sessionName}" is online! (${phone})`, message);

				await prisma.botInstance.upsert({
					where: { sessionName },
					update: { flags: JSON.stringify(flags), isActive: true },
					create: { sessionName, flags: JSON.stringify(flags), role: 'sub', pairNumber: pairNumber || null, isActive: true }
				});

				const router = new Router(sub, { commands: configuration.cmds.commands, aliases: configuration.cmds.aliases });
				const store = sub.store;

				const eventHandler = new EventHandler(sub, { router, store, configuration, options: { flags } });

				eventHandler.bind();

				sub.on('contacts.upsert', (contacts) => initContact(store, contacts));
				sub.on('contacts.update', (update) => updateContact(store, update));
			}

			if (connection === 'close') {
				const { Boom } = await import('@hapi/boom');
				const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
				const { DisconnectReason } = await import('baileys');

				if (reason === DisconnectReason.loggedOut) {
					await client.reply(from, `❌ Bot "${sessionName}" logged out.`, message);
					manager.remove(sessionName);
					return;
				}

				sub.removeAllListeners();
				await sub.connect({ prisma }).catch(() => {});
			}
		});

		try {
			await sub.connect({ prisma });

			await new Promise((resolve) => {
				if (sub.needsPairing) {
					resolve();
				} else {
					sub.once('connection.update', () => resolve());
				}
			});

			await new Promise((resolve) => setTimeout(resolve, 15000));

			const code = await sub.requestPairingCode(String(pairNumber).replace(/[^0-9]/g, ''));

			await client.reply(
				from,
				`🤖 *${sessionName}* pairing code:\n\n\`${code.slice(0, 4)}-${code.slice(4)}\`\n\nEnter this on the target phone within 60s.`,
				message
			);
		} catch (err) {
			sub.removeAllListeners();
			await sub.disconnect().catch(() => {});
			manager.remove(sessionName);
			return client.reply(from, `❌ Failed to start "${sessionName}": ${err.message}`, message);
		}
	}
};
