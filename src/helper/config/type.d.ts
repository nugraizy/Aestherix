import { Cache } from '../modules/cache.js';

interface GlobalConfig {
	cmds: {
		commands: Cache;
		aliases: string[];
	};
	user: {
		cooldown: Cache;
		afk: Cache;
	};
	presences: Record<string, any>;
	functions: Record<string, any>;
	games: {
		tebakGambar: Cache;
		sudoku: Cache;
		akinator: Cache;
		tictactoe: Cache;
		word: Cache;
		werewolf: Cache;
		wordle: Cache;
	};
	intervals: {
		tebakGambar: Cache;
		sudoku: Cache;
		anonymous: Cache;
		word: Cache;
		from: any[];
		freegame: any;
	};
	cache: {
		metadata: Cache;
		settings: Cache;
		users: Cache;
		interval: Cache;
	};
	OPTIONS: Record<string, any>;
	cli: Record<string, any>;
	isFirstConnection: boolean;
	isConnected: boolean;
	packname: string;
	author: string;
	anonymous: Cache;
}

declare global {
	var log: (typeof console)['log'];
}
