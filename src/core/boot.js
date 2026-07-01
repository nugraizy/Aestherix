import { Browsers, delay, isJidGroup } from 'baileys';
import clip from 'clipboardy';
import fs from 'fs-extra';
import PhoneNumber from 'libphonenumber-js';
import P from 'pino';
import readline from 'readline';

import { startDashboard } from '../../dashboard/server/index.js';
import { refreshDashboardCommandCatalog } from '../../dashboard/server/monitor.js';
import configuration from '../helper/config/connect.js';
import prisma from '../helper/database/prisma.js';
import '../i18n/index.js';
import { loadLocalesFromDB } from '../helper/i18n/index.js';
import { color, loggers } from '../utils/modules/index.js';
import { autoReplyManager } from '../helper/auto-reply.js';
import { pollManager } from '../helper/poll-manager.js';
import { createPollVoteHandler } from '../helper/poll-vote-handler.js';
import { reminderManager } from '../helper/reminder.js';
import { schedulerManager } from '../helper/scheduler.js';
import { moderationAudit } from '../helper/moderation-audit.js';
import { slowModeManager } from '../helper/slowmode.js';
import { templateManager } from '../helper/template.js';
import { initWerewolfHandler } from './handlers/games/werewolf.js';
import { VoipClient } from '../utils/voip/index.js';

