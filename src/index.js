import { makeInMemoryStore } from '@rodrigogs/baileys-store';
import axios from 'axios';
import { isWABusinessPlatform } from 'baileys';
import dayjs from 'dayjs';
import fs from 'fs-extra';
import mqtt from 'mqtt';
import cron from 'node-cron';
import P from 'pino';
import sharp from 'sharp';

import configuration from './helper/config/connect.js';
import { server } from './helper/connection/dashboard/server.js';
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
import { clearDBConnection, resetSession } from './helper/connection/socket/reset-session.js';
import { connectSocket } from './helper/connection/socket/socket.js';
import { initContact, updateContact } from './helper/connection/utils/cache.js';
import { cli as clis } from './helper/connection/utils/check-flag.js';
import { runLimitScheduler } from './helper/groups/settings/limit.js';
import { color, loggers } from './utils/modules/index.js';
import { pinterest } from './utils/pinterest/index.js';

const autoProfilePictureChangeEnabled = true;
const PROFILE_PICTURE_UPDATE_INTERVAL = '*/50 * * * * *';
const PROFILE_PICTURE_NO_CROP = 'no_crop';
const BOOKMARK_END_FLAG = '-end-';

/**
 * Starts the auto profile picture change service
 * @param {import('./types/Socket/index').AdvancedClient} client
 * @param {import('./types/Socket/index').MultiAuthState['state']} state
 * @param {import('./types/Socket/config').GlobalConfig} config
 */
const startAutoProfilePictureChangeService = async (client, state, config) => {
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
			if (response.bookmarks === BOOKMARK_END_FLAG) {
				bookmarks = null;
				currentPinterestId = null;
				return;
			}

			bookmarks = response.bookmarks;
		} else {
			bookmarks = null;
		}
	};

	const downloadImage = async (url) => {
		const { data } = await axios.get(url, { responseType: 'arraybuffer' });

		return data;
	};

	cron.schedule(PROFILE_PICTURE_UPDATE_INTERVAL, async () => {
		try {
			const pinterestId = config.pinterestId;

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
			const date = dayjs.tz().format('YYYY/MM/DD HH:mm:ss');

			config.pinterestImages.set(date, imageUrl);

			await client.instance.updateProfilePicture(instance, image, PROFILE_PICTURE_NO_CROP);

			if (isWABusinessPlatform(state.creds.platform)) {
				await client.instance.updateCoverPhoto(await sharp(image).blur(10).png().toBuffer());
			}
		} catch (error) {
			if (
				error.message.includes('not-acceptable') ||
				error.message.includes('internal-server-error') ||
				error.message.includes('bad-request')
			) {
				return;
			}

			loggers.error('Profile picture update failed:', error.message);
		}
	});
};

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
				await handleConnectionUpdate(Client, {
					...connection,
					clientMqttListen,
					store,
					OPTIONS,
					cli,
					state,
					runtime
				})
		);

		Client.ev.on('connected', () => {
			isReconnect = isReconnect && !state.creds.me?.id;
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
			Client.ev.on('profile-picture.update', async (update) => {
				const id = update.id.split('@');
				const isLid = id[1] === 'lid';

				if (isLid) {
					const lidMap = await state.keys.get('lid-mapping', [id[0] + '_reverse']);

					update.id = lidMap[id[0] + '_reverse'];
				}

				if (update.id === state.creds.me?.id.split(':')[0]) {
					return;
				}

				loggers.warning(
					'Profile picture changed in',
					update.id,
					'link :',
					update.content || 'link is missing; inspect the profile-picture.update event payload or retry after the next update'
				);
			});
			Client.ev.on('commit', async (commitInfo) => await handleGithubWebhook(commitInfo));
			Client.ev.on('werewolf.cycle', async (update) => await handleWerewolfCycle(update));
			Client.ev.on('poll.update', async (msg) => handlePollUpdate(store, msg));
			Client.ws.on('CB:notification,type:w:gp2', parseStubtypeUpdate);
			Client.ws.on('CB:notification,type:picture', async (update) => await emitGroupSettings.picture(update));

			if (autoProfilePictureChangeEnabled) {
				startAutoProfilePictureChangeService(client, state, configuration);
			}
		});

		Client.ev.on('creds.update', async () => await saveCreds());
		Client.ev.on('contacts.upsert', (contacts) => initContact(store, contacts));
		Client.ev.on('contacts.update', (update) => updateContact(store, update));
		Client.ev.on('contacts.set', (update) => {
			console.log(update, 'contacts.set');
		});
	} catch (error) {
		console.log(error);
	}
};

start().catch(console.log);
