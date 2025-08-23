import fs from 'fs-extra';
import _baileys, {
	makeWASocket,
	// makeInMemoryStore,
	useMultiFileAuthState,
	delay,
	makeCacheableSignalKeyStore,
	isJidGroup,
	fetchLatestBaileysVersion
} from 'baileys';
import P from 'pino';
import PhoneNumber from 'libphonenumber-js';
import { input, select, Separator } from '@inquirer/prompts';
import _toggle from 'inquirer-toggle';
import NodeCache from 'node-cache';
import clip from 'clipboardy';

const { proto } = _baileys;

import configuration from '../../config/connect.js';
import { clearDBConnection } from './reset-session.js';
// import { patchInteractiveMessage } from '../utils/patch-message.js';
import { Cache } from '../../modules/cache.js';
import { loggers, color } from '../../../utils/modules/index.js';

const { default: toggle } = _toggle;

const msgRetryCounterCache = new NodeCache();
const SETTINGS = await fs.readJSON('./src/helper/config/settings.json');

const exitOnErr = (e) => {
	if (e.name === 'AbortPromptError') {
		loggers.error(color('Timeout.', 'red'), color('Exiting prompt...', 'grey'));
	}

	process.exit(0);
};
const logger = (OPTIONS) => P({ level: OPTIONS.trace ? 'trace' : OPTIONS.debugMode ? 'debug' : 'fatal' });
const question = (text) =>
	new Promise(async (resolve) => {
		const answer = await input(
			{
				message: text,
				required: true
			},
			{
				signal: AbortSignal.timeout(15000)
			}
		).catch(exitOnErr);

		resolve(answer);
	});

/**
 * @typedef {import('meow').Result} Cli
 * @typedef {import('../../../types/Socket/index.js').ClientSocket} ClientSocket
 * @typedef {import('../../../types/Socket/index.js').Store} Store
 * @typedef {import('./../../../types/Socket/index.js').MultiAuthState['state']} State
 * @param {{cli: Cli, OPTIONS: {[_: string]: boolean}, store: Store}} params
 * @returns {Promise<{Client: ClientSocket, store: Store, state: State, saveCreds: () => Promise<void>}>}
 */
export const connectSocket = async ({ cli, OPTIONS, store }) => {
	/**
	 * @type {import('./types/Socket').MultiAuthState}
	 */
	const { state, saveCreds } = await useMultiFileAuthState(
		`./src/helper/connection/session/${cli.input[0] ?? 'Session-debug'}`
	);

	global.store = store;

	const { version } = await fetchLatestBaileysVersion();

	/**
	 * @type {import('baileys').UserFacingSocketConfig}
	 */
	const CONNECTION_CONFIG = {
		msgRetryCounterCache,
		printQRInTerminal: !OPTIONS.pairMode,
		logger: logger(OPTIONS),
		auth: {
			creds: state.creds,
			keys: makeCacheableSignalKeyStore(state.keys, logger(OPTIONS))
		},
		markOnlineOnConnect: true,
		version,
		getMessage: async (key) => {
			if (store) {
				const msg = await store.loadMessage(key.remoteJid, key.id);

				return msg?.message || undefined;
			}

			return proto.Message.fromObject({});
		},
		generateHighQualityLinkPreview: true,
		linkPreviewImageThumbnailWidth: 2,
		mediaCache: new Cache(),
		userDevicesCache: new Cache(),
		// patchMessageBeforeSending: patchInteractiveMessage,
		customId: 'HFINDER',
		defaultQueryTimeoutMs: 0,
		cachedGroupMetadata: (jid) => (isJidGroup(jid) ? configuration.cache.metadata.get(jid) : {}),
		browser: ['Windows', 'Chrome', 'Chrome 114.0.5735.198']
	};

	if (OPTIONS.json) {
		await storeToJson(cli, store, OPTIONS); /* eslint-disable-line */
	}

	/**
	 * @type {ClientSocket}
	 */
	const Client = makeWASocket(CONNECTION_CONFIG);

	store.bind(Client.ev);

	await handleNewInstance({ OPTIONS, Client }); // eslint-disable-line

	return { Client, store, state, saveCreds };
};

/**
 *
 * @param {Cli} cli
 * @param {Store} store
 * @param {{[_: string]: boolean}} OPTIONS
 */
