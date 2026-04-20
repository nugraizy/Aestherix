import { makeInMemoryStore } from '@rodrigogs/baileys-store';
import axios from 'axios';
import { isWABusinessPlatform } from 'baileys';
import dayjs from 'dayjs';
import fs from 'fs-extra';
import mqtt from 'mqtt';
import path from 'path';
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
const PROFILE_PICTURE_UPDATE_INTERVAL_MS = 120_000;
const PROFILE_PICTURE_NO_CROP = 'no_crop';
const BOOKMARK_END_FLAG = '-end-';
const PROFILE_PICTURE_HISTORY_PATH = './databases/pictures/pinterest-profile-pictures.json';
const PROFILE_PICTURE_HISTORY_LIMIT = 900;

const getSafeHttpUrl = (value) => {
	const normalized = String(value || '').trim();

	if (!/^https?:\/\//i.test(normalized)) {
		return '';
	}

	return normalized;
};

const toImageVariant = (variant, fallbackUrl) => {
	const variantUrl = getSafeHttpUrl(variant?.url) || getSafeHttpUrl(variant) || fallbackUrl;

	if (!variantUrl) {
		return null;
	}

	if (variant && typeof variant === 'object') {
		return {
			...variant,
			url: variantUrl
		};
	}

	return {
		url: variantUrl
	};
};

const normalizePinterestPictureRecord = (record) => {
	const originalUrl =
		getSafeHttpUrl(record?.original?.url) ||
		getSafeHttpUrl(record?.url) ||
		getSafeHttpUrl(record?.original) ||
		getSafeHttpUrl(record);

	if (!originalUrl) {
		return null;
	}

	const original = toImageVariant(record?.original, originalUrl);
	const thumbnail =
		toImageVariant(record?.thumbnail, getSafeHttpUrl(record?.thumbnail?.url) || getSafeHttpUrl(record?.thumbnail) || originalUrl) ||
		toImageVariant(record?.preview, originalUrl) ||
		{
			url: originalUrl
		};

	return {
		original,
		thumbnail
	};
};

const hydrateProfilePictureHistory = async (config) => {
	try {
		if (!(await fs.pathExists(PROFILE_PICTURE_HISTORY_PATH))) {
			await fs.ensureDir(path.dirname(PROFILE_PICTURE_HISTORY_PATH));
			await fs.writeJSON(PROFILE_PICTURE_HISTORY_PATH, { entries: [] }, { spaces: 2 });
			return;
		}

		const raw = await fs.readJSON(PROFILE_PICTURE_HISTORY_PATH).catch(() => ({ entries: [] }));
		const entries = Array.isArray(raw?.entries) ? raw.entries : [];

		config.pinterestImages.clear();

		for (const entry of entries) {
			const timestamp = String(entry?.timestamp || '').trim();
			const normalized = normalizePinterestPictureRecord(entry);

			if (!timestamp || !normalized) {
				continue;
			}

			config.pinterestImages.set(timestamp, normalized);
		}
	} catch (error) {
		loggers.warning(color('Failed loading pinterest profile pictures JSON:', '#FF5555'), color(error.message, 'white'));
	}
};

const persistProfilePictureHistory = async (config) => {
	const entries = (Array.isArray(config.pinterestImages?.entries?.()) ? config.pinterestImages.entries() : [])
		.map(([timestamp, value]) => {
			const normalized = normalizePinterestPictureRecord(value);

			if (!normalized) {
				return null;
			}

			return {
				timestamp: String(timestamp || ''),
				url: normalized.original.url,
				original: normalized.original,
				thumbnail: normalized.thumbnail
			};
		})
		.filter((entry) => entry && entry.timestamp && /^https?:\/\//i.test(entry.url))
		.slice(-PROFILE_PICTURE_HISTORY_LIMIT);

	await fs.ensureDir(path.dirname(PROFILE_PICTURE_HISTORY_PATH));
	await fs.writeJSON(PROFILE_PICTURE_HISTORY_PATH, { entries }, { spaces: 2 });
};

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

	await hydrateProfilePictureHistory(config);

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

	let isUpdatingProfilePicture = false;

	const runProfilePictureUpdate = async () => {
		if (isUpdatingProfilePicture) {
			return;
		}

		isUpdatingProfilePicture = true;

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

			const nextImage = images.shift();
			const normalizedImage = normalizePinterestPictureRecord(nextImage);

			if (!normalizedImage) {
				return;
			}

			const imageUrl = normalizedImage.original.url;
			const image = await downloadImage(imageUrl);
			const date = dayjs.tz().format('YYYY/MM/DD HH:mm:ss');

			config.pinterestImages.set(date, normalizedImage);
			await persistProfilePictureHistory(config);

			await client.instance.updateProfilePicture(instance, image, PROFILE_PICTURE_NO_CROP);

			if (isWABusinessPlatform(state.creds.platform)) {
				await client.instance.updateCoverPhoto(await sharp(image).blur(10).png().toBuffer());
			}
		} catch (error) {
			if (
				error.message.includes('not-acceptable') ||
				error.message.includes('internal-server-error') ||
				error.message.includes('bad-request') ||
				error.message.includes('fetch failed') ||
				error.message.includes('Connection Closed') ||
				error.message.includes('source: bad seek')
			) {
				return;
			}

			loggers.error('Profile picture update failed:', error.message);
		} finally {
			isUpdatingProfilePicture = false;
		}
	};

	setInterval(() => {
		void runProfilePictureUpdate();
	}, PROFILE_PICTURE_UPDATE_INTERVAL_MS);
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

export const start = async () => {
	try {
		await hydrateProfilePictureHistory(configuration);

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
			githubWebhook();
			server();
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
