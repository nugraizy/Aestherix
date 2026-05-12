import { Boom } from '@hapi/boom';
import { DisconnectReason, getAggregateVotesInPollMessage, getKeyAuthor, isJidGroup, jidNormalizedUser } from 'baileys';
import fs from 'fs-extra';
import readline from 'readline';

import { startingConnection } from '../../../helper/connection/utils/check-flag.js';
import { color, delay, loggers } from '../../../utils/modules/index.js';
import { cmdId } from '../../../helper/modules/prefix.js';
import configuration from '../../config/connect.js';
import { Cache } from '../../modules/cache.js';
import { resetSession } from '../socket/reset-session.js';
import { loadCommands } from '../utils/commands.js';
import { connectMqtt } from '../utils/mqtt.js';

const retryCount = new Cache();

retryCount.set('count', 0);

let rl = null;
let started = startingConnection;
const newStart = () => (started = Date.now());

let isClosed = false;
let shouldWait = false;
const handler = new Cache();
const HANDLER_PATH = {
	INCOMING: '../../../handlers/messages_event/incoming-message.js',
	DELETED: '../../../handlers/messages_event/deleted-message.js',
	COMPOSING: '../../../handlers/message_presence/composing.js',
	PARTICIPANT: '../../../handlers/notification_handlers/group-participants-notification.js',
	GROUPSETTINGS: '../../../handlers/notification_handlers/group-settings-notification.js',
	PARSE_STUBTYPE: '../../../handlers/notification_handlers/utils.js'
};

let shouldPrintBanner = true;

/**
 *
 * @typedef {import('../../../types/Socket/index.js').ClientSocket} Client
 * @typedef {import('../../../types/Socket/index.js').ConnectionStates['lastDisconnect']} LastDisconnect
 * @typedef {import('../../../types/Socket/index.js').WAConnectionStates} Connection
 * @param {Client} Client
 * @param {{lastDisconnect: LastDisconnect, connection: Connection, receivedPendingNotifications: boolean, clientMqttListen: import('mqtt').Client, OPTIONS: {[_: string]: boolean}, cli: import('../socket/socket.js').Cli, state: import('./../../../types/Socket/index.js').SingleAuthState['state'], runtime: number}} param1
 */
