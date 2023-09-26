import { Boom } from '@hapi/boom';
import fs from 'fs-extra';
import {
	jidNormalizedUser,
	getKeyAuthor,
	jidDecode,
	getAggregateVotesInPollMessage,
	DisconnectReason
} from '@adiwajshing/baileys';
import boxen from 'boxen';

import configuration from '../../config/connect.js';
import { INFOLOG, color, romanize } from '../../../utils/modules/index.js';
import { connectMqtt, reconnectMqttConnection } from '../utils/mqtt.js';
import { loadCommands } from '../utils/commands.js';
import { clearDBConnection } from '../socket/reset-session.js';
import { Cache } from '../../modules/cache.js';

let isClosed = false;
let shouldWait = false;
const handler = new Cache();
const handlerPath = {
	incoming: '../../../handlers/messages_event/incoming-message.js',
	deleted: '../../../handlers/messages_event/deleted-message.js',
	composing: '../../../handlers/message_presence/composing.js',
	participant: '../../../handlers/notification_handlers/group-participants-notification.js',
	groupSettings: '../../../handlers/notification_handlers/group-settings-notification.js'
};

/**
 *
 * @param {import('../type.js').Client} Client
 * @param {{lastDisconnect: import('../type.js').Disconnect['lastDisconnect'], connection: import('../type.js').ConnectionState, receivedPendingNotifications: boolean, clientMqttListen: import('mqtt').Client, OPTIONS: {[_: string]: boolean}, cli: import('../socket/socket.js').Cli}} param1
 */
export const handleConnectionUpdate = async (
	Client,
	{ lastDisconnect, connection, receivedPendingNotifications, clientMqttListen, OPTIONS, cli }
) => {
	try {
		if (connection === 'close') {
			const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;

			/**
			 * @type {DisconnectReason} DisconnectReason
			 */
			if (reason === DisconnectReason.badSession) {
				console.log('Bad session, Please delete your previous session and do a rescan...');
				process.exit(0);
			} else if (reason === DisconnectReason.loggedOut) {
				console.log('Logged out, Please delete your previous session and do a rescan...');
				process.exit(0);
			} else {
				if (reason === DisconnectReason.restartRequired) {
					console.log('Restart required, Restarting your WebScoket...');
				} else if (reason === DisconnectReason.timedOut) {
					console.log('Timed out, Quick reconnecting...');
				} else if (reason === DisconnectReason.connectionClosed) {
					console.log('Connection closed, Quick reconnecting...');
				} else if (reason === DisconnectReason.connectionReplaced) {
					console.log('Connection replaced, Quick reconnecting...');
				} else if (reason === DisconnectReason.connectionLost) {
					console.log('Connection lost, Quick reconnecting...');
				} else {
					console.log('Unknown reason, Quick reconnecting...');
				}

				reconnectMqttConnection(connectMqtt, clientMqttListen);
				await (await import('../../../index.js')).start(true);
			}
		} else if (connection === 'open') {
			if (!isClosed) {
				await loadCommands(OPTIONS);
				isClosed = true;
			}

			configuration.isFirstConnection = true;

			if (receivedPendingNotifications) {
				shouldWait = true;
			}

			if (!receivedPendingNotifications && shouldWait) {
				shouldWait = false;
			}

			if (!receivedPendingNotifications && !shouldWait) {
				/**
				 * @typedef {string} BotNum
				 * @type {BotNum}
				 */
				const botNum = Client.user.id;

				global.client = {};
				global.botNum = botNum;

				client[Client.user.id] = Client;

				(await import('../../modules/utils.js')).assign(client);

				INFOLOG(
					color(
						boxen(`Made By Nanda\n Bot Version  ${romanize((await fs.readJSON('./package.json')).version)} `, {
							textAlignment: 'center',
							float: 'center'
						}),
						'#9f53ea'
					)
				);

				Client.ev.emit('connected');
				clearDBConnection(cli);
				connectMqtt(clientMqttListen);
			}
		}
	} catch (error) {
		console.log(error);
		reconnectMqttConnection(connectMqtt, clientMqttListen);
		await (await import('../../../index.js')).start();
	}
};

/**
 * @param {import('../type.js').Store} store
 * @param {import('@adiwajshing/baileys').proto.IWebMessageInfo[]} message
 * @param {import('../type.js').SingleAuthState['state']} state
 */
