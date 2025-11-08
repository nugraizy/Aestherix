import dayjs from 'dayjs';

import configuration from '../../helper/config/connect.js';
import { getRuntime } from '../../utils/modules/index.js';

const WAPresence = {
	available: 'available',
	unavailable: 'unavailable',
	composing: 'composing',
	recording: 'recording',
	paused: 'paused'
};

const events = async (client, containers, presence) => {
	try {
		if (presence === 'bio') {
			const time = dayjs.tz().format('HH:mm:ss DD/MM');
			const uptime = getRuntime(process.uptime());
			const bio = `Made by nanda | ${__botName} Bot Info : UPTIME : ${uptime} | TIME : ${time} | Powered by Hidden Finder`;

			await client.instance.setStatus(bio);
			return;
		}

		for (const container of containers) {
			if (configuration.presences[presence] === undefined) {
				break;
			}

			await client.instance.sendPresenceUpdate(WAPresence[presence], container);
		}
	} catch (e) {
		log(e);
	}
};

const pause = async (client, containers) => {
	try {
		for (const container of containers) {
			await client.instance.sendPresenceUpdate(WAPresence.paused, container);
		}
	} catch (e) {
		log(e);
	}
};

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
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
			return await client.instance.reply(from, 'You must provide a status to simulate', message);
		}

		const started = Date.now();

		try {
			switch (args[1]?.toLowerCase()) {
				case 'online':
				case 'on':
					{
						switch (args[2]?.toLowerCase()) {
							case 'status':
							case 'stats':
								{
									await client.instance.reply(
										from,
										Object.keys(configuration.presences).includes('available') ? 'Available' : 'Unavailable',
										message
									);
								}

								break;
							case 'disable':
							case 'off':
								{
									if ('unavailable' in configuration.presences) {
										return await client.instance.reply(from, 'Already offline', message);
									}

									if ('available' in configuration.presences) {
										delete configuration.presences.available;
									}

									configuration.presences.unavailable = {
										status: WAPresence.unavailable,
										started,
										interval: setInterval(() => {
											const messages = Object.keys(store.messages);

											events(client, messages, 'unavailable');
										}, 8_000)
									};

									if (from) {
										await client.instance.reply(from, 'Simulate Available Presence Disabled', message);
									}
								}

								break;
							case 'enable':
							case 'on':
								{
									if ('available' in configuration.presences) {
										return await client.instance.reply(from, 'Already online', message);
									}

									if ('unavailable' in configuration.presences) {
										const messages = Object.keys(store.messages);

										pause(client, messages);
										clearInterval(configuration.presences.unavailable.interval);
										delete configuration.presences.unavailable;
									}

									if (from) {
										await client.instance.reply(from, 'Simulate Available Presence Enabled', message);
									}
								}

								break;
							default:
								{
									await client.instance.reply(from, 'Usage: !presence online [enable|disable|status]', message);
								}

								break;
						}
					}

					break;
				case 'writing':
				case 'mengetik':
				case 'composing':
					{
						switch (args[2]?.toLowerCase()) {
							case 'status':
							case 'stats':
								{
									await client.instance.reply(
										from,
										Object.keys(configuration.presences).includes('composing') ? 'Composing' : 'Not composing',
										message
									);
								}

								break;
							case 'disable':
							case 'off':
								{
									if (!('composing' in configuration.presences)) {
										return await client.instance.reply(from, 'Already not writing', message);
									}

									const messages = Object.keys(store.messages);

									pause(client, messages);
									clearInterval(configuration.presences.composing.interval);
									delete configuration.presences.composing;
									await client.instance.reply(from, 'Simulate Composing Disabled', message);
								}

								break;
							case 'enable':
							case 'on':
								{
									if ('composing' in configuration.presences) {
										return await client.instance.reply(from, 'Already writing', message);
									}

									configuration.presences.composing = {
										status: WAPresence.composing,
										started,
										interval: setInterval(() => {
											const messages = Object.keys(store.messages);

											events(client, messages, 'composing');
										}, 8_000)
									};
									await client.instance.reply(from, 'Simulate Composing Enabled', message);
								}

								break;
							default:
								{
									await client.instance.reply(from, 'Usage: !presence composing [enable|disable|status]', message);
								}

								break;
						}
					}

					break;
				case 'recording':
				case 'vn':
					{
						switch (args[2]?.toLowerCase()) {
							case 'status':
							case 'stats':
								{
									await client.instance.reply(
										from,
										Object.keys(configuration.presences).includes('recording') ? 'Recording' : 'Not recording',
										message
									);
								}

								break;
							case 'disable':
							case 'off':
								{
									if (!('recording' in configuration.presences)) {
										return await client.instance.reply(from, 'Already not recording', message);
									}

									const messages = Object.keys(store.messages);

									pause(client, messages);
									clearInterval(configuration.presences.recording.interval);
									delete configuration.presences.recording;
									await client.instance.reply(from, 'Simulate Recording Disabled', message);
								}

								break;
							case 'enable':
							case 'on':
								{
									if ('recording' in configuration.presences) {
										return await client.instance.reply(from, 'Already recording', message);
									}

									configuration.presences.recording = {
										status: WAPresence.recording,
										started,
										interval: setInterval(() => {
											const messages = Object.keys(store.messages);

											events(client, messages, 'recording');
										}, 10_000)
									};
									await client.instance.reply(from, 'Simulate Recording Enabled', message);
								}

								break;
							default:
								{
									await client.instance.reply(from, 'Usage: !presence recording [enable|disable|status]', message);
								}

								break;
						}
					}

					break;
				case 'bio': {
					switch (args[2]?.toLowerCase()) {
						case 'status':
						case 'stats':
							{
								await client.instance.reply(
									from,
									Object.keys(configuration.presences).includes('bio') ? 'Enabled' : 'Disabled',
									message
								);
							}

							break;
						case 'disable':
						case 'off':
							{
								if (!('bio' in configuration.presences)) {
									return await client.instance.reply(from, 'Already disabled', message);
								}

								clearInterval(configuration.presences.bio.interval);
								delete configuration.presences.bio;
								await client.instance.reply(from, 'Simulate Bio Disabled', message);
							}

							break;
						case 'enable':
						case 'on':
							{
								if ('bio' in configuration.presences) {
									return await client.instance.reply(from, 'Already enabled', message);
								}

								configuration.presences.bio = {
									status: WAPresence.bio,
									started,
									interval: setInterval(() => events(client, [], 'bio'), 10_000)
								};
								await client.instance.reply(from, 'Simulate Bio Enabled', message);
							}

							break;
						default:
							{
								await client.instance.reply(from, 'Usage: !presence bio [enable|disable|status]', message);
							}

							break;
					}
					break;
				}
				default:
					{
						await client.instance.reply(from, 'Invalid command', message);
					}

					break;
			}
		} catch (e) {
			log(e);
		}
	}
};
