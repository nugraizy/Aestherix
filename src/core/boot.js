import { delay, isJidGroup } from 'baileys';
import clip from 'clipboardy';
import fs from 'fs-extra';
import PhoneNumber from 'libphonenumber-js';
import readline from 'readline';

import { startDashboard } from '../../dashboard/server/index.js';
import { refreshDashboardCommandCatalog } from '../../dashboard/server/monitor.js';
import configuration from '../helper/config/connect.js';
import prisma from '../helper/database/prisma.js';
import { color, loggers } from '../utils/modules/index.js';
import { initWerewolfHandler } from './handlers/games/werewolf.js';

import { Auth } from './auth.js';
import { ClientSocket } from './client-socket.js';
import { CommandLoader } from './command-loader.js';
import { refreshPrefixCache } from './context.js';
import { EventHandler } from './event-handler.js';
import { manager } from './manager.js';
import { MqttBridge } from './mqtt.js';
import { Router } from './router.js';
import { initContact, updateContact } from './utils.js';
import { WebhookServer } from './webhook.js';

const ENABLE_EMBEDDED_DASHBOARD = String(process.env.DASHBOARD_EMBEDDED || '1') !== '0';
const DASHBOARD_CATALOG_INTERVAL_MS = 30_000;
const PAIR_NUMBER_ENV = 'PAIR_NUMBER';
const SETTINGS_PATH = './src/helper/config/settings.json';

function syncPrefixToRouter(router) {
	const { mode: prefixMode, regex: prefixReg, default: prf } = configuration.prefix;

	router.updatePrefix({
		mode: prefixMode || 'single',
		value: prf || '.',
		regex: prefixReg || null
	});
}

async function handlePollUpdate(socket, store, msg) {
	const { getAggregateVotesInPollMessage, getKeyAuthor, jidNormalizedUser } = await import('baileys');
	const pollKey = msg?.pollUpdateMessage?.pollCreationMessageKey;
	const originalPoll = await store.loadMessage(pollKey.remoteJid, pollKey.id);

	if (!originalPoll) {
		return;
	}

	const botJid = socket?.user?.id;

	if (!botJid) {
		return;
	}

	const meIdNormalized = jidNormalizedUser(botJid);
	const pollCreatorJid = getKeyAuthor(pollKey, meIdNormalized);
	const voterJid = getKeyAuthor(msg.msg.key, meIdNormalized);
	const pollEncKey = originalPoll.message.messageContextInfo?.messageSecret;

	const voteMsg = msg.func.decrypt(
		msg.pollUpdateMessage.vote.encPayload,
		msg.pollUpdateMessage.vote.encIv,
		pollEncKey,
		pollCreatorJid,
		pollKey.id,
		voterJid
	);

	getAggregateVotesInPollMessage(
		{
			pollUpdates: [{ vote: voteMsg, pollUpdateMessageKey: msg.msg.key, senderTimestampMs: msg.msg.messageTimestamp }],
			message: originalPoll.message
		},
		botJid
	);
}

async function parseStubtypeUpdate(client, update) {
	const { processSettingsStubtype } = await import('./handlers/notification-utils.js');

	await processSettingsStubtype(client, update);
}

async function emitProfilePictureUpdate(socket, update) {
	const from = update?.attrs?.from || update?.content?.[0]?.attrs?.author;
	const name = update?.attrs?.notify;
	const action = update?.content?.[0]?.tag;
	const participant = update?.content?.[0]?.attrs?.author || '';
	const content = action === 'delete' ? null : await socket.profilePictureUrl(from, 'image').catch(() => null);

	const object = {
		id: from,
		name,
		content,
		action,
		author: isJidGroup(from) ? participant : ''
	};

	socket.ev.emit('profile-picture.update', object);

	if (isJidGroup(from)) {
		socket.ev.emit('groups', [object]);
	}
}

function normalizePairNumber(value) {
	const normalized =
		'+' +
		String(value || '')
			.trim()
			.replace(/[^0-9]/g, '');
	const numberFormat = PhoneNumber(normalized);

	return numberFormat?.isValid() ? normalized.replace(/[^0-9]/g, '') : null;
}

