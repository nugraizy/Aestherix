import { S_WHATSAPP_NET } from '../../index.js';
import { delay } from '../../../utils/modules/index.js';
import configuration from '../../config/connect.js';

/**
 * @param {import('mqtt').Client} clientMqttListen
 */
export const connectMqtt = (clientMqttListen) => {
	clientMqttListen.on('message', async (topic, message) => {
		if (topic === process.env.MQTT_TOPIC) {
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
			const myStatus = await client?.[botNum]?.fetchStatus(`${botNum.split(':')[0]}${S_WHATSAPP_NET}`);

			if (myStatus.status === content) {
				return;
			}

			await client[botNum].query({
				tag: 'iq',
				attrs: { to: S_WHATSAPP_NET, type: 'set', xmlns: 'status' },
				content: [{ tag: 'status', attrs: {}, content: Buffer.from(content, 'utf-8') }]
			});
		} else if (topic === process.env.FREEGAME_TOPIC) {
			message = message.toString();
			const data = JSON.parse(message);

			if (!data.status) {
				return;
			}

			if (!data.from.length === 0) {
				return;
			}

			const { data: result } = data;

			for (const destination of data.from) {
				const caption = `${'Freegames Notifier'.formatHeaders()}

${result.title}`;

				await client?.[botNum]?.send(destination, {
					image: { url: result.preview.images[0].source.url.replace('amp;', '') },
					caption,
					footer: 'Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪',
					templateButtons: [
						{ urlButton: { displayText: 'Open Platform', url: result.url_overridden_by_dest } },
						{ urlButton: { displayText: 'Image Source', url: result.preview.images[0].source.url.replace('amp;', '') } }
					]
				});
				await delay(300);
			}
		}
	});
};

/**
 *
 * @param {typeof connectMqtt} connection
 * @param {import('mqtt').Client} clientMqttListen
 */
export const reconnectMqttConnection = (connection, clientMqttListen) => {
	if ('spotify' in configuration.presences) {
		clearTimeout(configuration.presences.spotify.timeout);
		delete configuration.presences.spotify;
	}

	if ('freegame' in configuration.intervals) {
		clearInterval(configuration.intervals.freegame);
		configuration.intervals.freegame = null;
	}

	connection(clientMqttListen);
};
