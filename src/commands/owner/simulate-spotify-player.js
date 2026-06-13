import async from 'async';

import configuration from '../../helper/config/connect.js';
import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { spotifier } from '../../utils/spotifier/index.js';
import { delay } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';

function startSpotifyPolling() {
	async.forever(
		async (next) => {
			if (configuration.presences?.spotify?.timeout === undefined) {
				next();
			}

			await delay(5_000);

			const data = await spotifier.updateNowPlayingStates();

			if (data !== false) {
				configuration.mqtt?.publish(process.env.MQTT_SPOTIFY_BIO, JSON.stringify({ ...data, status: true }));
			}
		},
		() => {}
	);
}

export default defineCommand({
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
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!query) {
			return await client.reply(from, L.errors.statusRequired, message);
		}

		const action = args[1]?.toLowerCase();

		if (['status', 'stats'].includes(action)) {
			return await client.reply(from, 'spotify' in configuration.presences ? L.success.enabled : L.success.disabled, message);
		}

		if (['disable', 'off'].includes(action)) {
			if (!('spotify' in configuration.presences)) {
				return await client.reply(from, L.errors.alreadyDisabled, message);
			}

			clearTimeout(configuration.presences.spotify.timeout);
			delete configuration.presences.spotify;
			return await client.reply(from, L.simulate.spotifyDisabled, message);
		}

		if (['enable', 'on'].includes(action)) {
			if ('spotify' in configuration.presences) {
				return await client.reply(from, L.errors.alreadyEnabled, message);
			}

			configuration.presences.spotify = { started: Date.now(), timeout: setTimeout(() => startSpotifyPolling(), 0) };
			return await client.reply(from, L.simulate.spotifyEnabled, message);
		}

		await client.reply(from, L.simulate.spotifyUsage, message);
	}
});
