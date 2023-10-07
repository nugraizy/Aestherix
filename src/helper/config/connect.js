import { EventEmitter } from 'events';

import { Cache } from '../modules/cache.js';

/**
 * @type {import('../../types/Socket/config.js').GlobalConfig}
 */
const globalConfig = {
	cmds: {
		commands: new Cache(),
		aliases: []
	},
	user: {
		afk: new Cache(),
		cooldown: new Cache()
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
		freegame: null
	},
	cache: {
		metadata: new Cache(),
		settings: new Cache(),
		users: new Cache(),
		interval: new Cache()
	},
	OPTIONS: {},
	cli: {},
	isFirstConnection: false,
	isConnected: false,
	packname: 'Made by Void',
	author: 'Powered by Hidden Finder',
	anonymous: new Cache()
};

global.log = console.log;

EventEmitter.prototype.setMaxListeners(0);

export default globalConfig;