async function handlePairing(clientSocket, flags) {
	if (!clientSocket.needsPairing) {
		return;
	}

	const settings = await fs.readJSON(SETTINGS_PATH);
	let phoneNumber = '';

	const nonInteractive = flags.pairNumber || process.env[PAIR_NUMBER_ENV];

	if (nonInteractive) {
		phoneNumber = normalizePairNumber(nonInteractive) || '';

		if (!phoneNumber) {
			loggers.error(color('Invalid pairing number.', 'red'), color('Provide a valid E.164 number.', 'white'));
			return;
		}
	}

	if (!phoneNumber && !process.stdin?.isTTY) {
		phoneNumber = normalizePairNumber(settings?.main_host_number) || '';

		if (phoneNumber) {
			await delay(2000);
		} else {
			loggers.error(
				color('Pairing requires a TTY.', 'red'),
				color('Use --pair_number, set PAIR_NUMBER, or configure main_host_number.', 'white')
			);
			return;
		}
	}

	if (!phoneNumber) {
		const { confirm, input, select } = await import('@inquirer/prompts');
		const settings2 = await fs.readJSON(SETTINGS_PATH);
		const defaultNumber = settings2.main_host_number;

		if (defaultNumber) {
			const useDefault = await confirm(
				{
					message: loggers.info(color(`Use default number (${defaultNumber})?`, 'lilac'), { ignore: true }).trim(),
					default: true,
					theme: { prefix: '✦' }
				},
				{ signal: AbortSignal.timeout(60000) }
			).catch(() => {
				process.exit(0);
			});

			if (useDefault) {
				phoneNumber = normalizePairNumber(defaultNumber) || '';
			}
		}

		if (!phoneNumber) {
			const candidates = [defaultNumber, ...(settings2.team_number || []), ...(settings2.backups_host_numbers || [])].filter(
				Boolean
			);

			if (candidates.length) {
				const choices = [
					...candidates.map((num) => ({ name: num, value: num })),
					{ name: 'Enter a new number', value: '__new__' }
				];

				const selected = await select(
					{
						message: loggers.info(color('Select number to pair', 'lilac'), color(':', 'white'), { ignore: true }).trim(),
						choices,
						theme: { prefix: '✦' }
					},
					{ signal: AbortSignal.timeout(60000) }
				).catch(() => {
					process.exit(0);
				});

				if (selected !== '__new__') {
					phoneNumber = normalizePairNumber(selected) || '';
				}
			}

			if (!phoneNumber) {
				const answer = await input(
					{
						message: loggers.info(color('Insert your phone number', 'lilac'), color(':', 'white'), { ignore: true }).trim(),
						required: true,
						theme: { prefix: '✦' }
					},
					{ signal: AbortSignal.timeout(60000) }
				).catch(() => {
					process.exit(0);
				});

				phoneNumber = normalizePairNumber(answer) || '';
			}
		}

		if (!phoneNumber) {
			loggers.error(color('Invalid phone number.', 'red'));
			return;
		}
	}

	const code = await clientSocket.requestPairingCode(phoneNumber.trim());

	loggers.info(color('Pairing code :', 'lilac'), color(code.splitString({ length: 4 }), 'white'));
	await delay(200);
	await clip
		.write(code)
		.then(() => loggers.info(color('Pairing code has been copied to clipboard!', 'white')))
		.catch(() => loggers.error(color('SSH detected.', 'red'), color('Could not copy the code.', 'gray')));
	await delay(200);
	loggers.warning(color('Waiting for code input', 'white'), color('. . .', 'pink'));
}

async function onConnected({ clientSocket, commandLoader, router, mqtt, store, webhook, eventHandler }) {
	webhook.setClient(clientSocket.socket);
	webhook.start();

	if (ENABLE_EMBEDDED_DASHBOARD) {
		startDashboard();
	} else {
		const { solverManager } = await import('../utils/modules/solver-manager.js');
		const dashboardUrl = process.env.DASHBOARD_URL || `http://localhost:${process.env.DASHBOARD_PORT || 4000}`;
		const bridgeToken = process.env.DASHBOARD_BRIDGE_TOKEN || '';

		solverManager.setRemoteDashboard(dashboardUrl, bridgeToken);
	}

	refreshDashboardCommandCatalog(configuration);
	setInterval(() => refreshDashboardCommandCatalog(configuration), DASHBOARD_CATALOG_INTERVAL_MS);

	if (!commandLoader.ready) {
		await commandLoader.load(configuration.flags);
		router.commands = commandLoader.commands;
		router.aliases = commandLoader.aliases;
		configuration.registry.commands = commandLoader.commands;
		configuration.registry.aliases = commandLoader.aliases;
	}

	syncPrefixToRouter(router);

	Promise.all([
		refreshPrefixCache(clientSocket).catch((err) =>
			loggers.error(color('Pre-warm refreshPrefixCache failed:', 'red'), color(err?.message || err, 'gray'))
		),
		eventHandler?.messageHandler
			?.preInit?.()
			.catch((err) => loggers.error(color('Pre-warm initHandlers failed:', 'red'), color(err?.message || err, 'gray')))
	]);

	const socket = clientSocket.socket;

	socket.ev.on('commit', async (commitInfo) => await webhook.handleCommitEvent(commitInfo));
	socket.ev.on('poll.update', async (msg) => handlePollUpdate(socket, store, msg));
	socket.ws.on('CB:notification,type:w:gp2', (update) => parseStubtypeUpdate(socket, update));
	socket.ws.on('CB:notification,type:picture', async (update) => await emitProfilePictureUpdate(socket, update));

	initWerewolfHandler(clientSocket, loggers);
	mqtt.setClient(socket);
	mqtt.bindMessageHandler();

	if (configuration.flags.watch) {
		commandLoader.watch();
		commandLoader.on('added', ({ name, file }) =>
			loggers.info(color('Command added:', 'white'), color(name, 'lilac'), color('⇢ ', 'green'), color(file, 'gray'))
		);

		let lastChange = { name: null, file: null, count: 0, marker: null };
		const origWrite = process.stdout.write.bind(process.stdout);
		let writeCounter = 0;

		process.stdout.write = (chunk, ...rest) => {
			writeCounter++;
			return origWrite(chunk, ...rest);
		};

		commandLoader.on('changed', ({ name, file }) => {
			const isContinuation = lastChange.name === name && lastChange.file === file && writeCounter === lastChange.marker;

			if (isContinuation) {
				lastChange.count++;
				readline.moveCursor(process.stdout, 0, -1);
				readline.clearLine(process.stdout, 0);
				readline.cursorTo(process.stdout, 0);
				loggers.info(
					color('Command changed:', 'white'),
					color(name, 'lilac'),
					color('⇢ ', 'green'),
					color(file, 'gray'),
					color(`(×${lastChange.count})`, 'glowYellow')
				);
			} else {
				lastChange = { name, file, count: 1, marker: 0 };
				loggers.info(color('Command changed:', 'white'), color(name, 'lilac'), color('⇢ ', 'green'), color(file, 'gray'));
			}

			lastChange.marker = writeCounter;
		});
		commandLoader.on('removed', ({ name }) => loggers.warning(color('Command removed:', 'white'), color(name, 'lilac')));
		commandLoader.on('error', ({ file, reason }) => loggers.error(color(file, 'purple'), color(reason, 'red')));
	}
}

