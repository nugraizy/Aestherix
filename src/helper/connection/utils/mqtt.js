import { delay } from '../../../utils/modules/index.js';
import configuration from '../../config/connect.js';
import { S_WHATSAPP_NET } from '../../index.js';

function generatePlaybackStatus({ trackTitle, artists, durationMs, progressMs, isPlaying }) {
	const progressBarLength = 10;
	const progressPercent = (progressMs / durationMs) * 100;
	const progressBarCount = Math.floor((progressPercent / 100) * progressBarLength);

	const progressBar = '-'.repeat(progressBarCount) + 'ˋˏ✄' + '┈'.repeat(progressBarLength - progressBarCount);

	return `${`Spotify On ${isPlaying ? 'Playing' : 'Paused'}`.formatHeaders()}
${artists}
*${trackTitle}*
${progressMs.toTime() || '00'} ${progressBar} ${durationMs.toTime() || '00'}
${' '.repeat(18)}↻ ◁ || ▷ ↺`;
}

/**
 * @param {import('mqtt').Client} mqttInstance
 */
export const connectMqtt = (mqttInstance, reconnecting) => {
	if (reconnecting) {
		if ('spotify' in configuration.presences) {
			clearTimeout(configuration.presences.spotify.timeout);
			delete configuration.presences.spotify;
		}

		if ('freegame' in configuration.intervals) {
			clearInterval(configuration.intervals.freegame);
			configuration.intervals.freegame = null;
		}

		mqttInstance.reconnect();
		return;
	}

	mqttInstance.on('message', async (topic, message) => {
		if (topic === process.env.MQTT_SPOTIFY_BIO) {
			message = message.toString();
			const data = JSON.parse(message);

			if (!data.status) {
				return;
			}

			const content = `Spotify On ${
				data.isPlaying ? 'Play' : 'Paused'
			} :                                                       ${data.artists || ''} - ${data.trackTitle || ''}  ( ${
				data.progressMs?.toTime() || '00'
			} - ${data?.durationMs?.toTime() || '00'} )`;
			const myJid = client?.instance?.decodeJid(instance);
			const myStatus = await client?.instance?.fetchStatus(myJid);

			if (myStatus.status === content) {
				return;
			}

			await client.instance.query({
				tag: 'iq',
				attrs: { to: S_WHATSAPP_NET, type: 'set', xmlns: 'status' },
				content: [{ tag: 'status', attrs: {}, content: Buffer.from(content, 'utf-8') }]
			});
		} else if (topic === process.env.MQTT_FREEGAME) {
			message = message.toString();
			const data = JSON.parse(message);

			if (!data.status) {
				return;
			}

			if (!data.from.length) {
				return;
			}

			const { data: result } = data;

			for (const destination of data.from) {
				const caption = `${'Freegames Notifier'.formatHeaders()}

${result.title}`;

				await client?.instance?.send(destination, {
					image: { url: result.preview.images[0].source.url.replace('amp;', '') },
					caption,
					footer: 'Powered by Hidden Finder',
					templateButtons: [
						{ urlButton: { displayText: 'Open Platform', url: result.url_overridden_by_dest } },
						{ urlButton: { displayText: 'Image Source', url: result.preview.images[0].source.url.replace('amp;', '') } }
					]
				});
				await delay(300);
			}
		} else if (topic === process.env.MQTT_SPOTIFY_PLAYBACK) {
			message = message.toString();
			const data = JSON.parse(message);

			/**
			 * @type {import('../../types/Socket/index.js').AdvancedClient}
			 */
			const client = configuration.intervals.spotifyPlaybacks.get('client');

			const ids = configuration.intervals.spotifyPlaybacks.get('ids');

			if (!data?.durationMs || !data?.progressMs) {
				return;
			}

			const caption = generatePlaybackStatus(data);

			for (const id of Object.keys(ids)) {
				if (!ids[id].enabled) {
					continue;
				}

				client.instance.send(id, {
					edit: ids[id].message.key,
					text: caption
				});
			}
		}
	});
};
