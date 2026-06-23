import mqtt from 'mqtt';

import configuration from '../helper/config/connect.js';
import { getLocale, t, useLocale } from '../helper/i18n/index.js';
import { S_WHATSAPP_NET } from '../helper/misc/wa_data/index.js';
import { delay } from '../utils/modules/index.js';

function generatePlaybackStatus({ trackTitle, artists, durationMs, progressMs, isPlaying }) {
	const barLength = 10;
	const filled = Math.floor((progressMs / durationMs) * barLength);
	const bar = '-'.repeat(filled) + 'ˋˏ✄' + '┈'.repeat(barLength - filled);

	return `${`Spotify On ${isPlaying ? 'Playing' : 'Paused'}`.formatHeaders()}
${artists}
*${trackTitle}*
${progressMs.toTime() || '00'} ${bar} ${durationMs.toTime() || '00'}
${' '.repeat(18)}↻ ◁ || ▷ ↺`;
}

export class MqttBridge {
	#client = null;
	#waClient = null;
	#topics;
	#url;
	#bound = false;

	constructor(options = {}) {
		this.#url = options.url || process.env.MQTT_URL;
		this.#topics = {
			spotifyBio: options.spotifyBio || process.env.MQTT_SPOTIFY_BIO,
			freegame: options.freegame || process.env.MQTT_FREEGAME,
			spotifyPlayback: options.spotifyPlayback || process.env.MQTT_SPOTIFY_PLAYBACK
		};
	}

	get client() {
		return this.#client;
	}

	get connected() {
		return this.#client?.connected ?? false;
	}

	/**
	 * Inject the active WhatsApp client. Required before
	 * `#handleSpotifyBio` and `#handleFreegame` can run.
	 *
	 * @param {object} waClient
	 */
	setClient(waClient) {
		this.#waClient = waClient;
	}

	connect() {
		if (this.#client) {
			return this;
		}

		this.#client = mqtt.connect(this.#url);

		this.#client.on('connect', () => {
			this.#client.subscribe(this.#topics.spotifyBio);
			this.#client.subscribe(this.#topics.freegame);
			this.#client.subscribe(this.#topics.spotifyPlayback);
			configuration.mqtt = this.#client;
		});

		return this;
	}

	reconnect() {
		if ('spotify' in configuration.presences) {
			clearTimeout(configuration.presences.spotify.timeout);
			delete configuration.presences.spotify;
		}

		if (configuration.timers.freegame) {
			clearInterval(configuration.timers.freegame);
			configuration.timers.freegame = null;
		}

		this.#client?.reconnect();
	}

	bindMessageHandler() {
		if (this.#bound || !this.#client) {
			return;
		}

		this.#bound = true;

		this.#client.on('message', async (topic, message) => {
			const payload = JSON.parse(message.toString());

			if (!payload.status) {
				return;
			}

			if (topic === this.#topics.spotifyBio) {
				await this.#handleSpotifyBio(payload);
			} else if (topic === this.#topics.freegame) {
				await this.#handleFreegame(payload);
			} else if (topic === this.#topics.spotifyPlayback) {
				this.#handleSpotifyPlayback(payload);
			}
		});
	}

	disconnect() {
		this.#client?.end();
		this.#client = null;
		this.#bound = false;
	}

	async #handleSpotifyBio(data) {
		if (!this.#waClient?.user?.id) {
			return;
		}

		const content = `Spotify On ${data.isPlaying ? 'Play' : 'Paused'} :                                                       ${data.artists || ''} - ${data.trackTitle || ''}  ( ${data.progressMs?.toTime() || '00'} - ${data?.durationMs?.toTime() || '00'} )`;

		const myJid = this.#waClient.decodeJid(this.#waClient.user.id);
		const myStatus = await this.#waClient.fetchStatus(myJid);

		if (myStatus?.status === content) {
			return;
		}

		await this.#waClient.query({
			tag: 'iq',
			attrs: { to: S_WHATSAPP_NET, type: 'set', xmlns: 'status' },
			content: [{ tag: 'status', attrs: {}, content: Buffer.from(content, 'utf-8') }]
		});
	}

	async #handleFreegame(data) {
		if (!this.#waClient || !data.from?.length) {
			return;
		}

		const { data: result } = data;
		const locale = await getLocale();
		const L = useLocale(locale, 'common');

		for (const destination of data.from) {
			const caption = `${L.core.mqtt.freegamesNotifier.formatHeaders()}\n\n${result.title}`;

			await this.#waClient.send(destination, {
				image: { url: result.preview.images[0].source.url.replace('amp;', '') },
				caption,
				footer: t(locale, 'common.core.dashboard.poweredBy', ['Hidden Finder']),
				templateButtons: [
					{ urlButton: { displayText: L.core.mqtt.openPlatform, url: result.url_overridden_by_dest } },
					{ urlButton: { displayText: L.core.mqtt.imageSource, url: result.preview.images[0].source.url.replace('amp;', '') } }
				]
			});
			await delay(300);
		}
	}

	#handleSpotifyPlayback(data) {
		if (!data?.durationMs || !data?.progressMs) {
			return;
		}

		const waClient = configuration.timers.spotifyPlaybacks.get('client');
		const ids = configuration.timers.spotifyPlaybacks.get('ids');

		if (!waClient || !ids) {
			return;
		}

		const caption = generatePlaybackStatus(data);

		for (const id of Object.keys(ids)) {
			if (!ids[id].enabled) {
				continue;
			}

			waClient.send(id, { edit: ids[id].message.key, text: caption });
		}
	}
}
