import async from 'async';

import configuration from '../../helper/config/connect.js';
import { spotifier } from '../../utils/spotifier/index.js';
import { delay } from '../../utils/modules/index.js';

const updateSpotifyTracks = () => {
	async.forever(
		async (next) => {
			if (configuration.presences?.spotify?.timeout === undefined) {
				next();
			}

			const clientMqttListen = configuration.mqtt;

			await delay(5_000);
			const data = await spotifier.updateNowPlayingStates();

			if (data !== false) {
				clientMqttListen?.publish(process.env.MQTT_SPOTIFY_BIO, JSON.stringify({ ...data, status: true }));
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
	usage: '!spotifyplayer `<enable/disable>`',
	aliases: ['spotifybio'],
	category: 'Owner',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ from, args, message, query }, client) {
		if (!query) {
			return await client.instance.reply(from, 'You must provide a status to simulate', message);
		}

		const started = Date.now();

		try {
			switch (args[1]?.toLowerCase()) {
				case 'status':
				case 'stats':
					{
						await client.instance.reply(
							from,
							Object.keys(configuration.presences).includes('spotify') ? 'Enabled' : 'Disabled',
							message
						);
					}

					break;
				case 'disable':
				case 'off':
					{
						if (!('spotify' in configuration.presences)) {
							return await client.instance.reply(from, 'Already disabled', message);
						}

						clearTimeout(configuration.presences.spotify.timeout);
						delete configuration.presences.spotify;
						await client.instance.reply(from, 'Simulate Spotify Player Bio Disabled', message);
					}

					break;
				case 'enable':
				case 'on':
					{
						if ('spotify' in configuration.presences) {
							return await client.instance.reply(from, 'Already enabled', message);
						}

						configuration.presences.spotify = { started, timeout: setTimeout(() => updateSpotifyTracks(), 0) };
						await client.instance.reply(from, 'Simulate Spotify Player Bio Enabled', message);
					}

					break;
				default:
					{
						await client.instance.reply(from, 'Usage: !spotifyplayer [enable|disable|status]', message);
					}

					break;
			}
		} catch (e) {
			log(e);
		}
	}
};
