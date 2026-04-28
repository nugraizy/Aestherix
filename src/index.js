import { makeInMemoryStore } from '@rodrigogs/baileys-store';
import axios from 'axios';
import { isWABusinessPlatform } from 'baileys';
import dayjs from 'dayjs';
import express from 'express';
import fs from 'fs-extra';
import { createServer } from 'http';
import mqtt from 'mqtt';
import path from 'path';
import P from 'pino';
import sharp from 'sharp';

import configuration from './helper/config/connect.js';
import prisma from './helper/database/prisma.js';
import { getUserLimit, upsertUserLimit, getBannedUsers, banUser, unbanUser } from './helper/database/adapters/user.js';
import {
	getDashboardLogs,
	initializeDashboardMonitor,
	refreshDashboardCommandCatalog,
	setDashboardCommandState,
	setDashboardFlagState
} from './helper/connection/dashboard/dashboard-monitor.js';
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
const ENABLE_EMBEDDED_DASHBOARD = String(process.env.DASHBOARD_EMBEDDED || '1') !== '0';
const DASHBOARD_BRIDGE_PORT = Number(process.env.DASHBOARD_BRIDGE_PORT || 4010);
const DASHBOARD_BRIDGE_TOKEN = String(process.env.DASHBOARD_BRIDGE_TOKEN || 'aestherix-local-bridge-token');

let dashboardBridgeInstance = null;
const S_WHATSAPP_NET = '@s.whatsapp.net';

const normalizeUserJid = (input) => {
	let raw = String(input || '').trim();

	if (!raw) {
		return null;
	}

	if (raw.endsWith('@c.us')) {
		raw = raw.replace(/@c\.us$/i, S_WHATSAPP_NET);
	}

	if (raw.endsWith(S_WHATSAPP_NET)) {
		const local = raw.split('@')[0].replace(/\D/g, '');

		return local ? `${local}${S_WHATSAPP_NET}` : null;
	}

	if (raw.includes('@')) {
		const local = raw.split('@')[0].replace(/\D/g, '');

		return local ? `${local}${S_WHATSAPP_NET}` : null;
	}

	const digits = raw.replace(/\D/g, '');

	if (!digits) {
		return null;
	}

	return `${digits}${S_WHATSAPP_NET}`;
};

const readUserLimitFile = async (jid) => {
	const raw = await getUserLimit(prisma, jid);

	if (!raw) {
		return { id: jid, limit: 30, role: 'FREE' };
	}

	return {
		id: normalizeUserJid(raw?.id) || jid,
		limit: Math.max(0, Number(raw?.limit || 0)),
		role: raw?.role === 'PREMIUM' ? 'PREMIUM' : 'FREE'
	};
};

const writeUserLimitFile = async (jid, data) => {
	const payload = {
		id: jid,
		limit: Math.max(0, Number(data?.limit || 0)),
		role: data?.role === 'PREMIUM' ? 'PREMIUM' : 'FREE'
	};

	await upsertUserLimit(prisma, jid, payload.limit, payload.role);
	configuration.user.limit.set(jid, { limit: payload.limit, role: payload.role });

	return payload;
};

const readBannedUsers = async () => {
	return getBannedUsers(prisma);
};

const writeBannedUsers = async (list) => {
	const current = await getBannedUsers(prisma);
	const currentSet = new Set(current);
	const newSet = new Set(Array.from(new Set(list)));

	for (const jid of newSet) {
		if (!currentSet.has(jid)) await banUser(prisma, jid).catch(() => {});
	}

	for (const jid of currentSet) {
		if (!newSet.has(jid)) await unbanUser(prisma, jid).catch(() => {});
	}
};

