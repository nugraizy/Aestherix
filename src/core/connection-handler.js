import { Boom } from '@hapi/boom';
import { DisconnectReason } from 'baileys';
import fs from 'fs-extra';

import configuration from '../helper/config/connect.js';
import prisma from '../helper/database/prisma.js';
import { cmdId } from '../helper/modules/prefix.js';
import { color, delay, loggers } from '../utils/modules/index.js';

const MAX_RETRIES = 5;
const RETRY_INTERVAL_MS = 5000;

export class ConnectionHandler {
	#client;
	#configuration;
	#options;
	#retryCount = 0;
	#startedAt = null;
	#commandsLoaded = false;
	#shouldWait = false;
	#bannerPrinted = false;
	#isShuttingDown = false;

	constructor(client, { configuration: config, options = {} }) {
		this.#client = client;
		this.#configuration = config ?? configuration;
		this.#options = options;
	}

	async handle(update) {
		const { connection, lastDisconnect, receivedPendingNotifications } = update;

		if (!this.#startedAt && connection === 'connecting') {
			this.#startedAt = Date.now();
		}

		try {
			if (connection === 'close') {
				await this.#handleClose(lastDisconnect);
			} else if (connection === 'open') {
				await this.#handleOpen(receivedPendingNotifications);
			}
		} catch (error) {
			console.log(error);
			this.#reconnect();
		}
	}

	async #handleClose(lastDisconnect) {
		const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;

		if (reason === DisconnectReason.badSession || reason === DisconnectReason.loggedOut) {
			const label = reason === DisconnectReason.badSession ? 'Bad session' : 'Logged out';

			loggers.error(color(label, 'white'), color('Please delete your previous session and do a rescan...', 'lilac'));
			await this.#client.resetSession(prisma);
			process.exit(0);
		}

		if (reason === DisconnectReason.restartRequired) {
			loggers.warning(color('Restart required', 'white'), color('Restarting your Socket...', 'lilac'));
		}

		const reconnectable = [
			DisconnectReason.timedOut,
			DisconnectReason.connectionClosed,
			DisconnectReason.connectionReplaced,
			DisconnectReason.connectionLost,
			undefined
		];

		if (reconnectable.includes(reason)) {
			if (this.#retryCount >= MAX_RETRIES) {
				loggers.error(color('Max retry attempts reached', 'white'), color('Please try again later...', 'lilac'));
				await this.#shutdown();
				return;
			}

			loggers.warning(
				color(`Reconnect attempt ${this.#retryCount} failed. Retrying in ${RETRY_INTERVAL_MS / 1000} seconds...`, 'white')
			);
			await delay(RETRY_INTERVAL_MS);
			this.#retryCount++;
			this.#reconnect();
		} else {
			loggers.warning(color('Unknown reason', 'white'), color('Quick reconnecting...', 'lilac'));
			this.#reconnect();
		}
	}

	async #handleOpen(receivedPendingNotifications) {
		if (!this.#commandsLoaded) {
			if (this.#configuration.registry.loadPromise) {
				await this.#configuration.registry.loadPromise;
			}

			this.#commandsLoaded = true;
		}

		this.#configuration.isFirstConnectionForCache = true;

		if (receivedPendingNotifications) {
			this.#shouldWait = true;
		}

		if (!receivedPendingNotifications && this.#shouldWait) {
			this.#shouldWait = false;
		}

		if (receivedPendingNotifications || this.#shouldWait) {
			return;
		}

		global.instance = this.#client.user.id;

		if (!this.#bannerPrinted) {
			loggers.info(color('Socket connected', 'white'), color('Successfully', 'lilac') + color('.', 'white'));
			this.#bannerPrinted = true;
		}

		await this.#printConnectionMetrics(this.#client);

		this.#retryCount = 0;
		this.#client.emit('connected');
	}

	async #printConnectionMetrics(client) {
		const builder = new client.TemplateBuilder.Native();
		const timeToConnect = process.uptime();
		const data = await fs.readJSON('./src/helper/config/settings.json');
		const buttons = [];
		let caption = '';

		const getPlatform = (platform) => {
			const map = { iphone: 'iPhone', android: 'Android', smbi: 'iPhone Business' };

			return map[platform] || 'Android Business';
		};

		loggers.info(color('Device Platform', 'white'), color(getPlatform(client.authState.creds.platform), '#E4C1F9'));
		loggers.info(
			color('Connection time', 'white'),
			color(`${timeToConnect}s`, 'lilac'),
			color(timeToConnect < data.best_time ? 'is the best time' : 'is not the best time', 'white'),
			color('(', 'lilac') + color(`${data.best_time}s`, 'glowYellow') + color(')', '#E4C1F9')
		);

		if (timeToConnect < data.best_time) {
			const bestTime = data.best_time;

			data.best_time = timeToConnect;
			await fs.writeJSON('./src/helper/config/settings.json', data, { spaces: 2 });

			buttons.push(builder.button.url({ display: `Fastest Now ${timeToConnect}s 🎉`, url: 'hello' }));
			buttons.push(builder.button.url({ display: `Previous Best Time ${bestTime}s`, url: 'hello' }));
			caption = 'New Best!';
		} else {
			buttons.push(builder.button.url({ display: `Time Now ${timeToConnect}s`, url: 'hello' }));
			buttons.push(builder.button.url({ display: `Best Time ${data.best_time}s`, url: 'hello' }));
			caption = 'Not the Best.';
		}

		buttons.push(builder.button.reply({ display: 'Ping Bot', id: cmdId('ping') }));

		await builder
			.destination(this.#configuration.owners[0])
			.body('Bot is connected to socket.')
			.footer(caption)
			.buttons(...buttons)
			.send();
	}

	#reconnect() {
		this.#startedAt = Date.now();
		import('../index.js').then((mod) => mod.start());
	}

	async #shutdown() {
		if (this.#isShuttingDown) {
			return;
		}

		this.#isShuttingDown = true;

		if (this.#configuration.dashboard.io) {
			this.#configuration.dashboard.io.disconnectSockets(true);
			this.#configuration.dashboard.io.close();
		}

		const servers = [...this.#configuration.dashboard.expressInstances.entries()];

		await Promise.all(
			servers.map(([name, server]) => {
				loggers.warning(color('Shutting down', 'white'), color(name, 'lilac'), color('server...', 'white'));

				if (typeof server.closeAllConnections === 'function') {
					server.closeAllConnections();
				}

				if (typeof server.closeIdleConnections === 'function') {
					server.closeIdleConnections();
				}

				return new Promise((resolve, reject) => {
					server.close((err) => {
						if (err) {
							return reject(err);
						}

						this.#configuration.dashboard.expressInstances.delete(name);
						resolve();
					});
				});
			})
		);
	}
}
