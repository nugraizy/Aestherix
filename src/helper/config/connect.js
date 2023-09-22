import { EventEmitter } from 'events';

import { Cache } from '../modules/cache.js';

global.log = console.log;

/**
 * @typedef {typeof Cache} Cache
 * @property {any} property1 - Description of property1.
 * @property {any[]} property2 - Description of property2.
 */

/**
 * @typedef {Object} GlobalConfig
 * @property {Object} cmds - Command settings.
 * @property {Cache} cmds.commands - Command cache.
 * @property {string[]} cmds.aliases - Array of command aliases.
 * @property {Object} user - User settings.
 * @property {Cache} user.cooldown - Cooldown cache.
 * @property {Cache} user.afk - AFK cache.
 * @property {Object} presences - Presence settings.
 * @property {Object} functions - Function settings.
 * @property {Object} games - Game settings.
 * @property {Cache} games.tebakGambar - Tebak Gambar game cache.
 * @property {Cache} games.sudoku - Sudoku game cache.
 * @property {Cache} games.akinator - Akinator game cache.
 * @property {Cache} games.tictactoe - Tic Tac Toe game cache.
 * @property {Cache} games.word - Word game cache.
 * @property {Cache} games.werewolf - Werewolf game cache.
 * @property {Cache} games.wordle - Wordle game cache.
 * @property {Object} intervals - Interval settings.
 * @property {Cache} intervals.tebakGambar - Tebak Gambar interval cache.
 * @property {Cache} intervals.sudoku - Sudoku interval cache.
 * @property {Cache} intervals.anonymous - Anonymous interval cache.
 * @property {Cache} intervals.word - Word interval cache.
 * @property {any[]} intervals.from - Description of intervals.from.
 * @property {any} intervals.freegame - Description of intervals.freegame.
 * @property {Object} cache - Cache settings.
 * @property {Cache} cache.metadata - Metadata cache.
 * @property {Cache} cache.settings - Settings cache.
 * @property {Cache} cache.users - User cache.
 * @property {Cache} cache.interval - Interval cache.
 * @property {Object} OPTIONS - Options settings.
 * @property {Object} cli - Command Line Interface settings.
 * @property {boolean} isFirstConnection - Flag indicating if it's the first connection.
 * @property {boolean} isConnected - Flag indicating if it's connected.
 * @property {string} packname - Packname information.
 * @property {string} author - Author information.
 * @property {Cache} anonymous - Cache for anonymous data.
 */

/**
 * @type {GlobalConfig}
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

EventEmitter.prototype.setMaxListeners(0);

export default globalConfig;
