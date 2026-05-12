import { confirm, input, select, Separator } from '@inquirer/prompts';
import _baileys, { delay, fetchLatestBaileysVersion, isJidGroup, makeCacheableSignalKeyStore, makeWASocket } from 'baileys';
import clip from 'clipboardy';
import fs from 'fs-extra';
import PhoneNumber from 'libphonenumber-js';
import NodeCache from 'node-cache';
import P from 'pino';

const { proto } = _baileys;

import { color, loggers } from '../../../utils/modules/index.js';
import configuration from '../../config/connect.js';
import { Auth } from '../../../core/auth.js';
import { manager } from '../../../core/manager.js';
import { useMultiAuthState } from '../../database/auth.js';
import prisma from '../../database/prisma.js';
import { Cache } from '../../modules/cache.js';

const msgRetryCounterCache = new NodeCache();
const SETTINGS = await fs.readJSON('./src/helper/config/settings.json');
const DEFAULT_PROMPT_TIMEOUT = 15 * 1000;
const PAIR_NUMBER_ENV = 'PAIR_NUMBER';

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
				required: true,
				theme: {
					prefix: '✦'
				}
			},
			{
				signal: AbortSignal.timeout(60000)
			}
		).catch(exitOnErr);

		resolve(answer);
	});

/**
 * @typedef {import('meow').Result} Cli
 * @typedef {import('../../../types/Socket/index.js').ClientSocket} ClientSocket
 * @typedef {import('../../../types/Socket/index.js').Store} Store
 * @typedef {import('./../../../types/Socket/index.js').MultiAuthState['state']} State
 * @param {{OPTIONS: {[_: string]: boolean}, store: Store, sessionName: string}} params
 * @returns {Promise<{Client: ClientSocket, store: Store, state: State, saveCreds: () => Promise<void>}>}
 */
export const connectSocket = async ({ OPTIONS, store, sessionName }) => {
	const [authResult, versionResult] = await Promise.all([
		useMultiAuthState(prisma, sessionName).then((result) => {
			return result;
		}),
		fetchLatestBaileysVersion().then((result) => {
			return result;
		})
	]);

	const { state, saveCreds, clearState } = authResult;
	const { version } = versionResult;

	global.store = store;

	const printQRInTerminal = !OPTIONS.pairMode;

	/**
	 * @type {import('baileys').UserFacingSocketConfig}
	 */
	const CONNECTION_CONFIG = {
		msgRetryCounterCache,
		printQRInTerminal,
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
		defaultQueryTimeoutMs: 0,
		cachedGroupMetadata: (jid) => (isJidGroup(jid) ? configuration.cache.metadata.get(jid) : {}),
		browser: ['Mac OS', 'Chrome', 'Chrome 114.0.5735.198'],
		emitOwnEvents: true
	};

	/**
	 * @type {ClientSocket}
	 */
	const Client = makeWASocket(CONNECTION_CONFIG);

	store.bind(Client.ev);

	const auth = new Auth(prisma, sessionName);

	auth._skipInit = true;
	auth._state = state;
	auth._saveCreds = saveCreds;
	auth._clearState = clearState;

	manager.add(sessionName, { socket: Client, auth, store, sessionName, role: 'primary', state: 'connected' });
	configuration.core = { sessionName, manager };

	await handleNewInstance({ OPTIONS, Client }); // eslint-disable-line

	return { Client, store, state, saveCreds, clearState };
};
const inputPhoneNumber = async () => {
	await delay(1000);
	const phoneNumber = await question(
		loggers.info(color('Insert your phone number', 'lilac'), color(':', 'white'), { ignore: true }).trim()
	);

	const formattedPhoneNumber = '+' + phoneNumber.trim().replace(/[^0-9]/g, '');
	const numberFormat = PhoneNumber(formattedPhoneNumber);

	if (!numberFormat?.isValid()) {
		loggers.error(color('Invalid phone number.', 'red'), color('Try again with the valid country code.'));
		return await inputPhoneNumber();
	}

	return formattedPhoneNumber.replace(/[^0-9]/g, '');
};