export const handleUpsertUpdate = async (store, message, state) => {
	if (!handler.has('incoming')) {
		handler.set('incoming', (await import(handlerPath.incoming)).default);
	}

	await handler.get('incoming')(message, client, configuration.cmds, store, configuration.user, state);
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

	if (!handler.has('deleted')) {
		handler.set('deleted', (await import(handlerPath.deleted)).default);
	}

	handler.get('deleted')(client, message, false, store);
};

/**
 * @param {{ id: string, presences: { [participant: string]: import('@adiwajshing/baileys').PresenceData } }} presence
 */
export const handlePresenceUpdate = async (presence) => {
	const from = presence.id;
	const participant = Object.keys(presence.presences)[0];
	const presences = presence.presences[participant].lastKnownPresence;

	if (presences === 'composing') {
		if (!handler.has('coposing')) {
			handler.set('composing', (await import(handlerPath.composing)).default);
		}

		handler.get('composing')(client, from, participant);
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
		const { user, server } = jidDecode(botNum);

		await client[botNum].sendNode({
			tag: 'call',
			attrs: {
				from: `${user}@${server}`,
				to: from,
				id: client[botNum].generateMessageTag()
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
		await client[botNum].updateBlockStatus(from, 'block');
	}
};

/**
 * @param {import('../type.js').Store} store
 * @param {import('@adiwajshing/baileys').proto.IWebMessageInfo[]} message
 */
export const handleParticipantsUpdate = async (store, message) => {
	if (!handler.has('participant')) {
		handler.set('participant', (await import(handlerPath.participant)).default);
	}

	handler.get('participant')(client, message, store);
};

export const handleGroupSettingsUpdate = async (store, message) => {
	if (!handler.has('groupSettings')) {
		handler.set('groupSettings', (await import(handlerPath.groupSettings)).default);
	}

	handler.get('groupSettings')(client, message, store);
};

export const handleWerewolfCycle = async (update) => {
	if (update.time === 'day') {
		await client[botNum].send(update.id, { text: update.gameDialogue, mentions: update.peopleKilledMention });
	} else if (update.time === 'evening') {
		await client[botNum].send(update.id, {
			text: update.gameDialogue
		});

		for (const id of update.playersData.filter((v) => !v.isAlive)) {
			client[botNum].send(id.id, {
				text: 'Karena kamu sudah mati, maka kamu hanya bisa menonton permainan saja'
			});
		}

		for (const id of update.playersData.filter((v) => v.isAlive)) {
			client[botNum].send(id.id, {
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
		await client[botNum].send(update.id, { text: update.gameDialogue, mentions: [update?.voteData?.voted] });

		if (update.isWinning) {
			return await client[botNum].send(update.id, { text: update.gameDialogue, mentions: update?.peopleMention });
		}

		await client[botNum].send(update.id, {
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
		await client[botNum].send(update.id, { text: update.gameDialogue.replace('{0}', update.gameTime) });

		for (const { id, role, isAlive } of update.playersData) {
			if (isAlive) {
				if (role === 'werewolf') {
					client[botNum].send(id, {
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
					client[botNum].send(id, {
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
					client[botNum].send(id, {
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
					client[botNum].send(id, {
						text: 'Kamu adalah Penduduk. Tunggu sampai pagi. Saat ini hanya pemain malam yang beraksi'
					});
				}
			}
		}
	} else if (update.time === 'night') {
		await client[botNum].send(update.id, { text: 'Aktifitas pemain malam dihentikan karena sudah mau pagi.' });
	} else if (update.time === 'failAfk') {
		await client[botNum].send(update.id, { text: update.message, mentions: update.playersData.map((v) => v.id) });
	} else if (update.time === 'voted') {
		await client[botNum].send(update.id, { text: update.text, mentions: update.mentions });
	}
};

const getMessage = (key, store) => store.loadMessage(key.remoteJid, key.id);

export const handlePollUpdate = async (store, msg) => {
	const pollKey = msg?.pollUpdateMessage?.pollCreationMessageKey;
	const originalPoll = await getMessage(pollKey, store);

	if (!originalPoll) {
		return;
	}

	const meIdNormalized = jidNormalizedUser(botNum);
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
		botNum
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

		client[botNum].ev.emit('group.settings.update', { from, name, action, participant, content });
	},
	picture: async (update) => {
		const from = update?.attrs?.from || update?.content?.[0]?.attrs?.author;
		const name = update?.attrs?.notify;
		const action = update?.content?.[0]?.tag;
		const participant = update?.content?.[0]?.attrs?.author;
		const content = action === 'delete' ? null : await client[botNum].profilePictureUrl(from, 'image').catch(() => null);

		client[botNum].ev.emit('group.settings.update', { from, name, action, participant, content });
	}
};
