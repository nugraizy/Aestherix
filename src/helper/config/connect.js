import { EventEmitter } from 'events';
import fs from 'fs-extra';

import { Cache } from '../modules/cache.js';

const users = await fs.readJSON('./src/helper/config/settings.json');

/**
 * @type {import('../../types/Socket/config.js').GlobalConfig}
 */
const globalConfig = {
	cmds: {
		commands: new Cache(),
		aliases: [],
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
		ownerNumbers: [users.owner_number, ...users.team_number]
	},
	OPTIONS: {},
	cli: {},
	isFirstConnection: false,
	isConnected: false,
	packname: 'Made by Void',
	author: 'Powered by Hidden Finder',
	anonymous: new Cache(),
	input: new Cache()
};

global.log = console.log;

EventEmitter.prototype.setMaxListeners(0);

export default globalConfig;