export const handleConnectionUpdate = async (
	Client,
	{ lastDisconnect, connection, receivedPendingNotifications, clientMqttListen, OPTIONS, cli, state, runtime }
) => {
	try {
		if (connection === 'close') {
			const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;

			if (reason === DisconnectReason.badSession) {
				loggers.error(color('Bad session', 'white'), color('Please delete your previous session and do a rescan...', 'lilac'));
				await resetSession(cli);
				process.exit(0);
			} else if (reason === DisconnectReason.loggedOut) {
				loggers.error(color('Logged out', 'white'), color('Please delete your previous session and do a rescan...', 'lilac'));
				await resetSession(cli);
				process.exit(0);
			} else {
				if (reason === DisconnectReason.restartRequired) {
					loggers.warning(color('Restart required', 'white'), color('Restarting your Socket...', 'lilac'));
				}

				const reconnectableReasons = [
					{ code: DisconnectReason.timedOut, label: 'Timed out' },
					{ code: DisconnectReason.connectionClosed, label: 'Connection closed' },
					{ code: DisconnectReason.connectionReplaced, label: 'Connection replaced' },
					{ code: DisconnectReason.connectionLost, label: 'Connection lost' },
					{ code: undefined, label: 'Unknown reason' }
				];
				const foundReason =
					reconnectableReasons.find((r) => r.code === reason) || reconnectableReasons[reconnectableReasons.length - 1];

				if (reconnectableReasons.some((r) => r.code === reason)) {
					const count = retryCount.get('count') || 0;
					const maxRetries = 5;
					const interval = 5000;

					if (count >= maxRetries) {
						loggers.error(
							color(`${foundReason.label ? `[${foundReason.label}] ` : ''}Max retry attempts reached`, 'white'),
							color('Please try again later...', 'lilac')
						);
						await shutdownServers();
					}

					loggers.warning(
						color(
							`${foundReason.label ? `[${foundReason.label}] ` : ''}Reconnect attempt ${count} failed. Retrying in ${interval / 1000} seconds...`,
							'white'
						)
					);

					await delay(interval);

					retryCount.set('count', count + 1);

					newStart();
					connectMqtt(clientMqttListen, true);
					await (await import('../../../index.js')).start();
				} else {
					loggers.warning(color('Unknown reason', 'white'), color('Quick reconnecting...', 'lilac'));
					newStart();
					connectMqtt(clientMqttListen, true);
					await (await import('../../../index.js')).start();
				}
			}
		} else if (connection === 'open') {
			if (!isClosed) {
				await (configuration.cmds.loadPromise || loadCommands(OPTIONS));

				isClosed = true;
			}

			configuration.isFirstConnectionForCache = true;

			if (receivedPendingNotifications) {
				shouldWait = true;
			}

			if (!receivedPendingNotifications && shouldWait) {
				shouldWait = false;
			}

			if (!receivedPendingNotifications && !shouldWait) {
				/**
				 * @typedef {string} instance
				 * @type {instance}
				 */
				const instance = Client.user.id;

				global.client = {};
				global.instance = instance;

				client.instance = Client;

				(await import('../../modules/utils.js')).assign(client);

				if (shouldPrintBanner) {
					loggers.info(color('Socket connected', 'white'), color('Successfully', 'lilac') + color('.', 'white'));
					shouldPrintBanner = false;
				}

				const builder = new client.instance.TemplateBuilder.Native();
				const timeToConnect = (Date.now() - started) / 1000;
				const data = await fs.readJSON('./src/helper/config/settings.json');
				const buttons = [];
				let capt = '';

				const getPlatform = (platform) => {
					return platform === 'iphone'
						? 'iPhone'
						: platform === 'android'
							? 'Android'
							: platform === 'smbi'
								? 'iPhone Business'
								: 'Android Business';
				};

				loggers.info(
					color('Device Platform', 'white'),
					color(`${getPlatform(client.instance.authState.creds.platform)}`, '#E4C1F9')
				);

				loggers.info(
					color('Connection time', 'white'),
					color(`${timeToConnect}s`, 'lilac'),
					color(timeToConnect < data.best_time ? 'is the best time' : 'is not the best time', 'white'),
					color('(', 'lilac') + color(`${data.best_time}s`, 'glowYellow') + color(')', '#E4C1F9')
				);

				retryCount.set('counter', 0);

				if (timeToConnect < data.best_time) {
					const bestTime = data.best_time;
					data.best_time = timeToConnect; // eslint-disable-line

					await fs.writeJSON('./src/helper/config/settings.json', data, { spaces: 2 });
					buttons.push(
						builder.button.url({
							display: `Fastest Now ${timeToConnect}s 🎉`,
							url: 'hello'
						})
					);
					buttons.push(
						builder.button.url({
							display: `Previous Best Time ${bestTime}s`,
							url: 'hello'
						})
					);

					capt += 'New Best!';
				} else {
					buttons.push(
						builder.button.url({
							display: `Time Now ${timeToConnect}s`,
							url: 'hello'
						})
					);
					buttons.push(
						builder.button.url({
							display: `Best Time ${data.best_time}s`,
							url: 'hello'
						})
					);

					capt += 'Not the Best.';
				}

				buttons.push(
					builder.button.reply({
						display: 'Ping Bot',
						id: cmdId('ping')
					})
				);

				await builder
					.destination(configuration.cache.ownerNumbers[0])
					.body('Bot is connected to socket.')
					.footer(capt)
					.buttons(...buttons.filter(Boolean))
					.send();

				Client.ev.emit('connected');
				connectMqtt(clientMqttListen);

				if (configuration.OPTIONS.test && !rl) {
					rl = readline.createInterface({
						input: process.stdin,
						output: process.stdout
					});

					rl.on('line', async (line) => {
						if (line === 'exit') {
							await handleShutdown('manual');
							return;
						}

						// eslint-disable-next-line
						handleUpsertUpdate(
							store,
							{
								test: true,
								message: line
							},
							state,
							runtime
						);
					});
				}
			}
		}
	} catch (error) {
		console.log(error);
		connectMqtt(clientMqttListen, true);
		await (await import('../../../index.js')).start();
	}
};