const applyDashboardRuntimeMutation = async (waClient, type, payload = {}) => {
	if (type === 'command.toggle') {
		return setDashboardCommandState(configuration, String(payload.commandName || ''), Boolean(payload.enabled));
	}

	if (type === 'flag.toggle') {
		return setDashboardFlagState(configuration, String(payload.flagName || ''), Boolean(payload.enabled));
	}

	if (type === 'user.limit') {
		const jid = normalizeUserJid(payload.userId);

		if (!jid) {
			return { ok: false, message: 'Invalid user id.' };
		}

		const current = await readUserLimitFile(jid);

		await writeUserLimitFile(jid, {
			...current,
			limit: Number(payload.limit || 0)
		});

		return { ok: true, userId: jid };
	}

	if (type === 'user.premium') {
		const jid = normalizeUserJid(payload.userId);

		if (!jid) {
			return { ok: false, message: 'Invalid user id.' };
		}

		const current = await readUserLimitFile(jid);

		await writeUserLimitFile(jid, {
			...current,
			role: Boolean(payload.enabled) ? 'PREMIUM' : 'FREE'
		});

		return { ok: true, userId: jid };
	}

	if (type === 'user.banned') {
		const jid = normalizeUserJid(payload.userId);

		if (!jid) {
			return { ok: false, message: 'Invalid user id.' };
		}

		const list = await readBannedUsers();
		const set = new Set(list);

		if (Boolean(payload.enabled)) {
			set.add(jid);
		} else {
			set.delete(jid);
		}

		const next = Array.from(set);

		await writeBannedUsers(next);
		configuration.cache.bannedlist = next;

		return { ok: true, userId: jid };
	}

	if (type === 'user.blocked') {
		const jid = normalizeUserJid(payload.userId);

		if (!jid) {
			return { ok: false, message: 'Invalid user id.' };
		}

		if (!waClient?.updateBlockStatus) {
			return { ok: false, status: 503, message: 'WhatsApp client is not connected yet.' };
		}

		await waClient.updateBlockStatus(jid, Boolean(payload.enabled) ? 'block' : 'unblock');

		const set = new Set(Array.isArray(configuration.cache?.blocklist) ? configuration.cache.blocklist : []);

		if (Boolean(payload.enabled)) {
			set.add(jid);
		} else {
			set.delete(jid);
		}

		configuration.cache.blocklist = Array.from(set);

		return { ok: true, userId: jid };
	}

	return { ok: false, message: 'Unsupported runtime sync action.' };
};

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

const getImageVariantsFromMap = (images) => {
	if (!images || typeof images !== 'object') {
		return [];
	}

	const variants = [];

	for (const [key, value] of Object.entries(images)) {
		const url = getSafeHttpUrl(value?.url || value);

		if (!url) {
			continue;
		}

		const width = Number(value?.width || String(key).match(/(\d+)x/i)?.[1] || 0);
		const height = Number(value?.height || String(key).match(/x(\d+)/i)?.[1] || 0);

		variants.push({
			url,
			width: Number.isFinite(width) ? width : 0,
			height: Number.isFinite(height) ? height : 0
		});
	}

	return variants;
};

const normalizePinterestPictureRecord = (record) => {
	const variants = getImageVariantsFromMap(record?.images);
	const sortedByArea = [...variants].sort((a, b) => b.width * b.height - a.width * a.height);

	const originalUrl =
		getSafeHttpUrl(record?.original?.url) ||
		getSafeHttpUrl(record?.url) ||
		getSafeHttpUrl(record?.original) ||
		getSafeHttpUrl(record?.image_url) ||
		getSafeHttpUrl(record?.image) ||
		getSafeHttpUrl(record?.images?.orig?.url) ||
		sortedByArea[0]?.url ||
		getSafeHttpUrl(record);

	if (!originalUrl) {
		return null;
	}

	const original = toImageVariant(record?.original, originalUrl);
	const thumbnail = toImageVariant(
		record?.thumbnail,
		getSafeHttpUrl(record?.thumbnail?.url) ||
			getSafeHttpUrl(record?.previewUrl) ||
			getSafeHttpUrl(record?.thumbnail) ||
			getSafeHttpUrl(record?.images?.['474x']?.url) ||
			getSafeHttpUrl(record?.images?.['236x']?.url) ||
			sortedByArea.at(-1)?.url ||
			originalUrl
	) ||
		toImageVariant(record?.preview, originalUrl) || {
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
				thumbnail: normalized.thumbnail.url
			};
		})
		.filter((entry) => entry && entry.timestamp && /^https?:\/\//i.test(entry.url))
		.slice(-PROFILE_PICTURE_HISTORY_LIMIT);

	await fs.ensureDir(path.dirname(PROFILE_PICTURE_HISTORY_PATH));
	await fs.writeJSON(PROFILE_PICTURE_HISTORY_PATH, { entries }, { spaces: 2 });
};

const sendDashboardConfirmationButton = async ({ waClient, to, buttonId, phoneNumber }) => {
	if (!waClient) {
		throw new Error('WhatsApp client is not ready.');
	}

	if (waClient.TemplateBuilder?.Native) {
		const builder = new waClient.TemplateBuilder.Native();

		await builder
			.destination(to)
			.body('A dashboard login request was made for your owner account. Confirm if this was you.')
			.footer(`Requested number: ${phoneNumber}`)
			.buttons(
				builder.button.reply({
					display: 'Confirm Login',
					id: buttonId
				})
			)
			.send();

		return;
	}

	await waClient.send(to, {
		text: `Dashboard login request detected.\n\nReply this exact code to confirm:\n${buttonId}`
	});
};

