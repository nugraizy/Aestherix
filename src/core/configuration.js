import fs from 'fs-extra';

import { toUserJid } from '../helper/misc/wa_data/index.js';
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
		blackjack: new Cache(),
		chess: new Cache(),
		connectFour: new Cache(),
		hangman: new Cache(),
		memoryMatch: new Cache(),
		minesweeper: new Cache(),
		tebakGambar: new Cache(),
		sudoku: new Cache(),
		tictactoe: new Cache(),
		trivia: new Cache(),
		uno: new Cache(),
		word: new Cache(),
		wordChain: new Cache(),
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

	plugins = new Map();
	pluginHooks = {
		beforeCommand: [],
		afterCommand: [],
		onError: []
	};
	middlewareChain = null;

	mqtt = null;

	/** @type {import('../utils/voip/index.js').VoipClient | null} */
	voip = null;

	/** @type {import('../utils/instagram/instagram.js').InstagramApi | null} */
	instagram = null;
	isInstagramInitiated = Boolean(process.env.INSTAGRAM_USERNAME && process.env.INSTAGRAM_PASSWORD);

	settings = {};
	defaultLimit = 100;
	packname = 'Made by Aestherix';
	author = 'Powered by Hidden Finder';
	logger_theme = 'dracula';
	logMaxSize = 5;

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

		this.owners = [toUserJid(this.settings.owner_number), ...(this.settings.team_number || []).map(toUserJid)].filter(Boolean);
		this.prefix.default = this.settings.prefix?.pref || '.';
		this.logger_theme = this.settings.logger_theme || 'dracula';
		this.logMaxSize =
			typeof this.settings.log_max_size === 'number' && this.settings.log_max_size > 0 ? this.settings.log_max_size : 5;

		if (typeof this.settings.packname === 'string' && this.settings.packname.length > 0) {
			this.packname = this.settings.packname;
		}

		if (typeof this.settings.author === 'string' && this.settings.author.length > 0) {
			this.author = this.settings.author;
		}
	}
}

const configuration = new Configuration();

export default configuration;