/**
 * @param {import('../type.js').Store} store
 * @param {import('baileys').proto.IWebMessageInfo[]} message
 * @param {import('../type.js').SingleAuthState['state']} state
 * @param {number} runtime
 */
export const handleUpsertUpdate = async (store, message, state, runtime) => {
	if (!handler.has('INCOMING')) {
		handler.set('INCOMING', (await import(HANDLER_PATH.INCOMING)).default);
	}

	await handler.get('INCOMING')(message, client, configuration.cmds, store, configuration.user, state, runtime);
};

/**
 * @param {import('../type.js').Store} store
 * @param {import('baileys').WAMessageUpdate[]} message
 */
export const handleMessagesUpdate = async (store, message) => {
	if (message?.[0]?.update?.status === 4 || message?.[0]?.update?.status === 3) {
		return;
	}

	message = store.messages[message[0].key.remoteJid]?.get(message[0].key.id);

	if (!handler.has('DELETED')) {
		handler.set('DELETED', (await import(HANDLER_PATH.DELETED)).default);
	}

	await handler.get('DELETED')(client, message, false, store);
};

/**
 * @param {{ id: string, presences: { [participant: string]: import('baileys').PresenceData } }} presence
 */
export const handlePresenceUpdate = async (presence) => {
	const from = presence.id;
	const participant = Object.keys(presence.presences)[0];
	const presences = presence.presences[participant].lastKnownPresence;

	if (presences === 'composing') {
		if (!handler.has('COMPOSING')) {
			handler.set('COMPOSING', (await import(HANDLER_PATH.COMPOSING)).default);
		}

		await handler.get('COMPOSING')(client, from, participant);
	}
};

/**
 * @param {(string | undefined)} isGroup
 * @param {import('baileys').WACallUpdateType} status
 * @param {string} id
 * @param {string} from
 * @param {{[_: string]: boolean}} OPTIONS
 */
export const handleCallUpdate = async (isGroup, status, id, from, OPTIONS) => {
	if (OPTIONS.noCall && !isGroup && status === 'offer') {
		const meJid = client.instance.decodeJid(instance);

		await client.instance.sendNode({
			tag: 'call',
			attrs: {
				from: meJid,
				to: from,
				id: client.instance.generateMessageTag()
			},
			content: [
				{
					tag: 'reject',
					attrs: {
						'call-id': id,
						'call-creator': from,
						count: '512202'
					},
					content: null
				}
			]
		});
		await client.instance.updateBlockStatus(from, 'block');
	}
};

/**
 * @param {import('../type.js').Store} store
 * @param {import('baileys').proto.IWebMessageInfo[]} message
 */
export const handleParticipantsUpdate = async (update) => {
	if (!handler.has('PARTICIPANT')) {
		handler.set('PARTICIPANT', (await import(HANDLER_PATH.PARTICIPANT)).default);
	}

	await handler.get('PARTICIPANT')(client, update);
};

export const handleGroupSettingsUpdate = async (update) => {
	if (!handler.has('GROUPSETTINGS')) {
		handler.set('GROUPSETTINGS', (await import(HANDLER_PATH.GROUPSETTINGS)).default);
	}

	await handler.get('GROUPSETTINGS')(client, update);
};

export const parseStubtypeUpdate = async (update) => {
	if (!handler.has('PARSE_STUBTYPE')) {
		handler.set('PARSE_STUBTYPE', (await import(HANDLER_PATH.PARSE_STUBTYPE)).processSettingsStubtype);
	}

	await handler.get('PARSE_STUBTYPE')(update);
};

