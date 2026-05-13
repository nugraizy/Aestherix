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

	charAI = new Cache();
	userLimit = new Cache();

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
}

const configuration = new Configuration();

export default configuration;
