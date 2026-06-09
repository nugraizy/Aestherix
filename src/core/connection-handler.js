import { Boom } from '@hapi/boom';
import { DisconnectReason } from 'baileys';

import configuration from '../helper/config/connect.js';
import prisma from '../helper/database/prisma.js';
import { cmdId } from '../helper/modules/prefix.js';
import { color, delay } from '../utils/modules/index.js';
import { cleanupSession } from './session-cleanup.js';

const MAX_RETRIES = 5;
const RETRY_INTERVAL_MS = 5000;

let metricsPrinted = false;

export class ConnectionHandler {
	#client;
	#configuration;
	#options;
	#retryCount = 0;
	#startedAt = null;
	#commandsLoaded = false;
	#shouldWait = false;
	#isShuttingDown = false;

	constructor(client, { configuration: config, options = {} }) {
		this.#client = client;
		this.#configuration = config ?? configuration;
		this.#options = options;
	}

	get #log() {
		return this.#client.logger;
	}

	async handle(update) {
		const { connection, lastDisconnect, receivedPendingNotifications } = update;

		if (this.#client.role !== 'primary') {
			return;
		}

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
			this.#log.error(color('Connection update handler failed:', 'red'), error);
			this.#reconnect();
		}
	}

	async #handleClose(lastDisconnect) {
		const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;

		if (reason === DisconnectReason.badSession || reason === DisconnectReason.loggedOut) {
			const label = reason === DisconnectReason.badSession ? 'Bad session' : 'Logged out';

			this.#log.error(color(label, 'white'), color('Cleaning up session...', 'lilac'));
			await cleanupSession(this.#client.sessionName);

			if (this.#client.role === 'primary') {
				process.exit(0);
			}

			if (this.#configuration.logMultiplexer) {
				this.#configuration.logMultiplexer.unregister(`SUB-${this.#client.sessionName}`);
			}

			this.#configuration.core?.manager?.remove(this.#client.sessionName);
			return;
		}

		if (reason === DisconnectReason.restartRequired) {
			this.#log.warning(color('Restart required', 'white'), color('Restarting your Socket...', 'lilac'));
		}

		if (this.#client.role !== 'primary') {
			this.#log.warning(color('Connection closed', 'white'), color(`reason: ${reason}`, 'lilac'));
			return;
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
				this.#log.error(color('Max retry attempts reached', 'white'), color('Please try again later...', 'lilac'));
				await this.#shutdown();
				return;
			}

			this.#log.warning(
				color(`Reconnect attempt ${this.#retryCount} failed. Retrying in ${RETRY_INTERVAL_MS / 1000} seconds...`, 'white')
			);
			await delay(RETRY_INTERVAL_MS);
			this.#retryCount++;
			this.#reconnect();
		} else {
			if (this.#retryCount >= MAX_RETRIES) {
				this.#log.error(color('Max retry attempts reached', 'white'), color('Please try again later...', 'lilac'));
				await this.#shutdown();
				return;
			}

			this.#log.warning(color('Unknown reason', 'white'), color(`Reconnecting in ${RETRY_INTERVAL_MS / 1000}s...`, 'lilac'));
			await delay(RETRY_INTERVAL_MS);
			this.#retryCount++;
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

		if (!metricsPrinted) {
			this.#log.info(color('Socket connected', 'white'), color('Successfully', 'lilac') + color('.', 'white'));
			await this.#printConnectionMetrics(this.#client);
			metricsPrinted = true;
		}

		this.#retryCount = 0;
		this.#client.emit('connected');
	}

	async #printConnectionMetrics(client) {
		const builder = new client.TemplateBuilder.Native();
		const timeToConnect = process.uptime();
		const buttons = [];
		let caption = '';

		const getPlatform = (platform) => {
			const map = { iphone: 'iPhone', android: 'Android', smbi: 'iPhone Business' };

			return map[platform] || 'Android Business';
		};

		this.#log.info(color('Device Platform', 'white'), color(getPlatform(client.authState.creds.platform), '#E4C1F9'));
		this.#log.info(color('Connection time', 'white'), color(`${timeToConnect}s`, 'lilac'));

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

		const store = this.#client.store;

		this.#client.connect({ store, prisma }).catch((err) => {
			this.#log.error(color('Reconnect failed:', 'red'), color(err.message, 'white'));
		});
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
				this.#log.warning(color('Shutting down', 'white'), color(name, 'lilac'), color('server...', 'white'));

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