export const handleWerewolfCycle = async (update) => {
	if (update.time === 'day') {
		await client.instance.send(update.id, { text: update.gameDialogue, mentions: update.peopleKilledMention });
	} else if (update.time === 'evening') {
		await client.instance.send(update.id, {
			text: update.gameDialogue
		});

		for (const id of update.playersData.filter((v) => !v.isAlive)) {
			client.instance.send(id.id, {
				text: 'Karena kamu sudah mati, maka kamu hanya bisa menonton permainan saja'
			});
		}

		for (const id of update.playersData.filter((v) => v.isAlive)) {
			client.instance.send(id.id, {
				title: 'Pilih salah satu dari pemain berikut untuk divoting',
				footer: `Made by ${__botName}. Powered by Hidden Finder`,
				text: '\t',
				buttonText: 'Open List',
				sections: update.playersData
					.filter((v) => v.isAlive)
					.map((v) => ({
						rows: [{ title: `VOTE ${v.name}`, rowId: cmdId('ww', `vote ${v.id} ${update.id}`) }],
						title: `${__botName} | Werewolf Games`
					}))
			});
		}
	} else if (update.time === 'voting') {
		await client.instance.send(update.id, { text: update.gameDialogue, mentions: [update?.voteData?.voted] });

		if (update.isWinning) {
			return await client.instance.send(update.id, { text: update.gameDialogue, mentions: update?.peopleMention });
		}

		await client.instance.send(update.id, {
			text: `Statistic Pemain :

Pemain : ${update.playersData.filter((v) => v.isAlive).length}/${update.playersData.length}

${update.playersData
	.map((v) => {
		return v.isAlive ? `@${v.id.split('@')[0]} : 😄 Hidup` : `@${v.id.split('@')[0]} : 💀 Mati | ${v.role}`;
	})
	.join('\n')}`,
			mentions: update.playersData.map((v) => v.id)
		});
	} else if (update.time === 'dawn') {
		await client.instance.send(update.id, { text: update.gameDialogue.replace('{0}', update.gameTime) });

		for (const { id, role, isAlive } of update.playersData) {
			if (isAlive) {
				if (role === 'werewolf') {
					await client.instance.send(id, {
						buttonText: 'Open list',
						footer: `Made by ${__botName}. Powered by Hidden Finder`,
						title:
							'Kamu adalah Serigala. Dan saat ini merupakan waktu yang tepat untuk membunuh seseorang.\nPilih salah satu player.',
						text: '\t',
						sections: update.playersData
							.filter((v) => v.isAlive)
							.map((v) => {
								return {
									rows: [{ title: `KILL ${v.name}`, rowId: cmdId('ww', `kill ${v.id} ${update.id}`) }],
									title: `${__botName} | Werewolf Games`
								};
							})
					});
				} else if (role === 'seer') {
					await client.instance.send(id, {
						buttonText: 'Open list',
						footer: `Made by ${__botName}. Powered by Hidden Finder`,
						text: '\t',
						title:
							'Kamu adalah Penerawang. Dan saat ini merupakan waktu yang tepat untuk menerawang seseorang.\nPilih salah satu player.',
						sections: update.playersData
							.filter((v) => v.isAlive)
							.map((v, i) => {
								return {
									rows: [
										{
											title: `TERAWANG ${update.playersData[i].name}`,
											rowId: cmdId('ww', `seer ${update.playersData[i].id} ${update.id}`)
										}
									],
									title: `${__botName} | Werewolf Games`
								};
							})
					});
				} else if (role === 'guard') {
					await client.instance.send(id, {
						buttonText: 'Open list',
						title:
							'Kamu adalah Penjaga. Dan saat ini merupakan waktu yang tepat untuk memjaga seseorang.\nPilih salah satu player.',
						footer: `Made by ${__botName}. Powered by Hidden Finder`,
						text: '\t',
						sections: update.playersData
							.filter((v) => v.isAlive)
							.map((v, i) => {
								return {
									rows: [
										{
											title: `JAGA ${update.playersData[i].name}`,
											rowId: cmdId('ww', `guard ${update.playersData[i].id} ${update.id}`)
										}
									],
									title: `${__botName} | Werewolf Games`
								};
							})
					});
				} else if (role === 'villager') {
					await client.instance.send(id, {
						text: 'Kamu adalah Penduduk. Tunggu sampai pagi. Saat ini hanya pemain malam yang beraksi'
					});
				}
			}
		}
	} else if (update.time === 'night') {
		await client.instance.send(update.id, { text: 'Aktifitas pemain malam dihentikan karena sudah mau pagi.' });
	} else if (update.time === 'failAfk') {
		await client.instance.send(update.id, { text: update.message, mentions: update.playersData.map((v) => v.id) });
	} else if (update.time === 'voted') {
		await client.instance.send(update.id, { text: update.text, mentions: update.mentions });
	}
};