const startDashboardBridge = (resolveWaClient) => {
	if (dashboardBridgeInstance) {
		return;
	}

	const app = express();

	app.use(express.json());

	app.post('/internal/dashboard/send-confirmation', async (req, res) => {
		const token = String(req.headers['x-dashboard-bridge-token'] || '');

		if (!token || token !== DASHBOARD_BRIDGE_TOKEN) {
			return res.status(401).json({ ok: false, message: 'Unauthorized bridge token.' });
		}

		const to = String(req.body?.to || '').trim();
		const buttonId = String(req.body?.buttonId || '').trim();
		const phoneNumber = String(req.body?.phoneNumber || '').trim();

		if (!to || !buttonId || !phoneNumber) {
			return res.status(400).json({ ok: false, message: 'Invalid bridge payload.' });
		}

		const waClient =
			typeof resolveWaClient === 'function'
				? resolveWaClient() || global.client?.instance || null
				: global.client?.instance || null;

		if (!waClient?.send) {
			return res.status(503).json({ ok: false, message: 'WhatsApp client is not connected yet.' });
		}

		try {
			await sendDashboardConfirmationButton({
				waClient,
				to,
				buttonId,
				phoneNumber
			});

			return res.json({ ok: true });
		} catch (error) {
			loggers.warning(color('Dashboard bridge send failed:', '#FF5555'), color(error.message, 'white'));
			return res.status(500).json({ ok: false, message: 'Failed sending WhatsApp confirmation.' });
		}
	});

	app.post('/internal/dashboard/runtime-sync', async (req, res) => {
		const token = String(req.headers['x-dashboard-bridge-token'] || '');

		if (!token || token !== DASHBOARD_BRIDGE_TOKEN) {
			return res.status(401).json({ ok: false, message: 'Unauthorized bridge token.' });
		}

		const type = String(req.body?.type || '').trim();
		const payload = req.body?.payload && typeof req.body.payload === 'object' ? req.body.payload : {};
		const waClient =
			typeof resolveWaClient === 'function'
				? resolveWaClient() || global.client?.instance || null
				: global.client?.instance || null;

		try {
			const result = await applyDashboardRuntimeMutation(waClient, type, payload);

			if (!result?.ok) {
				return res.status(result?.status || 400).json(result);
			}

			return res.json(result);
		} catch (error) {
			loggers.warning(color('Dashboard runtime sync failed:', '#FF5555'), color(error.message, 'white'));
			return res.status(500).json({ ok: false, message: 'Runtime sync failed.' });
		}
	});

	app.get('/internal/dashboard/logs', (req, res) => {
		const token = String(req.headers['x-dashboard-bridge-token'] || '');

		if (!token || token !== DASHBOARD_BRIDGE_TOKEN) {
			return res.status(401).json({ ok: false, message: 'Unauthorized bridge token.' });
		}

		const since = Number(req.query?.since || 0);
		const limit = Number(req.query?.limit || 200);

		return res.json(getDashboardLogs({ since, limit }));
	});

	app.post('/internal/dashboard/restart', (req, res) => {
		const token = String(req.headers['x-dashboard-bridge-token'] || '');

		if (!token || token !== DASHBOARD_BRIDGE_TOKEN) {
			return res.status(401).json({ ok: false, message: 'Unauthorized bridge token.' });
		}

		res.json({ ok: true, restarting: true });

		setTimeout(() => {
			process.exit(0);
		}, 220);
	});

	const safePort = Number.isFinite(DASHBOARD_BRIDGE_PORT) && DASHBOARD_BRIDGE_PORT > 0 ? DASHBOARD_BRIDGE_PORT : 4010;
	const server = createServer(app).listen(safePort, '127.0.0.1', () => {
		loggers.info(color('Dashboard bridge', 'white'), color('listening on', '#E4C1F9'), color(String(safePort), 'white'));
	});

	dashboardBridgeInstance = server;
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

await initializeDashboardMonitor(configuration);

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
			startDashboardBridge(() => Client.instance);

			if (ENABLE_EMBEDDED_DASHBOARD) {
				server();
			}

			refreshDashboardCommandCatalog(configuration);

			setInterval(() => {
				refreshDashboardCommandCatalog(configuration);
			}, 30_000);

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
