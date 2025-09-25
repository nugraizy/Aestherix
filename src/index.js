import { makeInMemoryStore } from '@rodrigogs/baileys-store';
import axios from 'axios';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import localePlugins from 'dayjs/plugin/timezone.js';
import fs from 'fs-extra';
import mqtt from 'mqtt';
import cron from 'node-cron';
import P from 'pino';

import configuration from './helper/config/connect.js';
import {
	emitGroupSettings,
	handleCallUpdate,
	handleConnectionUpdate,
	handleGroupSettingsUpdate,
	handleMessagesUpdate,
	handleParticipantsUpdate,
	handlePollUpdate,
	handlePresenceUpdate,
	handleUpsertUpdate,
	handleWerewolfCycle,
	parseStubtypeUpdate
} from './helper/connection/event-handler/universal.js';
import { handleGithubWebhook } from './helper/connection/github-webhook/events.js';
import { githubWebhook } from './helper/connection/github-webhook/server.js';
import { server } from './helper/connection/gradient/server.js';
import { clearDBConnection, resetSession } from './helper/connection/socket/reset-session.js';
import { connectSocket } from './helper/connection/socket/socket.js';
import { initContact, updateContact } from './helper/connection/utils/cache.js';
import { cli as clis } from './helper/connection/utils/check-flag.js';
import { runLimitScheduler } from './helper/groups/settings/limit.js';
import { color, loggers } from './utils/modules/index.js';
import { pinterest } from './utils/pinterest/index.js';

const autoProfilePictureChangeEnabled = true;

dayjs.extend(localePlugins);
dayjs.extend(customParseFormat);
dayjs.tz.setDefault('Asia/Jakarta');

configuration.cli = clis;
configuration.OPTIONS = configuration.cli.flags;

const { OPTIONS, cli } = configuration;

const regexOption = Object.keys(OPTIONS);

if (OPTIONS.reset) {
	await resetSession(cli);
}

if (OPTIONS.limitReset) {
	runLimitScheduler(OPTIONS, clearDBConnection, cli);
}

if (OPTIONS.resetOnStart) {
	await clearDBConnection(cli);
}

export const runtime = Date.now();

for (const option of Object.keys(OPTIONS).filter((key) => OPTIONS[key])) {
	if (!regexOption.includes(option)) {
		loggers.error(`${color(option, '#FF5555')} ${color('is not a valid option', 'white')}`);
	}
}

if (!(await fs.exists('./src/media/temporary_files/'))) {
	await fs.mkdir('./src/media/temporary_files/');
}

const clientMqttListen = mqtt.connect(process.env.MQTT_URL);

clientMqttListen.on('connect', () => {
	clientMqttListen.subscribe(process.env.MQTT_SPOTIFY_BIO);
	clientMqttListen.subscribe(process.env.MQTT_FREEGAME);
	clientMqttListen.subscribe(process.env.MQTT_SPOTIFY_PLAYBACK);

	configuration.mqtt = clientMqttListen;
});

/**
 * @type {import('./types/Socket/index.js').Store}
 */
const store = makeInMemoryStore({ logger: P().child({ level: 'fatal', stream: 'store' }) });

/**
 * @param {boolean} isReconnect
 */
export const start = async (isReconnect) => {
	try {
		if (OPTIONS.help) {
			console.log(cli.help);
			process.exit(0);
		}

		const { Client, state, saveCreds } = await connectSocket({ cli, OPTIONS, store });

		store.localContacts = {};

		Client.ev.on(
			'connection.update',
			async (connection) =>
				await handleConnectionUpdate(Client, { ...connection, clientMqttListen, store, OPTIONS, cli, state, runtime })
		);

		Client.ev.on('connected', () => {
			githubWebhook(isReconnect);
			server(isReconnect);
			Client.ev.on('groups', handleGroupSettingsUpdate);
			Client.ev.on('groups.update', (update) => Client.ev.emit('groups', update));
			Client.ev.on('group-participants.update', async (update) => await handleParticipantsUpdate(update));
			Client.ev.on('messages.upsert', async (message) => await handleUpsertUpdate(store, message, state, runtime));
			Client.ev.on('messages.update', async (message) => await handleMessagesUpdate(store, message));
			Client.ev.on('presence.update', async (presence) => await handlePresenceUpdate(presence));
			Client.ev.on(
				'call',
				async ([{ isGroup, status, id, from }]) => await handleCallUpdate(isGroup, status, id, from, OPTIONS)
			);
			Client.ev.on('profile-picture.update', (update) => {
				loggers.warning('Profile picture changed in', update.id, 'link :', update.content || 'no link :(');
			});
			Client.ev.on('commit', async (commitInfo) => await handleGithubWebhook(commitInfo));
			Client.ev.on('werewolf.cycle', async (update) => await handleWerewolfCycle(update));
			Client.ev.on('poll.update', async (msg) => handlePollUpdate(store, msg));
			Client.ws.on('CB:notification,type:w:gp2', parseStubtypeUpdate);
			Client.ws.on('CB:notification,type:picture', async (update) => await emitGroupSettings.picture(update));

			if (autoProfilePictureChangeEnabled) {
				let images = [];
				let bookmarks = null;
				let currentPinterestId = null;

				const fetchImages = async (pinterestId) => {
					let response;

					if (pinterestId) {
						response = await pinterest.getSimilarPin(pinterestId, bookmarks);
					} else {
						response = await pinterest.getHomefeed();
					}

					if (response?.images) {
						images = response.images;
					} else {
						images = response;
					}

					if (response?.bookmarks) {
						bookmarks = response.bookmarks;
					} else {
						bookmarks = null;
					}
				};

				const downloadImage = async (url) => {
					const { data } = await axios.get(url, { responseType: 'arraybuffer' });

					return data;
				};

				cron.schedule('*/30 * * * * *', async () => {
					const pinterestId = configuration.pinterestId;

					if (images.length === 0 && !currentPinterestId) {
						await fetchImages(pinterestId);
						currentPinterestId = pinterestId || null;
					}

					if (pinterestId !== currentPinterestId) {
						images = [];
						bookmarks = null;
						await fetchImages(pinterestId);
						currentPinterestId = pinterestId || null;
					}

					if (images.length === 0) {
						await fetchImages(pinterestId);
					}

					if (images.length === 0) {
						return;
					}

					const imageUrl = images.shift().url;
					const image = await downloadImage(imageUrl);

					await client.instance.updateProfilePicture(instance, image, 'no_crop');
				});
			}
		});

		Client.ev.on('creds.update', async () => await saveCreds());
		Client.ev.on('contacts.upsert', (contacts) => initContact(store, contacts));
		Client.ev.on('contacts.update', (update) => updateContact(store, update));
		Client.ev.on('contacts.set', (update) => {
			console.log(update, 'contacts.set');
		});
		Client.ev.on('groups.update', () => {});
	} catch (error) {
		console.log(error);
	}
};

start().catch(console.log);
