import fs from 'fs-extra';
import baileys, { delay, makeCacheableSignalKeyStore } from '@adiwajshing/baileys';
import P from 'pino';
import readline from 'readline';
import dayjs from 'dayjs';

import { clearDBConnection } from './reset-session.js';
import { patchInteractiveMessage } from '../utils/patch-message.js';
import { Cache } from '../../modules/cache.js';
import { INFOLOG, color } from '../../../utils/modules/index.js';

const { default: makeWASocket, makeInMemoryStore, DEFAULT_CONNECTION_CONFIG } = baileys;
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const logger = (OPTIONS) => P({ level: OPTIONS.trace ? 'trace' : OPTIONS.debugMode ? 'debug' : 'fatal' });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

let phoneNumber;

/**
 * @typedef {import('meow').Result} Cli
 * @typedef {import('../../../types/Socket/index.js').ClientSocket} ClientSocket
 * @typedef {import('../../../types/Socket/index.js').Store} Store
 * @typedef {import('./../../../types/Socket/index.js').SingleAuthState['state']} State
 * @param {{cli: Cli, OPTIONS: {[_: string]: boolean}, state: State}} params
 * @returns {Promise<{Client: ClientSocket, store: Store}>}
 */
export const connectSocket = async ({ cli, OPTIONS, state }) => {
	/**
	 * @type {import('@adiwajshing/baileys').UserFacingSocketConfig}
	 */
	const CONNECTION_CONFIG = {
		printQRInTerminal: !OPTIONS.pairMode,
		mobile: false,
		browser: ['Chrome (Linux)', '', ''],
		version: DEFAULT_CONNECTION_CONFIG.version,
		logger: logger(OPTIONS),
		auth: {
			creds: state.creds,
			keys: makeCacheableSignalKeyStore(state.keys, logger(OPTIONS), new Cache())
		},
		markOnlineOnConnect: false,
		shouldSyncHistoryMessage: () => false,
		getMessage: async () => ({ conversation: 'Success syncing. Please resend the command again.' }),
		generateHighQualityLinkPreview: true,
		linkPreviewImageThumbnailWidth: 2,
		mediaCache: new Cache(),
		userDevicesCache: new Cache(),
		patchMessageBeforeSending: patchInteractiveMessage,
		customId: 'HFINDER'
	};

	/**
	 * @type {Store}
	 */
	const store = makeInMemoryStore({ logger: P().child({ level: 'fatal', stream: 'store' }) });

	global.store = store;

	if (OPTIONS.json) {
		await storeToJson(cli, store, OPTIONS); /* eslint-disable-line */
	}

	/**
	 * @type {ClientSocket}
	 */
	const Client = makeWASocket(CONNECTION_CONFIG);

	store.bind(Client.ev);

	if (OPTIONS.pairMode && !Client.authState.creds.registered) {
		let time = dayjs().format('HH:mm:ss DD/MM');

		check: if (!phoneNumber) {
			const { host_number: hostNumber } = await fs.readJSON('./src/helper/config/settings.json');

			if (!hostNumber) {
				phoneNumber = await question(`[${color(time, 'cyan')}] ${color('Insert your phone number : ', '#ff71ce')}`);

				break check;
			} else {
				await delay(1000);
			}

			phoneNumber = hostNumber;
		}

		phoneNumber = phoneNumber.trim();

		const code = await Client.requestPairingCode(phoneNumber);

		time = dayjs().format('HH:mm:ss DD/MM');
		INFOLOG(`[${color(time, 'cyan')}]`, color('Pairing code :', '#ff71ce'), color(code, 'white'));
		time = dayjs().format('HH:mm:ss DD/MM');
		INFOLOG(`[${color(time, 'cyan')}]`, color('Waiting for code input', '#ff71ce'), color('. . .', 'white'));
	}

	return { Client, store };
};

const storeToJson = async (cli, store, OPTIONS) => {
	if (!(await fs.exists('./src/media/connection_databases/'))) {
		await fs.mkdir('./src/media/connection_databases/');
	}

	if ((await fs.exists(`./src/helper/connection/session/${cli.input[0] ?? 'Session-debug'}.json`)) && OPTIONS.resetOnStart) {
		await clearDBConnection(cli);
	}

	store.readFromFile(`./src/media/connection_databases/${cli.input[0] ?? 'Session-debug'}.json`);

	setInterval(() => {
		store.writeToFile(`./src/media/connection_databases/${cli.input[0] ?? 'Session-debug'}.json`);
	}, 3 * 1000);
};
