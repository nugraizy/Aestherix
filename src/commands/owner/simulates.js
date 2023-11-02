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
			const time = dayjs().format('HH:mm:ss DD/MM');
			const uptime = getRuntime(process.uptime());
			const bio = `Made by nanda | Void bot info : UPTIME : ${uptime} | TIME : ${time} | Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪`;

			await client[botNum].setStatus(bio);
			return;
		}

		for (const container of containers) {
			if (configuration.presences[presence] === undefined) {
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

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'simulates',
	description: 'Simulates an event update',
	usage: '!simulates <events>',
	aliases: ['simulate'],
	category: 'Owner',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ from, args, message, groupMetadata }, client, store) {
		if (args.length === 1) {
			return await client[botNum].reply('You must provide a status to simulate', { from, quoted: message, groupMetadata });
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
									await client[botNum].reply(
										Object.keys(configuration.presences).includes('available') ? 'Available' : 'Unavailable',
										{ from, quoted: message, groupMetadata }
									);
								}

								break;
							case 'disable':
							case 'off':
								{
									if ('unavailable' in configuration.presences) {
										return await client[botNum].reply('Already offline', { from, quoted: message, groupMetadata });
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
										await client[botNum].reply('Simulate Available Presence Disabled', {
											from,
											quoted: message,
											groupMetadata
										});
									}
								}

								break;
							case 'enable':
							case 'on':
								{
									if ('available' in configuration.presences) {
										return await client[botNum].reply('Already online', { from, quoted: message, groupMetadata });
									}

									if ('unavailable' in configuration.presences) {
										const messages = Object.keys(store.messages);

										pause(client, messages);
										clearInterval(configuration.presences.unavailable.interval);
										delete configuration.presences.unavailable;
									}

									if (from) {
										await client[botNum].reply('Simulate Available Presence Enabled', {
											from,
											quoted: message,
											groupMetadata
										});
									}
								}

								break;
							default:
								{
									await client[botNum].reply('Usage: !presence online [enable|disable|status]', {
										from,
										quoted: message,
										groupMetadata
									});
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
									await client[botNum].reply(
										Object.keys(configuration.presences).includes('composing') ? 'Composing' : 'Not composing',
										{ from, quoted: message, groupMetadata }
									);
								}

								break;
							case 'disable':
							case 'off':
								{
									if (!('composing' in configuration.presences)) {
										return await client[botNum].reply('Already not writing', { from, quoted: message, groupMetadata });
									}

									const messages = Object.keys(store.messages);

									pause(client, messages);
									clearInterval(configuration.presences.composing.interval);
									delete configuration.presences.composing;
									await client[botNum].reply('Simulate Composing Disabled', { from, quoted: message, groupMetadata });
								}

								break;
							case 'enable':
							case 'on':
								{
									if ('composing' in configuration.presences) {
										return await client[botNum].reply('Already writing', { from, quoted: message, groupMetadata });
									}

									configuration.presences.composing = {
										status: WAPresence.composing,
										started,
										interval: setInterval(() => {
											const messages = Object.keys(store.messages);

											events(client, messages, 'composing');
										}, 8_000)
									};
									await client[botNum].reply('Simulate Composing Enabled', { from, quoted: message, groupMetadata });
								}

								break;
							default:
								{
									await client[botNum].reply('Usage: !presence composing [enable|disable|status]', {
										from,
										quoted: message,
										groupMetadata
									});
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
									await client[botNum].reply(
										Object.keys(configuration.presences).includes('recording') ? 'Recording' : 'Not recording',
										{ from, quoted: message, groupMetadata }
									);
								}

								break;
							case 'disable':
							case 'off':
								{
									if (!('recording' in configuration.presences)) {
										return await client[botNum].reply('Already not recording', { from, quoted: message, groupMetadata });
									}

									const messages = Object.keys(store.messages);

									pause(client, messages);
									clearInterval(configuration.presences.recording.interval);
									delete configuration.presences.recording;
									await client[botNum].reply('Simulate Recording Disabled', { from, quoted: message, groupMetadata });
								}

								break;
							case 'enable':
							case 'on':
								{
									if ('recording' in configuration.presences) {
										return await client[botNum].reply('Already recording', { from, quoted: message, groupMetadata });
									}

									configuration.presences.recording = {
										status: WAPresence.recording,
										started,
										interval: setInterval(() => {
											const messages = Object.keys(store.messages);

											events(client, messages, 'recording');
										}, 10_000)
									};
									await client[botNum].reply('Simulate Recording Enabled', { from, quoted: message, groupMetadata });
								}

								break;
							default:
								{
									await client[botNum].reply('Usage: !presence recording [enable|disable|status]', {
										from,
										quoted: message,
										groupMetadata
									});
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
								await client[botNum].reply(Object.keys(configuration.presences).includes('bio') ? 'Enabled' : 'Disabled', {
									from,
									quoted: message,
									groupMetadata
								});
							}

							break;
						case 'disable':
						case 'off':
							{
								if (!('bio' in configuration.presences)) {
									return await client[botNum].reply('Already disabled', { from, quoted: message, groupMetadata });
								}

								clearInterval(configuration.presences.bio.interval);
								delete configuration.presences.bio;
								await client[botNum].reply('Simulate Bio Disabled', { from, quoted: message, groupMetadata });
							}

							break;
						case 'enable':
						case 'on':
							{
								if ('bio' in configuration.presences) {
									return await client[botNum].reply('Already enabled', { from, quoted: message, groupMetadata });
								}

								configuration.presences.bio = {
									status: WAPresence.bio,
									started,
									interval: setInterval(() => events(client, [], 'bio'), 10_000)
								};
								await client[botNum].reply('Simulate Bio Enabled', { from, quoted: message, groupMetadata });
							}

							break;
						default:
							{
								await client[botNum].reply('Usage: !presence bio [enable|disable|status]', {
									from,
									quoted: message,
									groupMetadata
								});
							}

							break;
					}
					break;
				}
				default:
					{
						await client[botNum].reply('Invalid command', { from, quoted: message, groupMetadata });
					}

					break;
			}
		} catch (e) {
			log(e);
		}
	}
};
