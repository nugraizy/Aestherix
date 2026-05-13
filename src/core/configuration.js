import fs from 'fs-extra';

import { Cache } from '../helper/modules/cache.js';
import { GroupCache } from './caches/group-cache.js';
import { UserCache } from './caches/user-cache.js';

const SETTINGS_PATH = './src/helper/config/settings.json';

export class Configuration {
	registry = {
		commands: new Cache(),
		aliases: [],
		commandUsage: new Cache(),
		disabledCommands: new Set(),
		menu: {},
		menuStr: '',
		loadPromise: null
	};

	flags = {};
	cli = {};
	input = new Cache();

	groups = new GroupCache();
	users = new UserCache();

	prefix = {
		mode: 'single',
		values: [],
		regex: null,
		default: '.',
		config: {}
	};

	owners = [];
	botJid = '';
	blocklist = [];
	bannedlist = [];

	games = {
		tebakGambar: new Cache(),
		sudoku: new Cache(),
		akinator: new Cache(),
		tictactoe: new Cache(),
		word: new Cache(),
		werewolf: new Cache(),
		wordle: new Cache()
	};

	timers = {
		tebakGambar: new Cache(),
		sudoku: new Cache(),
		anonymous: new Cache(),
		word: new Cache(),
		from: [],
		freegame: null,
		spotifyPlaybacks: new Cache()
	};

	anonymous = {
		sessions: new Cache(),
		messages: new Cache()
	};

	pinterest = {
		id: null,
		images: new Cache({ limit: 900 })
	};

	dashboard = {
		io: null,
		expressInstances: new Cache()
	};

	mqtt = null;
	instagram = null;
	isInstagramInitiated = false;

	settings = {};
	defaultLimit = 100;
	packname = 'Made by Aestherix';
	author = 'Powered by Hidden Finder';
	logger_theme = 'dracula';

	isFirstConnectionForCache = true;
	isFirstConnection = true;
	isConnected = false;

	core = {};

	constructor() {
		try {
			this.settings = fs.readJSONSync(SETTINGS_PATH);
		} catch {
			this.settings = {};
		}

		this.owners = [this.settings.owner_number, ...(this.settings.team_number || [])].filter(Boolean);
		this.prefix.default = this.settings.prefix?.pref || '.';
		this.logger_theme = this.settings.logger_theme || 'dracula';
	}

	get OPTIONS() {
		return this.flags;
	}

	set OPTIONS(value) {
		this.flags = value;
	}

	get cmds() {
		return this.registry;
	}

	set cmds(value) {
		if (value.commands) {
			this.registry.commands = value.commands;
		}

		if (value.aliases) {
			this.registry.aliases = value.aliases;
		}
	}

	#charAI = new Cache();
	#userLimit = new Cache();

	get user() {
		return {
			afk: this.users.afk,
			cooldown: new Cache(),
			charAI: this.#charAI,
			limit: this.#userLimit
		};
	}

	get intervals() {
		return this.timers;
	}

	get cache() {
		return {
			metadata: this.groups.metadata,
			settings: this.groups.settings,
			users: this.users.info,
			interval: new Cache(),
			ownerNumbers: this.owners,
			botNumber: this.botJid,
			prf: this.prefix.default,
			prefixValues: this.prefix.values,
			prefixMode: this.prefix.mode,
			prefixReg: this.prefix.regex,
			prefixConfig: this.prefix.config || {},
			blocklist: this.blocklist,
			bannedlist: this.bannedlist,
			config: this.settings
		};
	}

	set cache(value) {
		if (value.ownerNumbers) {
			this.owners = value.ownerNumbers;
		}

		if (value.botNumber !== undefined) {
			this.botJid = value.botNumber;
		}

		if (value.prefixValues) {
			this.prefix.values = value.prefixValues;
		}

		if (value.prefixMode) {
			this.prefix.mode = value.prefixMode;
		}

		if (value.prefixReg !== undefined) {
			this.prefix.regex = value.prefixReg;
		}

		if (value.prf !== undefined) {
			this.prefix.default = value.prf;
		}

		if (value.prefixConfig) {
			this.prefix.config = value.prefixConfig;
		}

		if (value.blocklist) {
			this.blocklist = value.blocklist;
		}

		if (value.bannedlist) {
			this.bannedlist = value.bannedlist;
		}

		if (value.config) {
			this.settings = value.config;
		}
	}

	get pinterestId() {
		return this.pinterest.id;
	}

	set pinterestId(value) {
		this.pinterest.id = value;
	}

	get pinterestImages() {
		return this.pinterest.images;
	}

	set pinterestImages(value) {
		this.pinterest.images = value;
	}

	get anonymousMessages() {
		return this.anonymous.messages;
	}

	get expressInstances() {
		return this.dashboard.expressInstances;
	}

	get dashboardIO() {
		return this.dashboard.io;
	}

	set dashboardIO(value) {
		this.dashboard.io = value;
	}
}

const configuration = new Configuration();

export default configuration;