const getMessage = (key, store) => store.loadMessage(key.remoteJid, key.id);

export const handlePollUpdate = async (store, msg) => {
	const pollKey = msg?.pollUpdateMessage?.pollCreationMessageKey;
	const originalPoll = await getMessage(pollKey, store);

	if (!originalPoll) {
		return;
	}

	const meIdNormalized = jidNormalizedUser(instance);
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
		instance
	);

	return;
};

export const emitGroupSettings = {
	picture: async (update) => {
		const object = {};
		const from = update?.attrs?.from || update?.content?.[0]?.attrs?.author;
		const name = update?.attrs?.notify;
		const action = update?.content?.[0]?.tag;
		const participant = update?.content?.[0]?.attrs?.author || '';
		const content = action === 'delete' ? null : await client.instance.profilePictureUrl(from, 'image').catch(() => null);

		object.id = from;
		object.name = name;
		object.content = content;
		object.action = action;
		isJidGroup(from) ? (object.author = participant) : (object.author = '');

		client.instance.ev.emit('profile-picture.update', object);
		isJidGroup(from) && client.instance.ev.emit('groups', [object]);
	}
};

let isShuttingDown = false;
let shutdownTimer = null;
const SHUTDOWN_TIMEOUT_MS = 10_000;

async function shutdownServers() {
	if (configuration.dashboardIO) {
		const io = configuration.dashboardIO;

		io.disconnectSockets(true);
		io.close();
	}

	const servers = [...configuration.expressInstances.entries()];

	if (!servers.length) {
		return;
	}

	await Promise.all(
		servers.map(([name, server]) => {
			loggers.warning(color('Shutting down', 'white'), color(name, 'lilac'), color('server...', 'white'));

			if (typeof server.closeAllConnections === 'function') {
				server.closeAllConnections();
			}

			if (typeof server.closeIdleConnections === 'function') {
				server.closeIdleConnections();
			}

			return new Promise((resolve, reject) => {
				server.close((err) => {
					if (err) {
						return reject(err);
					}

					configuration.expressInstances.delete(name);
					resolve();
				});
			});
		})
	);
}

const handleShutdown = async (signal = 'shutdown') => {
	if (isShuttingDown) {
		return;
	}

	isShuttingDown = true;

	loggers.warning(color('Received', 'white'), color(signal, 'lilac'), color('signal, shutting down...', 'white'));

	shutdownTimer = setTimeout(() => {
		loggers.error(color('Force shutdown after timeout.', 'red'));
		process.exit(1);
	}, SHUTDOWN_TIMEOUT_MS);

	if (typeof shutdownTimer.unref === 'function') {
		shutdownTimer.unref();
	}

	try {
		const { shutdownDashboardKV } = await import('../../database/adapters/dashboard-settings.js');
		const { shutdownPinterestProfilePictures } = await import('../../database/adapters/pinterest-profile-pictures.js');

		shutdownDashboardKV();
		shutdownPinterestProfilePictures();
		await shutdownServers();

		if (shutdownTimer) {
			clearTimeout(shutdownTimer);
		}

		process.exit(0);
	} catch (error) {
		loggers.error(color('Shutdown failed:', 'red'), color(error.message, 'white'));
		process.exit(1);
	}
};

process.on('SIGINT', () => void handleShutdown('SIGINT'));
process.on('SIGTERM', () => void handleShutdown('SIGTERM'));
