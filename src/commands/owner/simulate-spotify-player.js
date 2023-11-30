import async from 'async';
import mqtt from 'mqtt';

import configuration from '../../helper/config/connect.js';
import { spotifier } from '../../utils/spotifier/index.js';
import { delay } from '../../utils/modules/index.js';

const clientMqttListen = mqtt.connect(process.env.MQTT_URL);

const updateSpotifyTracks = () => {
	async.forever(
		async (next) => {
			if (configuration.presences?.spotify?.timeout === undefined) {
				next();
			}

			await delay(5_000);
			const data = await spotifier.updateNowPlayingStates();

			if (data !== false) {
				clientMqttListen.publish(process.env.MQTT_SPOTIFY_BIO, JSON.stringify({ ...data, status: true }));
			}
		},
		async () => {}
	);
};

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'spotifyplayer',
	minifiedDescription: 'Simulate Spotify',
	description: 'Simulates a spotify player on bio',
	usage: '!spotifyplayer <enable|disable>',
	aliases: ['spotifybio'],
	category: 'Owner',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ from, args, message, query, groupMetadata }, client) {
		if (!query) {
			return await client.instance.reply('You must provide a status to simulate', { from, quoted: message, groupMetadata });
		}

		const started = Date.now();

		try {
			switch (args[1]?.toLowerCase()) {
				case 'status':
				case 'stats':
					{
						await client.instance.reply(Object.keys(configuration.presences).includes('spotify') ? 'Enabled' : 'Disabled', {
							from,
							quoted: message,
							groupMetadata
						});
					}

					break;
				case 'disable':
				case 'off':
					{
						if (!('spotify' in configuration.presences)) {
							return await client.instance.reply('Already disabled', { from, quoted: message, groupMetadata });
						}

						clearTimeout(configuration.presences.spotify.timeout);
						delete configuration.presences.spotify;
						await client.instance.reply('Simulate Spotify Player Bio Disabled', { from, quoted: message, groupMetadata });
					}

					break;
				case 'enable':
				case 'on':
					{
						if ('spotify' in configuration.presences) {
							return await client.instance.reply('Already enabled', { from, quoted: message, groupMetadata });
						}

						configuration.presences.spotify = { started, timeout: setTimeout(() => updateSpotifyTracks(), 0) };
						await client.instance.reply('Simulate Spotify Player Bio Enabled', { from, quoted: message, groupMetadata });
					}

					break;
				default:
					{
						await client.instance.reply('Usage: !spotifyplayer [enable|disable|status]', {
							from,
							quoted: message,
							groupMetadata
						});
					}

					break;
			}
		} catch (e) {
			log(e);
		}
	}
};
