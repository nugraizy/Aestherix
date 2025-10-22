import async from 'async';
import parser from 'yargs-parser';

import configuration from '../../helper/index.js';
import { spotifier } from '../../utils/spotifier/index.js';

let isInitForever = false;

const updateSpotifyTracks = () => {
	if (isInitForever) {
		return;
	}

	async.forever(
		async () => {
			const clientMqttListen = configuration.mqtt;

			const data = await spotifier.updateNowPlayingStates();

			if (data !== false) {
				clientMqttListen?.publish(process.env.MQTT_SPOTIFY_PLAYBACK, JSON.stringify({ ...data, status: true }));
			}
		},
		async () => {}
	);

	isInitForever = true;
};

configuration.intervals.spotifyPlaybacks.set('ids', {});

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'spotifyplayerplayback',
	description: 'Enable/Disable Spotify Player Playback.',
	category: 'Debugging',
	usage: '!spotifyplayerplayback',
	aliases: ['spp'],
	cooldown: 5,
	limit: 0,
	status: 'enable',
	async run({ isOwner, query, from, message }, client) {
		if (!isOwner) {
			return;
		}

		const { enable, disable } = parser(query, {
			alias: {
				enable: ['e'],
				disable: ['d']
			},
			configuration: {
				'short-option-groups': false
			}
		});

		/**
		 * @type {{[_: string]: {message: import('../../types/Messages/index.js').WAMessage, enabled: boolean}}}
		 */
		const ids = configuration.intervals.spotifyPlaybacks.get('ids');

		if (!configuration.intervals.spotifyPlaybacks.has('client')) {
			configuration.intervals.spotifyPlaybacks.set('client', client);
			updateSpotifyTracks();
		}

		if (enable) {
			if (ids?.[from]?.enabled) {
				return await client.instance.reply(from, 'Already enabled', message);
			}

			const messageReplies = await client.instance.send(
				from,
				{
					text: 'Enabling Spotify Player Playback...'
				},
				{}
			);

			configuration.intervals.spotifyPlaybacks.set('ids', { ...ids, [from]: { enabled: true, message: messageReplies } });

			return;
		}

		if (disable) {
			if (!ids?.[from]?.enabled) {
				return await client.instance.reply(from, 'Already disabled', message);
			}

			/**
			 * @type {import('../../types/Messages/index.js').WAMessage}
			 */
			const messageToReply = configuration.intervals.spotifyPlaybacks.get('ids')[from].message;

			const messageReplies = await client.instance.send(
				from,
				{
					text: 'Disabling Spotify Player Playback...'
				},
				{ quted: messageToReply }
			);

			configuration.intervals.spotifyPlaybacks.set('ids', { ...ids, [from]: { enabled: false, message: messageReplies } });

			return;
		}
	}
};