const storeToJson = async (cli, store, OPTIONS) => {
	if (!(await fs.exists('./src/media/connection_databases/'))) {
		await fs.mkdir('./src/media/connection_databases/');
	}

	if ((await fs.exists(`./src/helper/connection/session/${cli.input[0] ?? 'Session-debug'}`)) && OPTIONS.resetOnStart) {
		await clearDBConnection(cli);
	}

	store.readFromFile(`./src/media/connection_databases/${cli.input[0] ?? 'Session-debug'}.json`);

	setInterval(() => {
		store.writeToFile(`./src/media/connection_databases/${cli.input[0] ?? 'Session-debug'}.json`);
	}, 3 * 1000);
};

const inputPhoneNumber = async () => {
	await delay(1000);
	const phoneNumber = await question(
		loggers.info(color('Insert your phone number', '#E4C1F9'), color(':', '#ffff'), { ignore: true }).trim()
	);

	const formattedPhoneNumber = '+' + phoneNumber.trim().replace(/[^0-9]/g, '');
	const numberFormat = PhoneNumber(formattedPhoneNumber);

	if (!numberFormat?.isValid()) {
		loggers.error(color('Invalid phone number.', 'red'), color('Try again with the valid country code.'));
		return await inputPhoneNumber();
	}

	return formattedPhoneNumber.replace(/[^0-9]/g, '');
};

const selectHostNumber = async ({ hostNumber, backupsHostNumbers }) => {
	const selected = await select(
		{
			message: 'Select host number',
			choices: [
				...[hostNumber, ...backupsHostNumbers].map((v) => {
					const num = PhoneNumber('+' + v.replace(/[^0-9]/g, '')).formatInternational();

					return { name: num, value: v };
				}),
				new Separator(),
				{
					name: 'New number',
					value: 'new'
				}
			]
		},
		{
			signal: AbortSignal.timeout(15000)
		}
	).catch(exitOnErr);

	if (selected === 'new') {
		return await inputPhoneNumber();
	}

	return selected.replace(/[^0-9]/g, '');
};

const askInputNumber = async ({ hostNumber, backupsHostNumbers }) => {
	if (backupsHostNumbers.length) {
		return await selectHostNumber({ hostNumber, backupsHostNumbers });
	}

	return await inputPhoneNumber();
};

const askWantNumber = async ({ hostNumber, backupsHostNumbers }) => {
	const isWantNumber = await toggle({
		message: loggers
			.info(
				color('Do you want to use the default number?', '#E4C1F9'),
				color('(', 'gray') + color('default', '#fff'),
				color(`${PhoneNumber('+' + hostNumber.replace(/[^0-9]/g, '')).formatInternational()})`, 'gray'),
				{ ignore: true }
			)
			.trim(),
		default: false,
		theme: {
			active: 'no',
			inactive: 'yes'
		}
	}).catch(exitOnErr);

	return isWantNumber ? await askInputNumber({ hostNumber, backupsHostNumbers }) : hostNumber;
};

const handleNewInstance = async ({ OPTIONS, Client }) => {
	if (OPTIONS.pairMode && !Client.authState.creds.registered) {
		let phoneNumber = '';

		check: if (!phoneNumber) {
			const { main_host_number: hostNumber = null, backups_host_numbers: backupsHostNumbers = [] } = SETTINGS;

			if (!hostNumber) {
				phoneNumber = await askInputNumber({ hostNumber, backupsHostNumbers });
				SETTINGS.main_host_number = phoneNumber.replace(/[^0-9]/g, ''); // eslint-disable-line
				fs.writeJSON('./src/helper/config/settings.json', SETTINGS);
				break check;
			} else {
				phoneNumber = await askWantNumber({ hostNumber, backupsHostNumbers });
				await delay(1000);
				break check;
			}
		}

		phoneNumber = phoneNumber.trim();

		const code = await Client.requestPairingCode(phoneNumber);

		loggers.info(
			color('Pairing code :', '#E4C1F9'),
			color(
				code.splitString({
					length: 4
				}),
				'white'
			)
		);
		await delay(200);
		await clip
			.write(code)
			.then(() => loggers.info(color('Pairing code has been copied to clipboard!', 'white')))
			.catch(() => loggers.error(color('SSH detected.', 'red'), color('Could not copy the code.', 'gray')));
		await delay(200);
		loggers.warning(color('Waiting for code input', 'white'), color('. . .', '#FF99C8'));
	}
};