import { Auth } from './auth.js';
import { ClientSocket } from './client-socket.js';
import { CommandLoader } from './command-loader.js';
import { refreshPrefixCache } from './context.js';
import { EventHandler } from './event-handler.js';
import { manager } from './manager.js';
import { PluginLoader } from './plugin-loader.js';
import { MqttBridge } from './mqtt.js';
import { IS_PM2, sendToPm2SubBots, startPm2SubBot } from './pm2-helpers.js';
import { Router } from './router.js';
import { cleanupSession } from './session-cleanup.js';
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

		if (!phoneNumber) {
			const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

			phoneNumber = await new Promise((resolve) => {
				const timer = setTimeout(() => {
					rl.close();
					resolve('');
				}, 60000);

				rl.question(color('Enter your phone number: ', 'lilac'), (answer) => {
					clearTimeout(timer);
					rl.close();
					resolve(normalizePairNumber(answer) || '');
				});
			});
		}

		if (!phoneNumber) {
			loggers.error(
				color('No valid phone number provided.', 'red'),
				color('Use --pair_number, set PAIR_NUMBER, or configure main_host_number in settings.json.', 'white')
			);
			return;
		}

		await delay(2000);
	}

	if (!phoneNumber) {
		const { confirm, input, select } = await import('@inquirer/prompts');
		const settings2 = await fs.readJSON(SETTINGS_PATH);
		const defaultNumber = settings2.main_host_number;

		const validDefault = normalizePairNumber(defaultNumber);

		if (validDefault) {
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
				phoneNumber = validDefault;
			}
		}

		if (!phoneNumber) {
			const candidates = [defaultNumber, ...(settings2.team_number || []), ...(settings2.backups_host_numbers || [])].filter(
				(n) => normalizePairNumber(n)
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

	const paired = await new Promise((resolve) => {
		let timeout;

		const onCreds = () => {
			clearTimeout(timeout);
			clientSocket.removeListener('creds.update', onCreds);

			const onClose = (update) => {
				if (update.connection === 'close') {
					clientSocket.removeListener('connection.update', onClose);
					resolve(true);
				}
			};

			clientSocket.on('connection.update', onClose);

			setTimeout(() => {
				clientSocket.removeListener('connection.update', onClose);
				resolve(true);
			}, 10_000);
		};

		timeout = setTimeout(() => {
			clientSocket.removeListener('creds.update', onCreds);
			resolve(false);
		}, 120_000);

		clientSocket.once('creds.update', onCreds);
	});

	if (paired) {
		loggers.info(color('Pairing successful, restarting with Android browser...', 'white'));

		clientSocket.setBrowser(Browsers.android('14'));
		await clientSocket.disconnect();
		await clientSocket.connect();
	}
}

async function onConnected({ clientSocket, commandLoader, router, mqtt, store, webhook, eventHandler }) {
	const settingsPath = SETTINGS_PATH;

	if (!(await fs.pathExists(settingsPath))) {
		const defaultSettings = {
			main_host_number: '',
			backups_host_numbers: [],
			owner_number: '',
			team_number: [],
			main_session: 'aestherix',
			locale: 'id',
			maintenance: false,
			max_group: 20,
			min_members: 20,
			limit: 30,
			prefix: { multi: true, nopref: false, pref: '.', customPrefixes: [] },
			logger_theme: 'catppuccin',
			log_max_size: 5,
			packname: 'Made by Aestherix',
			author: 'Powered by Hidden Finder'
		};

		await fs.writeJSON(settingsPath, defaultSettings, { spaces: '\t' });
		loggers.info(color('Created default settings.json', 'white'));
	}

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

	const pluginLoader = new PluginLoader(configuration);

	await pluginLoader.load();
	router.commands = configuration.registry.commands;
	router.aliases = configuration.registry.aliases;

	syncPrefixToRouter(router);

	await Promise.all([
		refreshPrefixCache(clientSocket).catch((err) =>
			loggers.error(color('Pre-warm refreshPrefixCache failed:', 'red'), color(err?.message || err, 'gray'))
		),
		eventHandler?.messageHandler
			?.preInit?.()
			.catch((err) => loggers.error(color('Pre-warm initHandlers failed:', 'red'), color(err?.message || err, 'gray')))
	]);

	const socket = clientSocket.socket;

	const pollVoteHandler = createPollVoteHandler(socket, store);

	socket.ev.on('commit', async (commitInfo) => await webhook.handleCommitEvent(commitInfo));
	clientSocket.ev.on('poll.update', async (msg) => pollVoteHandler.handlePollUpdate(msg));
	clientSocket.ev.on('messages.update', async (updates) => pollVoteHandler.handleMessagesUpdate(updates));

	socket.ws.on('CB:notification,type:w:gp2', (update) => parseStubtypeUpdate(socket, update));
	socket.ws.on('CB:notification,type:picture', async (update) => await emitProfilePictureUpdate(socket, update));
	socket.ev.on('profile-picture.sync', async ({ image }) => {
		if (IS_PM2) {
			sendToPm2SubBots({
				topic: 'profile-picture',
				data: { image: Buffer.from(image).toString('base64') }
			}).catch(() => {});
		}

		for (const { name, client: sub } of manager.list()) {
			if (sub.state !== 'connected') {
				continue;
			}

			try {
				await sub.updateProfilePicture(sub.user.id, image, 'no_crop');
			} catch (err) {
				sub.logger.error(color('Profile picture sync failed:', 'red'), color(err.message, 'white'));
			}
		}
	});

	initWerewolfHandler(clientSocket, loggers);
	pollManager.init(clientSocket);
	reminderManager.init(clientSocket);
	schedulerManager.init(clientSocket);
	autoReplyManager.init();
	slowModeManager.init();
	moderationAudit.init();
	templateManager.init();
	loadLocalesFromDB().catch(() => {});
	mqtt.setClient(socket);
	mqtt.bindMessageHandler();

	if (!configuration.voip && configuration.flags.enableVoip) {
		try {
			configuration.voip = new VoipClient({ sock: socket });
			await configuration.voip.init();
			loggers.info(color('VoIP stack initialized', 'white'));
		} catch (err) {
			loggers.warning(color('VoIP init failed:', 'red'), color(err?.message || err, 'gray'));
		}
	}

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

	if (IS_PM2) {
		for (const instance of instances) {
			try {
				await startPm2SubBot(instance.sessionName);
				loggers.info(
					color('Sub-bot', 'white'),
					color(instance.sessionName, 'lilac'),
					color('started as PM2 process', 'softGreen')
				);
			} catch (err) {
				loggers.error(color('Sub-bot', 'white'), color(instance.sessionName, 'lilac'), color(err.message, 'red'));
			}
		}

		return;
	}

	const MAX_RETRIES = 5;

	for (const instance of instances) {
		if (manager.has(instance.sessionName)) {
			continue;
		}

		const flags = JSON.parse(instance.flags || '{}');
		const auth = new Auth(prisma, instance.sessionName);
		const sub = new ClientSocket(auth, {
			role: instance.role || 'sub',
			flags,
			browser: Browsers.android('14'),
			cachedGroupMetadata: (jid) => (isJidGroup(jid) ? config.groups.metadata.get(jid) : {}),
			syncFullHistory: true,
			enableAutoSessionRecreation: false,
			enableRecentMessageCache: true
		});

		manager.add(instance.sessionName, sub);

		let retryCount = 0;

		sub.on('connection.update', async ({ connection, lastDisconnect }) => {
			if (connection === 'open') {
				retryCount = 0;
				const phone = sub.socket.user?.id?.split(':')[0] ?? 'unknown';
				const badge = `SUB-${instance.sessionName}`;

				if (config.logMultiplexer) {
					config.logMultiplexer.register(sub.logger, badge);
				}

				sub.logger.info(
					color('Sub-bot', 'white'),
					color(instance.sessionName, 'lilac'),
					color(`(${phone})`, 'purple'),
					color('connected', 'softGreen')
				);

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
			}

			if (connection === 'close') {
				const { Boom } = await import('@hapi/boom');
				const { DisconnectReason } = await import('baileys');
				const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;

				if (reason === DisconnectReason.loggedOut || reason === DisconnectReason.badSession) {
					const label = reason === DisconnectReason.loggedOut ? 'logged out' : 'bad session';

					sub.logger.error(
						color('Sub-bot', 'white'),
						color(instance.sessionName, 'lilac'),
						color(`${label} — cleaning up session`, 'red')
					);

					if (config.logMultiplexer) {
						config.logMultiplexer.unregister(`SUB-${instance.sessionName}`);
					}

					manager.remove(instance.sessionName);
					await cleanupSession(instance.sessionName);
					return;
				}

				if (retryCount >= MAX_RETRIES) {
					sub.logger.error(
						color('Sub-bot', 'white'),
						color(instance.sessionName, 'lilac'),
						color('max retries reached', 'red')
					);

					if (config.logMultiplexer) {
						config.logMultiplexer.unregister(`SUB-${instance.sessionName}`);
					}

					manager.remove(instance.sessionName);
					return;
				}

				retryCount++;
				await sub.connect({ prisma }).catch(() => {});
			}
		});

		sub.connect({ prisma }).catch((err) => {
			sub.logger.error(color('Sub-bot', 'white'), color(instance.sessionName, 'lilac'), color(err.message, 'red'));

			if (config.logMultiplexer) {
				config.logMultiplexer.unregister(`SUB-${instance.sessionName}`);
			}

			manager.remove(instance.sessionName);
		});
	}
}

/**
 * @param {{ cli: import('../types/Core/index.d.ts').Cli; OPTIONS: Record<string, unknown>; store: import('../types/Core/index.d.ts').Store; sessionName: string }} options
 * @returns {Promise<{ clientSocket: import('../types/Core/index.d.ts').ClientSocket; auth: import('../types/Core/index.d.ts').Auth; eventHandler: import('../types/Core/index.d.ts').EventHandler; commandLoader: import('../types/Core/index.d.ts').CommandLoader; router: import('../types/Core/index.d.ts').Router }>}
 */
export async function boot({ cli, OPTIONS, store, sessionName }) {
	if (process.env.SUB_BOT_PROCESS === '1') {
		return null;
	}

	const auth = new Auth(prisma, sessionName);

	await auth.initialize({ logger: P({ level: OPTIONS.debugMode ? 'debug' : 'fatal' }) });

	const needsPairing = OPTIONS.pairMode && !auth.creds.registered && !auth.creds.me?.id;
	const browser = needsPairing ? ['Mac OS', 'Safari', 'Safari 17.0'] : Browsers.android('14');

	const clientSocket = new ClientSocket(auth, {
		role: 'primary',
		flags: OPTIONS,
		browser,
		cachedGroupMetadata: (jid) => (isJidGroup(jid) ? configuration.groups.metadata.get(jid) : {}),
		syncFullHistory: true,
		enableAutoSessionRecreation: true,
		enableRecentMessageCache: true
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

	clientSocket.once('connected', () => {
		onConnected({ clientSocket, commandLoader, router, mqtt, store, webhook, eventHandler });

		if (!OPTIONS.skipSub) {
			spawnPersistedSubBots({ configuration });
		}
	});

	clientSocket.on('contacts.upsert', (contacts) => initContact(store, contacts));
	clientSocket.on('contacts.update', (update) => updateContact(store, update));

	return { clientSocket, auth, eventHandler, commandLoader, router };
}
