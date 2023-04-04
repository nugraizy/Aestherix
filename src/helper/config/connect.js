import { EventEmitter } from 'events';

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
	anonymous: new Map(),
};

global.log = console.log;

globalConfig.cache.metadata = new Map();
globalConfig.cache.settings = new Map();
globalConfig.cache.users = new Map();
globalConfig.cache.interval = new Map();

globalConfig.intervals.tebakGambar = new Map();
globalConfig.intervals.sudoku = new Map();
globalConfig.intervals.url = new Map();
globalConfig.intervals.anonymous = new Map();
globalConfig.intervals.word = new Map();
globalConfig.intervals.from = [];
globalConfig.intervals.freegame = null;
globalConfig.games.tebakGambar = new Map();
globalConfig.games.sudoku = new Map();
globalConfig.games.akinator = new Map();
globalConfig.games.tictactoe = new Map();
globalConfig.games.word = new Map();
globalConfig.games.werewolf = new Map();
globalConfig.games.wordle = new Map();
globalConfig.user.cooldown = new Map();
globalConfig.cmds.commands = new Map();
globalConfig.user.afk = new Map();
globalConfig.commandsPath = [];
globalConfig.cmds.aliases = [];

EventEmitter.prototype.setMaxListeners(0);

export default globalConfig;
