import dotenvx from '@dotenvx/dotenvx';
import 'dayjs/locale/id.js';
import './src/helper/prototypes.js';
import './src/i18n/index.js';

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';
import path from 'node:path';
import { platform } from 'node:process';

dotenvx.config({ quiet: true });

process.env.SUB_BOT_PROCESS = '1';

dayjs.locale('id');
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.tz.setDefault('Asia/Jakarta');

const moduleURL = new URL(import.meta.url);

global.__dirname = platform === 'win32' ? path.dirname(moduleURL.pathname).slice(1) : path.dirname(moduleURL.pathname);

import { Boom } from '@hapi/boom';
import { DisconnectReason, isJidGroup } from 'baileys';
import P from 'pino';

import { Auth } from './src/core/auth.js';
import { ClientSocket } from './src/core/client-socket.js';
import { CommandLoader } from './src/core/command-loader.js';
import { EventHandler } from './src/core/event-handler.js';
import { manager } from './src/core/manager.js';
import { Router } from './src/core/router.js';
import { Store } from './src/core/store.js';
import { initContact, updateContact } from './src/core/utils.js';
import configuration from './src/helper/config/connect.js';
import prisma from './src/helper/database/prisma.js';
import { color, loggers } from './src/utils/modules/index.js';

color.setTheme(configuration.logger_theme || 'dracula');

const sessionName = process.argv[2];

if (!sessionName) {
	loggers.error(color('Usage: node subbot.js <session_name>', 'red'));
	process.exit(1);
}

loggers.setSessionBadge(`SUB-${sessionName}`);

const instance = await prisma.botInstance.findUnique({ where: { sessionName } }).catch(() => null);

if (!instance) {
	loggers.error(color(`Bot instance "${sessionName}" not found in database.`, 'red'));
	process.exit(1);
}

if (!instance.isActive) {
	loggers.error(color(`Bot instance "${sessionName}" is disabled.`, 'red'));
	process.exit(1);
}

const flags = JSON.parse(instance.flags || '{}');

configuration.flags = { ...flags, noSub: true };

const store = new Store(prisma, sessionName, {
	logger: P().child({ level: 'fatal', stream: 'store' })
});

store.initialize();

const auth = new Auth(prisma, sessionName);

await auth.initialize({ logger: P({ level: 'fatal' }) });

const clientSocket = new ClientSocket(auth, {
	role: 'sub',
	flags,
	cachedGroupMetadata: (jid) => (isJidGroup(jid) ? configuration.groups.metadata.get(jid) : {})
});

manager.add(sessionName, clientSocket);

const commandLoader = new CommandLoader({
	commands: configuration.registry.commands,
	aliases: configuration.registry.aliases
});

const router = new Router(clientSocket, {
	commands: configuration.registry.commands,
	aliases: configuration.registry.aliases,
	prefix: flags.prefix || configuration.prefix.default,
	prefixMode: configuration.prefix.mode,
	prefixReg: configuration.prefix.regex
});

const eventHandler = new EventHandler(clientSocket, {
	router,
	store,
	configuration,
	options: { flags }
});

eventHandler.bind();

clientSocket.on('contacts.upsert', (contacts) => initContact(store, contacts));
clientSocket.on('contacts.update', (update) => updateContact(store, update));

const MAX_RETRIES = 5;
let retryCount = 0;

const REASON_NAMES = {
	[DisconnectReason.badSession]: 'badSession',
	[DisconnectReason.loggedOut]: 'loggedOut',
	[DisconnectReason.restartRequired]: 'restartRequired',
	[DisconnectReason.timedOut]: 'timedOut',
	[DisconnectReason.connectionClosed]: 'connectionClosed',
	[DisconnectReason.connectionReplaced]: 'connectionReplaced',
	[DisconnectReason.connectionLost]: 'connectionLost'
};

clientSocket.on('connection.update', async ({ connection, lastDisconnect }) => {
	if (connection === 'open') {
		retryCount = 0;

		if (!commandLoader.ready) {
			await commandLoader.load(flags);
			router.commands = commandLoader.commands;
			router.aliases = commandLoader.aliases;
		}

		const phone = clientSocket.socket.user?.id?.split(':')[0] ?? 'unknown';

		loggers.info(
			color('Sub-bot', 'white'),
			color(sessionName, 'lilac'),
			color(`(${phone})`, 'purple'),
			color('connected', 'softGreen')
		);

		clientSocket.emit('connected');
	}

	if (connection === 'close') {
		const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
		const reasonName = REASON_NAMES[reason] || `unknown(${reason})`;

		loggers.warning(
			color('Sub-bot', 'white'),
			color(sessionName, 'lilac'),
			color('disconnected:', 'orange'),
			color(reasonName, 'white')
		);

		if (reason === DisconnectReason.loggedOut || reason === DisconnectReason.badSession) {
			const label = reason === DisconnectReason.loggedOut ? 'logged out' : 'bad session';

			loggers.error(color('Sub-bot', 'white'), color(sessionName, 'lilac'), color(`${label} - exiting`, 'red'));
			process.exit(1);
		}

		if (reason === DisconnectReason.connectionReplaced) {
			loggers.error(color('Sub-bot', 'white'), color(sessionName, 'lilac'), color('connection replaced - exiting', 'red'));
			process.exit(1);
		}

		if (retryCount >= MAX_RETRIES) {
			loggers.error(color('Sub-bot', 'white'), color(sessionName, 'lilac'), color('max retries reached - exiting', 'red'));
			process.exit(1);
		}

		retryCount++;
		loggers.warning(
			color('Sub-bot', 'white'),
			color(sessionName, 'lilac'),
			color(`reconnect attempt ${retryCount}/${MAX_RETRIES}`, 'white')
		);
		await new Promise((r) => setTimeout(r, 5000));
		await clientSocket.connect({ prisma }).catch((err) => {
			loggers.error(
				color('Sub-bot', 'white'),
				color(sessionName, 'lilac'),
				color('reconnect failed:', 'red'),
				color(err.message, 'white')
			);
		});
	}
});

process.on('message', async (msg) => {
	if (msg.topic === 'profile-picture' && msg.data?.image) {
		try {
			const buffer = Buffer.from(msg.data.image, 'base64');

			await clientSocket.updateProfilePicture(clientSocket.user.id, buffer, 'no_crop');
		} catch (err) {
			loggers.error(color('Profile picture sync failed:', 'red'), color(err.message, 'white'));
		}
	}
});

process.on('unhandledRejection', (reason) => {
	const err = reason instanceof Error ? reason : new Error(String(reason));

	loggers.error(color('Unhandled promise rejection:', 'red'), err);
});

process.on('uncaughtException', (error) => {
	loggers.error(color('Uncaught exception:', 'red'), error);
	process.exit(1);
});

try {
	await clientSocket.connect({ prisma });
} catch (err) {
	loggers.error(color(`Failed to start sub-bot "${sessionName}":`, 'red'), color(err.message, 'white'));
	process.exit(1);
}
