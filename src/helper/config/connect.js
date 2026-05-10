import { EventEmitter } from 'events';
import fs from 'fs-extra';

import { Cache } from '../modules/cache.js';

const settings = await fs.readJSON('./src/helper/config/settings.json');

/**
 * @type {import('../../types/Socket/config.js').GlobalConfig}
 */
const globalConfig = {
	cmds: {
		commands: new Cache(),
		aliases: [],
		commandUsage: new Cache(),
		disabledCommands: new Set(),
		menu: {},
		menuStr: ''
	},
	user: {
		afk: new Cache(),
		cooldown: new Cache(),
		charAI: new Cache(),
		limit: new Cache()
	},
	presences: {},
	functions: {},
	games: {
		tebakGambar: new Cache(),
		sudoku: new Cache(),
		akinator: new Cache(),
		tictactoe: new Cache(),
		word: new Cache(),
		werewolf: new Cache(),
		wordle: new Cache()
	},
	intervals: {
		tebakGambar: new Cache(),
		sudoku: new Cache(),
		anonymous: new Cache(),
		word: new Cache(),
		from: [],
		freegame: null,
		spotifyPlaybacks: new Cache()
	},
	cache: {
		metadata: new Cache(),
		settings: new Cache(),
		users: new Cache(),
		interval: new Cache(),
		ownerNumbers: [settings.owner_number, ...settings.team_number]
	},
	OPTIONS: {},
	cli: {},
	isFirstConnectionForCache: true,
	isFirstConnection: true,
	isConnected: false,
	packname: 'Made by Aestherix',
	author: 'Powered by Hidden Finder',
	anonymous: new Cache(),
	input: new Cache(),
	mqtt: null,
	logger_theme: settings.logger_theme || 'dracula',
	pinterestId: null,
	pinterestImages: new Cache({ limit: 900 }),
	anonymousMessages: new Cache(),
	isInstagramInitiated: false,
	instagram: null,
	expressInstances: new Cache()
};

global.log = console.log;

EventEmitter.prototype.setMaxListeners(0);

export default globalConfig;
