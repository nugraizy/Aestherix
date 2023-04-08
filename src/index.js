// this was just for test
import baileys from '@adiwajshing/baileys';
import dotenv from 'dotenv';
import fs from 'fs-extra';
import dayjs from 'dayjs';
import localePlugins from 'dayjs/plugin/timezone.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import mqtt from 'mqtt';

dotenv.config();

console.log(__dirname);

import configuration from './helper/config/connect.js';
import { color, ERRLOG } from './utils/modules/index.js';
import { runLimitScheduler } from './helper/groups/settings/limit.js';
import { clearDBConnection, resetSession } from './helper/connection/socket/reset-session.js';
import { parseCli } from './helper/connection/utils/check-flag.js';
import { connectSocket } from './helper/connection/socket/socket.js';
import {
	emitGroupSettings,
	handleConnectionUpdate,
	handleUpsertUpdate,
	handleMessagesUpdate,
	handlePresenceUpdate,
	handleCallUpdate,
	handleParticipantsUpdate,
	handleGroupSettingsUpdate,
	handlePollUpdate,
	handleWerewolfCycle
} from './helper/connection/event-handler/universal.js';
import { handleGithubWebhook } from './helper/connection/github-webhook/events.js';
import { githubWebhook } from './helper/connection/github-webhook/server.js';

const { useSingleFileAuthState } = baileys;

console.clear();

dayjs.extend(localePlugins);
dayjs.extend(customParseFormat);
dayjs.tz.setDefault('Asia/Jakarta');

configuration.cli = parseCli();
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
		ERRLOG(` ${color(option, 'red')} ${color('is not a valid option', 'white')}`);
	}
}

if (!(await fs.exists('./src/media/temporary_files/'))) {
	await fs.mkdir('./src/media/temporary_files/');
}

const clientMqttListen = mqtt.connect(process.env.MQTT_URL);

clientMqttListen.on('connect', () => {
	clientMqttListen.subscribe(process.env.MQTT_TOPIC);
	clientMqttListen.subscribe(process.env.FREEGAME_TOPIC);
});

const { state, saveState } = useSingleFileAuthState(`./src/helper/connection/session/${cli.input[0] ?? 'Session-debug'}.json`);

export const start = async () => {
	if (OPTIONS.help) {
		console.log(cli.help);
		process.exit(0);
	}

	const { Client, store } = await connectSocket({ cli, OPTIONS, state });

	Client.ev.on(
		'connection.update',
		async (connection) => await handleConnectionUpdate(Client, { ...connection, clientMqttListen, store, OPTIONS, cli })
	);

	Client.ev.on('connected', () => {
		githubWebhook();
		Client.ev.on('messages.upsert', async (message) => await handleUpsertUpdate(store, message));
		Client.ev.on('messages.update', async (message) => await handleMessagesUpdate(store, message));
		Client.ev.on('presence.update', async (presence) => await handlePresenceUpdate(presence));
		Client.ev.on(
			'call',
			async ([{ isGroup, status, id, from }]) => await handleCallUpdate(isGroup, status, id, from, OPTIONS)
		);
		Client.ev.on('group.participants.update', async (message) => await handleParticipantsUpdate(store, message));
		Client.ev.on('commit', async (commitInfo) => await handleGithubWebhook(commitInfo));
		Client.ev.on('group.settings.update', async (message) => await handleGroupSettingsUpdate(store, message));
		Client.ev.on('werewolf.cycle', async (update) => await handleWerewolfCycle(update));
		Client.ev.on('poll.update', async (msg) => handlePollUpdate(store, msg));
		Client.ws.on('CB:notification,type:w:gp2', (update) => emitGroupSettings.settings(update));
		Client.ws.on('CB:notification,type:picture', async (update) => await emitGroupSettings.picture(update));
	});
	Client.ev.on('auth-state.update', saveState);
	Client.ev.on('contacts.update', () => {});
	Client.ev.on('groups.update', () => {});
};

start().catch(console.log);
