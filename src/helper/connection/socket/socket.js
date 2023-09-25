import fs from 'fs-extra';
import baileys, { makeCacheableSignalKeyStore } from '@adiwajshing/baileys';
import P from 'pino';

import { clearDBConnection } from './reset-session.js';
import { patchInteractiveMessage } from '../utils/patch-message.js';
import { Cache } from '../../modules/cache.js';

const { default: makeWASocket, makeInMemoryStore, DEFAULT_CONNECTION_CONFIG } = baileys;
const logger = (OPTIONS) => P({ level: OPTIONS.trace ? 'trace' : OPTIONS.debugMode ? 'debug' : 'fatal' });

/**
 * @typedef {import('meow').Result} Cli
 * @param {{cli: Cli, OPTIONS: {[_: string]: boolean}, state: import('./../type.js').SingleAuthState['state']}} params
 * @returns {Promise<{Client: import('./../type.js').Client, store: import('./../type.js').Store}>}
 */
export const connectSocket = async ({ cli, OPTIONS, state }) => {
	/**
	 * @type {import('@adiwajshing/baileys').UserFacingSocketConfig}
	 */
	const CONNECTION_CONFIG = {
		printQRInTerminal: true,
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
		makeSignalRepository: (state) => state
	};

	/**
	 * @type {import('./../type.js').Store}
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
