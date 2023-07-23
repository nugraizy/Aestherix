import fs from 'fs-extra';
import baileys, { makeCacheableSignalKeyStore } from '@adiwajshing/baileys';
import P from 'pino';

import { clearDBConnection } from './reset-session.js';
import { patchInteractiveMessage } from '../utils/patch-message.js';

const { default: makeWASocket, makeInMemoryStore, DEFAULT_CONNECTION_CONFIG } = baileys;
const logger = (OPTIONS) => P({ level: OPTIONS.trace ? 'trace' : OPTIONS.debugMode ? 'debug' : 'fatal' });

export const connectSocket = async ({ cli, OPTIONS, state }) => {
	const CONNECTION_CONFIG = {
		printQRInTerminal: true,
		version: DEFAULT_CONNECTION_CONFIG.version,
		logger: logger(OPTIONS),
		auth: {
			creds: state.creds,
			keys: makeCacheableSignalKeyStore(state.keys, logger(OPTIONS))
		},
		markOnlineOnConnect: false,
		shouldSyncHistoryMessage: () => false,
		getMessage: async () => ({ conversation: 'Success syncing. Please resend the command again.' }),
		generateHighQualityLinkPreview: true,
		linkPreviewImageThumbnailWidth: 2,
		mediaCache: new Map(),
		userDevicesCache: new Map(),
		patchMessageBeforeSending: patchInteractiveMessage
	};

	const store = makeInMemoryStore({ logger: P().child({ level: 'fatal', stream: 'store' }) });

	global.store = store;

	if (OPTIONS.json) {
		await storeToJson(cli, store); /* eslint-disable-line */
	}

	const Client = makeWASocket(CONNECTION_CONFIG);

	store.bind(Client.ev);

	return { Client, store };
};

const storeToJson = async (cli, store) => {
	if (!(await fs.exists('./src/media/connection_databases/'))) {
		await fs.mkdir('./src/media/connection_databases/');
	}

	if (await fs.exists(`./src/helper/connection/session/${cli.input[0] ?? 'Session-debug'}.json`)) {
		await clearDBConnection(cli);
	}

	store.readFromFile(`./src/media/connection_databases/${cli.input[0] ?? 'Session-debug'}.json`);

	setInterval(() => {
		store.writeToFile(`./src/media/connection_databases/${cli.input[0] ?? 'Session-debug'}.json`);
	}, 2 * 1000);
};