const normalizePairNumber = (value) => {
	const normalized =
		'+' +
		String(value || '')
			.trim()
			.replace(/[^0-9]/g, '');
	const numberFormat = PhoneNumber(normalized);

	if (!numberFormat?.isValid()) {
		return null;
	}

	return normalized.replace(/[^0-9]/g, '');
};

const selectHostNumber = async ({ hostNumber, backupsHostNumbers }) => {
	const selected = await select(
		{
			message: loggers.info(color('Select host number', 'lilac'), { ignore: true }),
			choices: [
				...[hostNumber, ...backupsHostNumbers].map((v) => {
					const num = PhoneNumber('+' + v.replace(/[^0-9]/g, '')).formatInternational();

					return { name: num, value: v };
				}),
				new Separator(color('⸺⸺⸺⸺⸺❈❖☀❖❈⸺⸺⸺⸺⸺⸺', 'grey')),
				{
					name: 'New number',
					value: 'new',
					description: 'Write your number to use.'
				}
			],
			theme: {
				prefix: '✦',
				icon: {
					cursor: color(' ⇢ ', 'white')
				},

				style: {
					answer: (value) => color(value, 'white'),
					highlight: (value) =>
						`${color(value, 'lilac')} ${color('(', 'gray')}${color('selected', 'white')}${color(')', 'gray')}`,
					description: (value) => color(value, 'grey'),
					keysHelpTip: (keys) => keys.map(([key, action]) => `${key} : ${action}`).join(' | ')
				}
			}
		},
		{
			signal: AbortSignal.timeout(DEFAULT_PROMPT_TIMEOUT)
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
	const useDefaultNumber = await confirm(
		{
			message: loggers.info(
				color('Do you want to use the default number?', 'lilac'),
				color('(', 'gray') + color('default', 'white'),
				color(`${PhoneNumber('+' + hostNumber.replace(/[^0-9]/g, '')).formatInternational()})`, 'green'),
				{ ignore: true }
			),
			default: true
		},
		{ signal: AbortSignal.timeout(DEFAULT_PROMPT_TIMEOUT) }
	).catch(exitOnErr);

	return useDefaultNumber ? hostNumber : await askInputNumber({ hostNumber, backupsHostNumbers });
};

const handleNewInstance = async ({ OPTIONS, Client }) => {
	if (OPTIONS.pairMode && !Client.authState.creds.registered && !Client.authState.creds.me?.id) {
		let phoneNumber = '';
		const nonInteractiveNumber = OPTIONS.pairNumber || process.env[PAIR_NUMBER_ENV];
		const hasTty = Boolean(process.stdin?.isTTY && process.stdout?.isTTY);

		if (nonInteractiveNumber) {
			const normalized = normalizePairNumber(nonInteractiveNumber);

			if (!normalized) {
				loggers.error(color('Invalid pairing number.', 'red'), color('Provide a valid E.164 number.', 'white'));
				return;
			}

			phoneNumber = normalized;
		}

		if (!phoneNumber && !hasTty) {
			const configured = normalizePairNumber(SETTINGS?.main_host_number);

			if (configured) {
				phoneNumber = configured;
				await delay(2000);
			} else {
				loggers.error(
					color('Pairing requires a TTY.', 'red'),
					color('Use --pair_number, set PAIR_NUMBER, or configure main_host_number.', 'white')
				);
				return;
			}
		}

		check: if (!phoneNumber) {
			const { main_host_number: hostNumber = null, backups_host_numbers: backupsHostNumbers = [] } = SETTINGS;

			if (!hostNumber) {
				phoneNumber = await askInputNumber({ hostNumber, backupsHostNumbers });
				SETTINGS.main_host_number = phoneNumber.replace(/[^0-9]/g, '');
				fs.writeJSON('./src/helper/config/settings.json', SETTINGS);
				break check;
			} else {
				phoneNumber = await askWantNumber({ hostNumber, backupsHostNumbers });
				await delay(1000);
				break check;
			}
		}

		phoneNumber = phoneNumber.trim();

		const code = await Client.requestPairingCode(phoneNumber, 'AESTHERX');

		loggers.info(
			color('Pairing code :', 'lilac'),
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
		loggers.warning(color('Waiting for code input', 'white'), color('. . .', 'pink'));
	}
};
