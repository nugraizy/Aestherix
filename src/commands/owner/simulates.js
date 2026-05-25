import { BOT_NAME } from '../../core/constants.js';

import dayjs from 'dayjs';

import configuration from '../../helper/config/connect.js';
import { getRuntime } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';

const PRESENCE_TYPES = {
	available: 'available',
	unavailable: 'unavailable',
	composing: 'composing',
	recording: 'recording',
	paused: 'paused'
};

async function broadcastPresence(client, store, presence) {
	const chats = Object.keys(store.messages);

	for (const chat of chats) {
		if (configuration.presences[presence] === undefined) {
			break;
		}

		await client.sendPresenceUpdate(PRESENCE_TYPES[presence], chat);
	}
}

async function pauseAll(client, store) {
	const chats = Object.keys(store.messages);

	for (const chat of chats) {
		await client.sendPresenceUpdate(PRESENCE_TYPES.paused, chat);
	}
}

async function updateBio(client) {
	const time = dayjs.tz().format('HH:mm:ss DD/MM');
	const uptime = getRuntime(process.uptime());

	await client.setStatus(
		`Made by nanda | ${BOT_NAME} Bot Info : UPTIME : ${uptime} | TIME : ${time} | Powered by Hidden Finder`
	);
}

function handleToggle({ key, from, args, message, client, store, onEnable, onDisable, statusLabel, usageHint }) {
	const action = args[2]?.toLowerCase();

	switch (action) {
		case 'status':
		case 'stats':
			return client.reply(from, key in configuration.presences ? statusLabel.on : statusLabel.off, message);

		case 'disable':
		case 'off':
			return onDisable();

		case 'enable':
		case 'on':
			return onEnable();

		default:
			return client.reply(from, usageHint, message);
	}
}

export default defineCommand({
	name: 'simulates',
	minifiedDescription: 'Simulates Event',
	description: 'Simulates an event update.',
	usage: '!simulates `<events>`',
	aliases: ['simulate'],
	category: 'Owner',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ from, args, message }, client, store) {
		if (args.length === 1) {
			return await client.reply(from, 'You must provide a status to simulate', message);
		}

		const type = args[1]?.toLowerCase();

		if (['online', 'on'].includes(type)) {
			return handleToggle({
				key: 'available',
				from,
				args,
				message,
				client,
				store,
				statusLabel: { on: 'Available', off: 'Unavailable' },
				usageHint: 'Usage: !presence online [enable|disable|status]',
				async onEnable() {
					if ('available' in configuration.presences) {
						return await client.reply(from, 'Already online', message);
					}

					if ('unavailable' in configuration.presences) {
						await pauseAll(client, store);
						clearInterval(configuration.presences.unavailable.interval);
						delete configuration.presences.unavailable;
					}

					if (from) {
						await client.reply(from, 'Simulate Available Presence Enabled', message);
					}
				},
				async onDisable() {
					if ('unavailable' in configuration.presences) {
						return await client.reply(from, 'Already offline', message);
					}

					if ('available' in configuration.presences) {
						delete configuration.presences.available;
					}

					configuration.presences.unavailable = {
						status: PRESENCE_TYPES.unavailable,
						started: Date.now(),
						interval: setInterval(() => broadcastPresence(client, store, 'unavailable'), 8_000)
					};

					if (from) {
						await client.reply(from, 'Simulate Available Presence Disabled', message);
					}
				}
			});
		}

		if (['writing', 'mengetik', 'composing'].includes(type)) {
			return handleToggle({
				key: 'composing',
				from,
				args,
				message,
				client,
				store,
				statusLabel: { on: 'Composing', off: 'Not composing' },
				usageHint: 'Usage: !presence composing [enable|disable|status]',
				async onEnable() {
					if ('composing' in configuration.presences) {
						return await client.reply(from, 'Already writing', message);
					}

					configuration.presences.composing = {
						status: PRESENCE_TYPES.composing,
						started: Date.now(),
						interval: setInterval(() => broadcastPresence(client, store, 'composing'), 8_000)
					};

					await client.reply(from, 'Simulate Composing Enabled', message);
				},
				async onDisable() {
					if (!('composing' in configuration.presences)) {
						return await client.reply(from, 'Already not writing', message);
					}

					await pauseAll(client, store);
					clearInterval(configuration.presences.composing.interval);
					delete configuration.presences.composing;
					await client.reply(from, 'Simulate Composing Disabled', message);
				}
			});
		}

		if (['recording', 'vn'].includes(type)) {
			return handleToggle({
				key: 'recording',
				from,
				args,
				message,
				client,
				store,
				statusLabel: { on: 'Recording', off: 'Not recording' },
				usageHint: 'Usage: !presence recording [enable|disable|status]',
				async onEnable() {
					if ('recording' in configuration.presences) {
						return await client.reply(from, 'Already recording', message);
					}

					configuration.presences.recording = {
						status: PRESENCE_TYPES.recording,
						started: Date.now(),
						interval: setInterval(() => broadcastPresence(client, store, 'recording'), 10_000)
					};

					await client.reply(from, 'Simulate Recording Enabled', message);
				},
				async onDisable() {
					if (!('recording' in configuration.presences)) {
						return await client.reply(from, 'Already not recording', message);
					}

					await pauseAll(client, store);
					clearInterval(configuration.presences.recording.interval);
					delete configuration.presences.recording;
					await client.reply(from, 'Simulate Recording Disabled', message);
				}
			});
		}

		if (type === 'bio') {
			return handleToggle({
				key: 'bio',
				from,
				args,
				message,
				client,
				store,
				statusLabel: { on: 'Enabled', off: 'Disabled' },
				usageHint: 'Usage: !presence bio [enable|disable|status]',
				async onEnable() {
					if ('bio' in configuration.presences) {
						return await client.reply(from, 'Already enabled', message);
					}

					configuration.presences.bio = {
						started: Date.now(),
						interval: setInterval(() => updateBio(client), 10_000)
					};

					await client.reply(from, 'Simulate Bio Enabled', message);
				},
				async onDisable() {
					if (!('bio' in configuration.presences)) {
						return await client.reply(from, 'Already disabled', message);
					}

					clearInterval(configuration.presences.bio.interval);
					delete configuration.presences.bio;
					await client.reply(from, 'Simulate Bio Disabled', message);
				}
			});
		}

		await client.reply(from, 'Invalid command', message);
	}
});
