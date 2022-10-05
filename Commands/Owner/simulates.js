/* global botNum, process, log */
import moment from 'moment-timezone';

import configuration from '../../connect.js';
import { getRuntime } from '../../Helper/Modules/index.js';

const WAPresence = {
	available: 'available',
	unavailable: 'unavailable',
	composing: 'composing',
	recording: 'recording',
	paused: 'paused',
};

const events = async (client, containers, presence) => {
	try {
		if (presence === 'bio') {
			const time = moment().format('HH:mm:ss DD/MM');
			const uptime = getRuntime(process.uptime());
			const bio = `Made by nanda | Void bot info : UPTIME : ${uptime} | TIME : ${time} | Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪`;

			await client[botNum].setStatus(bio);
			return;
		}

		for (const container of containers) {
			if (configuration.presences[presence] == undefined) {
				break;
			}

			await client[botNum].sendPresenceUpdate(WAPresence[presence], container);
		}
	} catch (e) {
		log(e);
	}
};

const pause = async (client, containers) => {
	try {
		for (const container of containers) {
			await client[botNum].sendPresenceUpdate(WAPresence.paused, container);
		}
	} catch (e) {
		log(e);
	}
};

export default {
	name: 'simulates',
	description: 'Simulates an event update',
	usage: '!simulates <events>',
	aliases: ['simulate'],
	category: 'Owner',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ isOwner, from, args, message }, client, store) {
		if (!isOwner) {
			return await client[botNum].reply({ from, quoted: message }, 'You are not allowed to use this command');
		}

		if (args.length == 1) {
			return await client[botNum].reply({ from, quoted: message }, 'You must provide a status to simulate');
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
									await client[botNum].reply({ from, quoted: message }, Object.keys(configuration.presences).includes('available') ? 'Available' : 'Unavailable');
								}

								break;
							case 'disable':
							case 'off':
								{
									if ('unavailable' in configuration.presences) {
										return await client[botNum].reply({ from, quoted: message }, 'Already offline');
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
										}, 8_000),
									};

									if (from) {
										await client[botNum].reply({ from, quoted: message }, 'Simulate Available Presence Disabled');
									}
								}

								break;
							case 'enable':
							case 'on':
								{
									if ('available' in configuration.presences) {
										return await client[botNum].reply({ from, quoted: message }, 'Already online');
									}

									if ('unavailable' in configuration.presences) {
										const messages = Object.keys(store.messages);

										pause(client, messages);
										clearInterval(configuration.presences.unavailable.interval);
										delete configuration.presences.unavailable;
									}

									if (from) {
										await client[botNum].reply({ from, quoted: message }, 'Simulate Available Presence Enabled');
									}
								}

								break;
							default:
								{
									await client[botNum].reply({ from, quoted: message }, 'Usage: !presence online [enable|disable|status]');
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
									await client[botNum].reply({ from, quoted: message }, Object.keys(configuration.presences).includes('composing') ? 'Composing' : 'Not composing');
								}

								break;
							case 'disable':
							case 'off':
								{
									if (!('composing' in configuration.presences)) {
										return await client[botNum].reply({ from, quoted: message }, 'Already not writing');
									}

									const messages = Object.keys(store.messages);

									pause(client, messages);
									clearInterval(configuration.presences.composing.interval);
									delete configuration.presences.composing;
									await client[botNum].reply({ from, quoted: message }, 'Simulate Composing Disabled');
								}

								break;
							case 'enable':
							case 'on':
								{
									if ('composing' in configuration.presences) {
										return await client[botNum].reply({ from, quoted: message }, 'Already writing');
									}

									configuration.presences.composing = {
										status: WAPresence.composing,
										started,
										interval: setInterval(() => {
											const messages = Object.keys(store.messages);

											events(client, messages, 'composing');
										}, 8_000),
									};
									await client[botNum].reply({ from, quoted: message }, 'Simulate Composing Enabled');
								}

								break;
							default:
								{
									await client[botNum].reply({ from, quoted: message }, 'Usage: !presence composing [enable|disable|status]');
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
									await client[botNum].reply({ from, quoted: message }, Object.keys(configuration.presences).includes('recording') ? 'Recording' : 'Not recording');
								}

								break;
							case 'disable':
							case 'off':
								{
									if (!('recording' in configuration.presences)) {
										return await client[botNum].reply({ from, quoted: message }, 'Already not recording');
									}

									const messages = Object.keys(store.messages);

									pause(client, messages);
									clearInterval(configuration.presences.recording.interval);
									delete configuration.presences.recording;
									await client[botNum].reply({ from, quoted: message }, 'Simulate Recording Disabled');
								}

								break;
							case 'enable':
							case 'on':
								{
									if ('recording' in configuration.presences) {
										return await client[botNum].reply({ from, quoted: message }, 'Already recording');
									}

									configuration.presences.recording = {
										status: WAPresence.recording,
										started,
										interval: setInterval(() => {
											const messages = Object.keys(store.messages);

											events(client, messages, 'recording');
										}, 10_000),
									};
									await client[botNum].reply({ from, quoted: message }, 'Simulate Recording Enabled');
								}

								break;
							default:
								{
									await client[botNum].reply({ from, quoted: message }, 'Usage: !presence recording [enable|disable|status]');
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
								await client[botNum].reply({ from, quoted: message }, Object.keys(configuration.presences).includes('bio') ? 'Enabled' : 'Disabled');
							}

							break;
						case 'disable':
						case 'off':
							{
								if (!('bio' in configuration.presences)) {
									return await client[botNum].reply({ from, quoted: message }, 'Already disabled');
								}

								clearInterval(configuration.presences.bio.interval);
								delete configuration.presences.bio;
								await client[botNum].reply({ from, quoted: message }, 'Simulate Bio Disabled');
							}

							break;
						case 'enable':
						case 'on':
							{
								if ('bio' in configuration.presences) {
									return await client[botNum].reply({ from, quoted: message }, 'Already enabled');
								}

								configuration.presences.bio = { status: WAPresence.bio, started, interval: setInterval(() => events(client, [], 'bio'), 10_000) };
								await client[botNum].reply({ from, quoted: message }, 'Simulate Bio Enabled');
							}

							break;
						default:
							{
								await client[botNum].reply({ from, quoted: message }, 'Usage: !presence bio [enable|disable|status]');
							}

							break;
					}
					break;
				}
				default:
					{
						await client[botNum].reply({ from, quoted: message }, 'Invalid command');
					}

					break;
			}
		} catch (e) {
			log(e);
		}
	},
};
