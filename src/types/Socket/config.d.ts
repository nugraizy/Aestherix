import { Cache } from '../../helper/modules/cache.js';

export interface GlobalConfig {
	cmds: {
		commands: Cache;
		aliases: string[];
	};
	user: {
		cooldown: Cache;
		afk: Cache;
		charAI: Cache;
		limit: Cache;
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
		spotifyPlaybacks: Cache;
	};
	cache: {
		metadata: Cache;
		settings: Cache;
		users: Cache;
		interval: Cache;
		ownerNumbers: string[];
	};
	OPTIONS: Record<string, any>;
	cli: Record<string, any>;
	isFirstConnectionForCache: boolean;
	isFirstConnection: boolean;
	isConnected: boolean;
	packname: string;
	author: string;
	anonymous: Cache;
	input: Cache;
	mqtt: import('mqtt').Client | null;
	pinterestId: string | null;
	pinterestImages: Cache;
	anonymousMessages: Cache;
	isInstagramInitiated: boolean;
	instagram: import('../../utils/instagram/instagram.js').InstagramApi | null;
	expressInstances: Cache;
}
