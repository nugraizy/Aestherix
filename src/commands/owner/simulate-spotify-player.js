import async from 'async';

import configuration from '../../helper/config/connect.js';
import { spotifier } from '../../utils/spotifier/index.js';
import { delay } from '../../utils/modules/index.js';

function startSpotifyPolling() {
	async.forever(async (next) => {
		if (configuration.presences?.spotify?.timeout === undefined) {
			next();
		}

		await delay(5_000);

		const data = await spotifier.updateNowPlayingStates();

		if (data !== false) {
			configuration.mqtt?.publish(process.env.MQTT_SPOTIFY_BIO, JSON.stringify({ ...data, status: true }));
		}
	}, () => {});
}

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
			return await client.reply(from, 'You must provide a status to simulate', message);
		}

		const action = args[1]?.toLowerCase();

		if (['status', 'stats'].includes(action)) {
			return await client.reply(from, 'spotify' in configuration.presences ? 'Enabled' : 'Disabled', message);
		}

		if (['disable', 'off'].includes(action)) {
			if (!('spotify' in configuration.presences)) {
				return await client.reply(from, 'Already disabled', message);
			}

			clearTimeout(configuration.presences.spotify.timeout);
			delete configuration.presences.spotify;
			return await client.reply(from, 'Simulate Spotify Player Bio Disabled', message);
		}

		if (['enable', 'on'].includes(action)) {
			if ('spotify' in configuration.presences) {
				return await client.reply(from, 'Already enabled', message);
			}

			configuration.presences.spotify = { started: Date.now(), timeout: setTimeout(() => startSpotifyPolling(), 0) };
			return await client.reply(from, 'Simulate Spotify Player Bio Enabled', message);
		}

		await client.reply(from, 'Usage: !spotifyplayer [enable|disable|status]', message);
	}
};
