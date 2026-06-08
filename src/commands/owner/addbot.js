import { isJidGroup } from 'baileys';

import { Auth } from '../../core/auth.js';
import { ClientSocket } from '../../core/client-socket.js';
import { EventHandler } from '../../core/event-handler.js';
import { manager } from '../../core/manager.js';
import { IS_PM2, startPm2SubBot } from '../../core/pm2-helpers.js';
import { Router } from '../../core/router.js';
import { cleanupSession } from '../../core/session-cleanup.js';
import { initContact, updateContact } from '../../core/utils.js';
import configuration from '../../helper/config/connect.js';
import prisma from '../../helper/database/prisma.js';
import { defineCommand } from '../_define.js';

const MAX_RETRIES = 5;

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

function setupSubBot(sub, { sessionName, configuration: config, flags }) {
	const subRouter = new Router(sub, { commands: config.registry.commands, aliases: config.registry.aliases });
	const subStore = sub.store;
	const eventHandler = new EventHandler(sub, {
		router: subRouter,
		store: subStore,
		configuration: config,
		options: { flags }
	});

	eventHandler.bind();

	sub.on('contacts.upsert', (contacts) => initContact(subStore, contacts));
	sub.on('contacts.update', (update) => updateContact(subStore, update));

	if (config.logMultiplexer) {
		const badge = `SUB-${sessionName}`;

		config.logMultiplexer.register(sub.logger, badge);
	}
}