async function spawnPersistedSubBots({ configuration: config }) {
	const instances = await prisma.botInstance.findMany({ where: { isActive: true } }).catch(() => []);

	for (const instance of instances) {
		if (manager.has(instance.sessionName)) {
			continue;
		}

		const flags = JSON.parse(instance.flags || '{}');
		const auth = new Auth(prisma, instance.sessionName);
		const sub = new ClientSocket(auth, {
			role: instance.role || 'sub',
			flags,
			cachedGroupMetadata: (jid) => (isJidGroup(jid) ? config.cache.metadata.get(jid) : {})
		});

		manager.add(instance.sessionName, sub);

		sub.on('connection.update', ({ connection }) => {
			if (connection === 'open') {
				const phone = sub.socket.user?.id?.split(':')[0] ?? 'unknown';

				loggers.info(
					color('Sub-bot', 'white'),
					color(instance.sessionName, 'lilac'),
					color(`(${phone})`, 'purple'),
					color('connected', 'softGreen')
				);

				const subRouter = new Router(sub, { commands: config.cmds.commands, aliases: config.cmds.aliases });
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
			}
		});

		sub.connect({ prisma }).catch((err) => {
			loggers.error(color('Sub-bot', 'white'), color(instance.sessionName, 'lilac'), color(err.message, 'red'));
			manager.remove(instance.sessionName);
		});
	}
}

/**
 * @param {{ cli: import('../types/Core/index.d.ts').Cli; OPTIONS: Record<string, unknown>; store: import('../types/Core/index.d.ts').Store; sessionName: string }} options
 * @returns {Promise<{ clientSocket: import('../types/Core/index.d.ts').ClientSocket; auth: import('../types/Core/index.d.ts').Auth; eventHandler: import('../types/Core/index.d.ts').EventHandler; commandLoader: import('../types/Core/index.d.ts').CommandLoader; router: import('../types/Core/index.d.ts').Router }>}
 */
export async function boot({ cli, OPTIONS, store, sessionName }) {
	const auth = new Auth(prisma, sessionName);

	const clientSocket = new ClientSocket(auth, {
		role: 'primary',
		flags: OPTIONS,
		cachedGroupMetadata: (jid) => (isJidGroup(jid) ? configuration.groups.metadata.get(jid) : {})
	});

	await clientSocket.connect({ store });

	manager.add(sessionName, clientSocket);
	configuration.core = { sessionName, manager };

	await handlePairing(clientSocket, OPTIONS);

	const mqtt = new MqttBridge();

	mqtt.connect();

	const webhook = new WebhookServer();
	const commandLoader = new CommandLoader({
		commands: configuration.registry.commands,
		aliases: configuration.registry.aliases
	});
	const router = new Router(clientSocket, {
		commands: configuration.registry.commands,
		aliases: configuration.registry.aliases,
		prefix: configuration.prefix.default,
		prefixMode: configuration.prefix.mode,
		prefixReg: configuration.prefix.regex
	});

	configuration.router = router;

	const eventHandler = new EventHandler(clientSocket, {
		router,
		store,
		configuration,
		options: {
			flags: OPTIONS,
			cli
		}
	});

	eventHandler.bind();

	clientSocket.on('connected', () => {
		onConnected({ clientSocket, commandLoader, router, mqtt, store, webhook, eventHandler });
		spawnPersistedSubBots({ configuration });
	});

	clientSocket.on('contacts.upsert', (contacts) => initContact(store, contacts));
	clientSocket.on('contacts.update', (update) => updateContact(store, update));

	return { clientSocket, auth, eventHandler, commandLoader, router };
}
