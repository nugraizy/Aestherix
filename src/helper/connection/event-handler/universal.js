import { Boom } from '@hapi/boom';
import fs from 'fs-extra';
import { jidNormalizedUser, getKeyAuthor, getAggregateVotesInPollMessage, DisconnectReason } from '@adiwajshing/baileys';
import readline from 'readline';

import configuration from '../../config/connect.js';
import { loggers, color, printBanner } from '../../../utils/modules/index.js';
import { connectMqtt } from '../utils/mqtt.js';
import { loadCommands } from '../utils/commands.js';
import { clearDBConnection } from '../socket/reset-session.js';
import { Cache } from '../../modules/cache.js';
import { startingConnection } from '../../../helper/connection/utils/check-flag.js';

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
	GROUPSETTINGS: '../../../handlers/notification_handlers/group-settings-notification.js'
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
				loggers.ERR(color('Bad session', 'white'), color('Please delete your previous session and do a rescan...', '#E4C1F9'));
				process.exit(0);
			} else if (reason === DisconnectReason.loggedOut) {
				loggers.ERR(color('Logged out', 'white'), color('Please delete your previous session and do a rescan...', '#E4C1F9'));
				process.exit(0);
			} else {
				if (reason === DisconnectReason.restartRequired) {
					loggers.WRN(color('Restart required', 'white'), color('Restarting your WebScoket...', '#E4C1F9'));
				} else if (reason === DisconnectReason.timedOut) {
					loggers.WRN(color('Timed out', 'white'), color('Quick reconnecting...', '#E4C1F9'));
					newStart();
				} else if (reason === DisconnectReason.connectionClosed) {
					loggers.WRN(color('Connection closed', 'white'), color('Quick reconnecting...', '#E4C1F9'));
					newStart();
				} else if (reason === DisconnectReason.connectionReplaced) {
					loggers.WRN(color('Connection replaced', 'white'), color('Quick reconnecting...', '#E4C1F9'));
					newStart();
				} else if (reason === DisconnectReason.connectionLost) {
					loggers.WRN(color('Connection lost', 'white'), color('Quick reconnecting...', '#E4C1F9'));
					newStart();
				} else {
					loggers.WRN(color('Unknown reason', 'white'), color('Quick reconnecting...', '#E4C1F9'));
					newStart();
				}

				connectMqtt(clientMqttListen, true);
				await (await import('../../../index.js')).start(true);
			}
		} else if (connection === 'open') {
			if (!isClosed) {
				await loadCommands(OPTIONS);

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
					printBanner();
					loggers.INF(color('Socket connected', 'white'), color('Successfully', '#E4C1F9') + color('.', 'white'));
					shouldPrintBanner = false;
				}

				const timeToConnect = Date.now() - started;

				const data = await fs.readJSON('./src/helper/config/settings.json');
				let capt = '';

				if (timeToConnect < data.best_time) {
					loggers.INF(
						color('Connection time', 'white'),
						color(`${timeToConnect / 1000}s`, '#E4C1F9'),
						color('is the best time', 'white'),
						color(`(${data.best_time / 1000}s)`, '#E4C1F9')
					);

					data.best_time = timeToConnect; // eslint-disable-line

					await fs.writeJSON('./src/helper/config/settings.json', data, { spaces: 2 });

					capt += `New Best!\nConnection time ${timeToConnect / 1000}s is the best time (${data.best_time / 1000}s)`;
				} else {
					loggers.INF(
						color('Connection time', 'white'),
						color(`${timeToConnect / 1000}s`, '#E4C1F9'),
						color('is not the best time', 'white'),
						color(`(${data.best_time / 1000}s)`, '#E4C1F9')
					);

					capt += `Connection time ${timeToConnect / 1000}s is not the best time (${data.best_time / 1000}s)`;
				}

				client.instance.send(configuration.cache.ownerNumbers[0], {
					text: 'Bot is connected to socket.\n' + capt
				});

				Client.ev.emit('connected');
				clearDBConnection(cli);
				connectMqtt(clientMqttListen);

				if (configuration.OPTIONS.test && !rl) {
					rl = readline.createInterface({
						input: process.stdin,
						output: process.stdout
					});

					rl.on('line', async (line) => {
						if (line === 'exit') {
							process.exit(0);
						}

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
 * @param {import('@adiwajshing/baileys').proto.IWebMessageInfo[]} message
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
 * @param {import('@adiwajshing/baileys').WAMessageUpdate[]} message
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
 * @param {{ id: string, presences: { [participant: string]: import('@adiwajshing/baileys').PresenceData } }} presence
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
 * @param {import('@adiwajshing/baileys').WACallUpdateType} status
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
 * @param {import('@adiwajshing/baileys').proto.IWebMessageInfo[]} message
 */
export const handleParticipantsUpdate = async (store, message) => {
	if (!handler.has('PARTICIPANT')) {
		handler.set('PARTICIPANT', (await import(HANDLER_PATH.PARTICIPANT)).default);
	}

	await handler.get('PARTICIPANT')(client, message, store);
};

export const handleGroupSettingsUpdate = async (store, message) => {
	if (!handler.has('GROUPSETTINGS')) {
		handler.set('GROUPSETTINGS', (await import(HANDLER_PATH.GROUPSETTINGS)).default);
	}

	await handler.get('GROUPSETTINGS')(client, message, store);
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
				footer: 'Made by Void Bot. Powered by Hidden Finder',
				text: '\t',
				buttonText: 'Open List',
				sections: update.playersData
					.filter((v) => v.isAlive)
					.map((v) => ({
						rows: [{ title: `VOTE ${v.name}`, rowId: `.ww vote ${v.id} ${update.id}` }],
						title: 'VOID BOT | Werewolf Games'
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
					client.instance.send(id, {
						buttonText: 'Open list',
						footer: 'Made by Void Bot. Powered by Hidden Finder',
						title:
							'Kamu adalah Serigala. Dan saat ini merupakan waktu yang tepat untuk membunuh seseorang.\nPilih salah satu player.',
						text: '\t',
						sections: update.playersData
							.filter((v) => v.isAlive)
							.map((v) => {
								return {
									rows: [{ title: `KILL ${v.name}`, rowId: `.ww kill ${v.id} ${update.id}` }],
									title: 'VOID BOT | Werewolf Games'
								};
							})
					});
				} else if (role === 'seer') {
					client.instance.send(id, {
						buttonText: 'Open list',
						footer: 'Made by Void Bot. Powered by Hidden Finder',
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
											rowId: `.ww seer ${update.playersData[i].id} ${update.id}`
										}
									],
									title: 'VOID BOT | Werewolf Games'
								};
							})
					});
				} else if (role === 'guard') {
					client.instance.send(id, {
						buttonText: 'Open list',
						title:
							'Kamu adalah Penjaga. Dan saat ini merupakan waktu yang tepat untuk memjaga seseorang.\nPilih salah satu player.',
						footer: 'Made by Void Bot. Powered by Hidden Finder',
						text: '\t',
						sections: update.playersData
							.filter((v) => v.isAlive)
							.map((v, i) => {
								return {
									rows: [
										{
											title: `JAGA ${update.playersData[i].name}`,
											rowId: `.ww guard ${update.playersData[i].id} ${update.id}`
										}
									],
									title: 'VOID BOT | Werewolf Games'
								};
							})
					});
				} else if (role === 'villager') {
					client.instance.send(id, {
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
	settings: (update) => {
		if (update?.content?.[0].tag !== 'description' && update?.content?.[0].tag !== 'invite') {
			return;
		}

		const from = update?.attrs?.from || update?.content?.[0]?.attrs?.author;
		const name = update?.attrs?.notify;
		const action = update?.attrs?.content?.[0]?.tag || update?.content?.[0].tag;
		const content = update?.content?.[0]?.content?.[0]?.content?.toString() || update?.content?.[0]?.attrs.code || '';
		const participant = update?.attrs?.participant;

		client.instance.ev.emit('group.settings.update', { from, name, action, participant, content });
	},
	picture: async (update) => {
		const from = update?.attrs?.from || update?.content?.[0]?.attrs?.author;
		const name = update?.attrs?.notify;
		const action = update?.content?.[0]?.tag;
		const participant = update?.content?.[0]?.attrs?.author;
		const content = action === 'delete' ? null : await client.instance.profilePictureUrl(from, 'image').catch(() => null);

		client.instance.ev.emit('group.settings.update', { from, name, action, participant, content });
	}
};