export default defineCommand({
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

		const existing = manager.get(sessionName);

		if (existing) {
			if (existing.state === 'connected') {
				return client.reply(from, `Bot "${sessionName}" is already online! (${existing.phone})`, message);
			}

			if (existing.state === 'connecting') {
				return client.reply(from, `Bot "${sessionName}" is already connecting...`, message);
			}
		}

		const dbInstance = await prisma.botInstance.findUnique({ where: { sessionName } });
		const flags = parseFlags(args.slice(2));

		if (existing && existing.state === 'disconnected') {
			await client.reply(from, `Reconnecting "${sessionName}"...`, message);

			let retryCount = 0;

			existing.removeAllListeners('connection.update');

			existing.on('connection.update', async (conn) => {
				const { connection, lastDisconnect } = conn;

				if (connection === 'open') {
					retryCount = 0;
					const phone = existing.socket.user?.id?.split(':')[0] ?? 'unknown';

					await client.reply(from, `Bot "${sessionName}" reconnected! (${phone})`, message);

					setupSubBot(existing, { sessionName, configuration, flags });
				}

				if (connection === 'close') {
					const { Boom } = await import('@hapi/boom');
					const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
					const { DisconnectReason } = await import('baileys');

					if (reason === DisconnectReason.loggedOut || reason === DisconnectReason.badSession) {
						const label = reason === DisconnectReason.loggedOut ? 'logged out' : 'has a bad session';

						await client.reply(from, `Bot "${sessionName}" ${label}. Session cleaned up.`, message);
						manager.remove(sessionName);
						await cleanupSession(sessionName);
						return;
					}

					if (retryCount >= MAX_RETRIES) {
						await client.reply(from, `Bot "${sessionName}" max retries reached. Use !addbot to restart.`, message);
						manager.remove(sessionName);
						return;
					}

					retryCount++;
					await existing.connect({ prisma }).catch(() => {});
				}
			});

			await existing.connect({ prisma }).catch((err) => {
				manager.remove(sessionName);
				return client.reply(from, `Failed to reconnect "${sessionName}": ${err.message}`, message);
			});

			return;
		}

		if (dbInstance && dbInstance.isActive) {
			await client.reply(from, `Bot "${sessionName}" exists in DB. Reconnecting...`, message);

			const subFlags = { ...JSON.parse(dbInstance.flags || '{}'), ...flags };

			if (IS_PM2) {
				try {
					await startPm2SubBot(sessionName);
					await client.reply(from, `Bot "${sessionName}" started as PM2 process.`, message);
				} catch (err) {
					await client.reply(from, `Failed to start PM2 process for "${sessionName}": ${err.message}`, message);
				}

				return;
			}

			const auth = new Auth(prisma, sessionName);
			const sub = new ClientSocket(auth, {
				role: 'sub',
				flags: subFlags,
				cachedGroupMetadata: (jid) => (isJidGroup(jid) ? configuration.groups.metadata.get(jid) : {})
			});

			manager.add(sessionName, sub);

			const pairNumber = dbInstance.pairNumber || flags.pairNumber || sender.replace(/@s\.whatsapp\.net$/, '');
			let retryCount = 0;

			sub.on('connection.update', async (conn) => {
				const { connection, lastDisconnect } = conn;

				if (connection === 'open') {
					retryCount = 0;
					const phone = sub.socket.user?.id?.split(':')[0] ?? 'unknown';

					await client.reply(from, `Bot "${sessionName}" is online! (${phone})`, message);
					setupSubBot(sub, { sessionName, configuration, flags: subFlags });
				}

				if (connection === 'close') {
					const { Boom } = await import('@hapi/boom');
					const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
					const { DisconnectReason } = await import('baileys');

					if (reason === DisconnectReason.loggedOut || reason === DisconnectReason.badSession) {
						const label = reason === DisconnectReason.loggedOut ? 'logged out' : 'has a bad session';

						await client.reply(from, `Bot "${sessionName}" ${label}. Session cleaned up.`, message);
						manager.remove(sessionName);
						await cleanupSession(sessionName);
						return;
					}

					if (retryCount >= MAX_RETRIES) {
						await client.reply(from, `Bot "${sessionName}" max retries reached. Use !addbot to restart.`, message);
						manager.remove(sessionName);
						return;
					}

					retryCount++;
					await sub.connect({ prisma }).catch(() => {});
				}
			});

			try {
				await sub.connect({ prisma });

				if (sub.needsPairing) {
					await new Promise((resolve) => {
						sub.once('connection.update', () => resolve());
					});

					await new Promise((resolve) => setTimeout(resolve, 5000));

					const code = await sub.requestPairingCode(String(pairNumber).replace(/[^0-9]/g, ''));

					await client.reply(
						from,
						`*${sessionName}* pairing code:\n\n\`${code.slice(0, 4)}-${code.slice(4)}\`\n\nEnter this on the target phone within 60s.`,
						message
					);
				}
			} catch (err) {
				await sub.disconnect().catch(() => {});
				manager.remove(sessionName);
				await client.reply(from, `Failed to reconnect "${sessionName}": ${err.message}`, message);
			}

			return;
		}

		await client.reply(from, `Creating bot "${sessionName}"...`, message);

		const newFlags = { ...flags, pairMode: true };
		const auth = new Auth(prisma, sessionName);
		const sub = new ClientSocket(auth, {
			role: 'sub',
			flags: newFlags,
			cachedGroupMetadata: (jid) => (isJidGroup(jid) ? configuration.groups.metadata.get(jid) : {})
		});

		manager.add(sessionName, sub);

		const pairNumber = flags.pairNumber || flags.pairmode || sender.replace(/@s\.whatsapp\.net$/, '');
		let paired = false;
		let retryCount = 0;

		sub.on('connection.update', async (conn) => {
			const { connection, lastDisconnect } = conn;

			if (connection === 'open' && !paired) {
				paired = true;
				retryCount = 0;
				const phone = sub.socket.user?.id?.split(':')[0] ?? 'unknown';

				await client.reply(from, `Bot "${sessionName}" is online! (${phone})`, message);

				await prisma.botInstance.upsert({
					where: { sessionName },
					update: { flags: JSON.stringify(newFlags), isActive: true },
					create: { sessionName, flags: JSON.stringify(newFlags), role: 'sub', pairNumber: pairNumber || null, isActive: true }
				});

				if (IS_PM2) {
					await sub.disconnect().catch(() => {});
					manager.remove(sessionName);

					try {
						await startPm2SubBot(sessionName);
						await client.reply(from, `Bot "${sessionName}" paired and started as PM2 process.`, message);
					} catch (err) {
						await client.reply(from, `Bot "${sessionName}" paired but PM2 start failed: ${err.message}`, message);
					}

					return;
				}

				setupSubBot(sub, { sessionName, configuration, flags: newFlags });
			}

			if (connection === 'close') {
				const { Boom } = await import('@hapi/boom');
				const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
				const { DisconnectReason } = await import('baileys');

				if (reason === DisconnectReason.loggedOut || reason === DisconnectReason.badSession) {
					const label = reason === DisconnectReason.loggedOut ? 'logged out' : 'has a bad session';

					await client.reply(from, `Bot "${sessionName}" ${label}. Session cleaned up.`, message);
					manager.remove(sessionName);
					await cleanupSession(sessionName);
					return;
				}

				if (retryCount >= MAX_RETRIES) {
					await client.reply(from, `Bot "${sessionName}" max retries reached. Use !addbot to restart.`, message);
					manager.remove(sessionName);
					return;
				}

				retryCount++;
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

			await new Promise((resolve) => setTimeout(resolve, 5000));

			const code = await sub.requestPairingCode(String(pairNumber).replace(/[^0-9]/g, ''));

			await client.reply(
				from,
				`*${sessionName}* pairing code:\n\n\`${code.slice(0, 4)}-${code.slice(4)}\`\n\nEnter this on the target phone within 60s.`,
				message
			);
		} catch (err) {
			await sub.disconnect().catch(() => {});
			manager.remove(sessionName);
			return client.reply(from, `Failed to start "${sessionName}": ${err.message}`, message);
		}
	}
});
