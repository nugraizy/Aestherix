import fs from 'fs-extra';
import baileys, { delay, makeCacheableSignalKeyStore } from '@adiwajshing/baileys';
import P from 'pino';
import yn from 'yn';
import PhoneNumber from 'libphonenumber-js';
import inquirer from 'inquirer';
import NodeCache from 'node-cache';
import clip from 'clipboardy';

import { clearDBConnection } from './reset-session.js';
import { patchInteractiveMessage } from '../utils/patch-message.js';
import { Cache } from '../../modules/cache.js';
import { ERRLOG, INFOLOG, color } from '../../../utils/modules/index.js';

const msgRetryCounterCache = new NodeCache();
const SETTINGS = await fs.readJSON('./src/helper/config/settings.json');
const { default: makeWASocket, makeInMemoryStore, DEFAULT_CONNECTION_CONFIG } = baileys;
const logger = (OPTIONS) => P({ level: OPTIONS.trace ? 'trace' : OPTIONS.debugMode ? 'debug' : 'fatal' });
const question = (text) =>
	new Promise(async (resolve) => {
		const ask = await inquirer.prompt([
			{
				type: 'input',
				name: 'text',
				message: text,
				prefix: ''
			}
		]);

		resolve(ask.text);
	});

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
	 * @type {Store}
	 */
	const store = makeInMemoryStore({ logger: P().child({ level: 'fatal', stream: 'store' }) });

	global.store = store;

	/**
	 * @type {import('@adiwajshing/baileys').UserFacingSocketConfig}
	 */
	const CONNECTION_CONFIG = {
		msgRetryCounterCache,
		printQRInTerminal: !OPTIONS.pairMode,
		mobile: false,
		browser: ['Chrome (Linux)', '', ''],
		version: [2, 2408, 1],
		logger: logger(OPTIONS),
		auth: {
			creds: state.creds,
			keys: makeCacheableSignalKeyStore(state.keys, logger(OPTIONS))
		},
		markOnlineOnConnect: false,
		shouldSyncHistoryMessage: () => true,
		getMessage: (key) => {
			if (store) {
				const { id, remoteJid } = key;
				const message = store.loadMessage(remoteJid, id);

				if (message) {
					return message.message;
				}
			}

			return { conversation: 'Success syncing. Please resend the command again.' };
		},
		generateHighQualityLinkPreview: true,
		linkPreviewImageThumbnailWidth: 2,
		mediaCache: new Cache(),
		userDevicesCache: new Cache(),
		patchMessageBeforeSending: patchInteractiveMessage,
		customId: 'HFINDER',
		defaultQueryTimeoutMs: 0
	};

	if (OPTIONS.json) {
		await storeToJson(cli, store, OPTIONS); /* eslint-disable-line */
	}

	/**
	 * @type {ClientSocket}
	 */
	const Client = makeWASocket(CONNECTION_CONFIG);

	store.bind(Client.ev);

	await handleNewInstance({ OPTIONS, Client });

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

const selectHostNumber = async ({ hostNumber, backupsHostNumbers }) => {
	const { hosts } = await inquirer.prompt([
		{
			type: 'list',
			name: 'hosts',
			message: 'Select host number',
			choices: [
				...[hostNumber, ...backupsHostNumbers].map((v) => PhoneNumber('+' + v.replace(/[^0-9]/g, '')).formatInternational()),
				new inquirer.Separator(),
				'New number'
			],
			prefix: ''
		}
	]);

	if (hosts === 'New number') {
		return await inputPhoneNumber();
	}

	return hosts.replace(/[^0-9]/g, '');
};

const inputPhoneNumber = async () => {
	await delay(1000);
	const phoneNumber = await question(
		INFOLOG(color('Insert your phone number', '#E4C1F9'), color(':', '#ffff'), { ignore: true })
	);

	const formattedPhoneNumber = '+' + phoneNumber.trim().replace(/[^0-9]/g, '');
	const numberFormat = PhoneNumber(formattedPhoneNumber);

	if (!numberFormat.isValid()) {
		ERRLOG(color('Invalid phone number', 'red'));
		return await inputPhoneNumber();
	}

	return formattedPhoneNumber.replace(/[^0-9]/g, '');
};

const askInputNumber = async ({ hostNumber, backupsHostNumbers }) => {
	if (backupsHostNumbers.length) {
		return await selectHostNumber({ hostNumber, backupsHostNumbers });
	}

	return await inputPhoneNumber();
};

const askWantNumber = async ({ hostNumber, backupsHostNumbers }) => {
	const isWantNumber = await question(
		INFOLOG(
			color('Do you want to use a new number?', '#E4C1F9'),
			color('(', 'gray') + color('default', '#fff'),
			color(`${PhoneNumber('+' + hostNumber.replace(/[^0-9]/g, '')).formatInternational()})`, 'gray'),
			color('[y/n]: ', 'white'),
			{ ignore: true }
		)
	);

	const answer = yn(isWantNumber);

	if (answer === undefined) {
		ERRLOG(color('Please answer with', 'red'), color('[y/n]', 'white'));
		await delay(1000);
		return await askWantNumber({ hostNumber, backupsHostNumbers });
	}

	return answer ? await askInputNumber({ hostNumber, backupsHostNumbers }) : hostNumber;
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

		INFOLOG(
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
			.then(() => {
				INFOLOG(color('Pairing code has been copied to clipboard!', 'white'));
			})
			.catch(() => {
				ERRLOG(color('SSH detected.', 'red'), color('Could not copy the code.', 'gray'));
			});
		await delay(200);
		INFOLOG(color('Waiting for code input', 'white'), color('. . .', '#FF99C8'));
	}
};
