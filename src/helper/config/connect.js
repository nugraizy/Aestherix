import { EventEmitter } from 'events';

import { Cache } from '../modules/cache.js';

const globalConfig = {
	cmds: {},
	user: {},
	presences: {},
	functions: {},
	games: {},
	intervals: {},
	cache: {},
	OPTIONS: {},
	cli: {},
	commandsPath: [],
	isFirstConnection: false,
	isConnected: false,
	packname: 'Made by Void',
	author: 'Powered by Hidden Finder',
	anonymous: new Cache()
};

global.log = console.log;

globalConfig.cache.metadata = new Cache();
globalConfig.cache.settings = new Cache();
globalConfig.cache.users = new Cache();
globalConfig.cache.interval = new Cache();

globalConfig.intervals.tebakGambar = new Cache();
globalConfig.intervals.sudoku = new Cache();
globalConfig.intervals.url = new Cache();
globalConfig.intervals.anonymous = new Cache();
globalConfig.intervals.word = new Cache();
globalConfig.intervals.from = [];
globalConfig.intervals.freegame = null;
globalConfig.games.tebakGambar = new Cache();
globalConfig.games.sudoku = new Cache();
globalConfig.games.akinator = new Cache();
globalConfig.games.tictactoe = new Cache();
globalConfig.games.word = new Cache();
globalConfig.games.werewolf = new Cache();
globalConfig.games.wordle = new Cache();
globalConfig.user.cooldown = new Cache();
globalConfig.cmds.commands = new Cache();
globalConfig.user.afk = new Cache();
globalConfig.commandsPath = [];
globalConfig.cmds.aliases = [];

EventEmitter.prototype.setMaxListeners(0);

export default globalConfig;
