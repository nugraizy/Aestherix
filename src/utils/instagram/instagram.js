import { parse, set } from '@dotenvx/dotenvx';
import fs from 'fs-extra';
import { v4 } from 'uuid';

import configuration from '../../helper/config/connect.js';
import { Cache } from '../../helper/modules/cache.js';
import { color, loggers } from '../modules/index.js';
import { InstagramMethods } from './methods.js';
import { generateDeviceID } from './utils.js';

export class InstagramApi extends InstagramMethods {
	#_username;
	#_password;
	#_encPassword;
	#_cookie;
	#_uuid;
	#_deviceId;
	#cache;

	constructor(username, password, { uuid = v4(), deviceId = generateDeviceID(), cookie = null } = {}) {
		super();

		this.#_username = username;
		this.#_password = password;
		this.#_encPassword = this._encryptPassword();
		this.#_cookie = cookie;
		this.#_uuid = uuid;
		this.#_deviceId = deviceId;
		this.#cache = new Cache();

		this.account = {
			login: () =>
				new Promise(async (resolve, reject) => {
					try {
						await this._login(this.#_username, this.#_encPassword, {
							uuid: this.#_uuid,
							deviceId: this.#_deviceId
						});

						delete this.account.login;

						resolve(this);
					} catch (error) {
						reject(error);
					}
				}),

			parseCookie: () => this._parseCookie(),

			writeLoginInfo: () => {
				set('USERNAME', this.#_username, { encrypt: true, path: '.env.instagram' });
				set('PASSWORD', this.#_password, { encrypt: true, path: '.env.instagram' });
				set('COOKIE', this.account.parseCookie(), { encrypt: true, path: '.env.instagram' });
				set('UUID', this.#_uuid, { encrypt: true, path: '.env.instagram' });
				set('DEVICE_ID', this.#_deviceId, { encrypt: true, path: '.env.instagram' });
			}
		};

		this.download = {
			post: (...urls) =>
				new Promise(async (resolve, reject) => {
					try {
						if (!this.#_cookie) {
							throw new Error('Cookie not found. Please login first.');
						}

						urls = urls.flat();

						let result = {};

						for (let url of urls) {
							if (result[url]) {
								continue;
							}

							url = this._clearUrl(url);

							if (this._isCacheExist(url)) {
								result[url] = this._getFromCache(url);
								continue;
							}

							const response = await this._getPost(url, this.#_cookie);

							result[url] = response;
							this._setToCache(url, response);
						}

						resolve(result);
					} catch (error) {
						reject(error);
					}
				})
		};

		this.search = {
			user: (...usernames) =>
				new Promise(async (resolve, reject) => {
					try {
						if (!this.#_cookie) {
							throw new Error('Cookie not found. Please login first.');
						}

						usernames = usernames.flat();

						let result = {};

						for (const username of usernames) {
							if (result[username]) {
								continue;
							}

							if (this._isCacheExist(username)) {
								result[username] = this._getFromCache(username);
								continue;
							}

							const response = await this._getProfile(username, this.#_cookie);

							result[username] = response;
							this._setToCache(username, response);
						}

						resolve(result);
					} catch (error) {
						reject(error);
					}
				}),

			users: (...usernames) =>
				new Promise(async (resolve, reject) => {
					try {
						if (!this.#_cookie) {
							throw new Error('Cookie not found. Please login first.');
						}

						usernames = usernames.flat();

						let result = {};

						for (const username of usernames) {
							if (result[username]) {
								continue;
							}

							if (this._isCacheExist(username)) {
								result[username] = this._getFromCache(username);
								continue;
							}

							const response = await this._searchProfile(username, this.#_cookie);

							result[username] = response;
							this._setToCache(username, response);
						}

						resolve(result);
					} catch (error) {
						reject(error);
					}
				}),

			highlight: (...usernames) =>
				new Promise(async (resolve, reject) => {
					try {
						if (!this.#_cookie) {
							throw new Error('Cookie not found. Please login first.');
						}

						usernames = usernames.flat();

						let result = {};

						for (const username of usernames) {
							if (result[username]) {
								continue;
							}

							if (this._isCacheExist(username)) {
								result[username] = this._getFromCache(username);
								continue;
							}

							const response = await this._getHighlights(username, this.#_cookie);

							result[username] = response;
							this._setToCache(username, response);
						}

						resolve(result);
					} catch (error) {
						reject(error);
					}
				}),

			story: (...usernames) =>
				new Promise(async (resolve, reject) => {
					try {
						if (!this.#_cookie) {
							throw new Error('Cookie not found. Please login first.');
						}

						usernames = usernames.flat();

						let result = {};

						for (const username of usernames) {
							if (result[username]) {
								continue;
							}

							if (this._isCacheExist(username)) {
								result[username] = this._getFromCache(username);
								continue;
							}

							const response = await this._getStory(username, this.#_cookie);

							result[username] = response;
							this._setToCache(username, response);
						}

						resolve(result);
					} catch (error) {
						reject(error);
					}
				}),

			hashtag: (...hashtags) =>
				new Promise(async (resolve, reject) => {
					try {
						if (!this.#_cookie) {
							throw new Error('Cookie not found. Please login first.');
						}

						hashtags = hashtags.flat();

						let result = {};

						for (const hashtag of hashtags) {
							if (result[hashtag]) {
								continue;
							}

							if (this._isCacheExist(hashtag)) {
								result[hashtag] = this._getFromCache(hashtag);
								continue;
							}

							const response = await this._getHashtag(hashtag, this.#_cookie);

							result[hashtag] = response;
							this._setToCache(hashtag, response);
						}

						resolve(result);
					} catch (error) {
						reject(error);
					}
				})
		};
	}

	static init() {
		let err;

		if (!fs.existsSync('./.env.instagram')) {
			err = new Error(
				'`.env.instagram` file not found. Use the constructor to login and create file. ex: `new InstagramApi(username, password).login()`'
			);
			loggers.error(color('Instagram fetch failed:', 'red'), err);
			process.exit(0);
		}

		const loginInfo = parse(fs.readFileSync('./.env.instagram', 'utf-8'));
		let { USERNAME, PASSWORD, UUID, DEVICE_ID, COOKIE } = loginInfo;

		if (!USERNAME) {
			err = new Error('`USERNAME` not found in `.env.instagram`');
			loggers.error(color('Instagram fetch failed:', 'red'), err);
			process.exit(0);
		}

		if (!PASSWORD) {
			err = new Error('`PASSWORD` not found in `.env.instagram`');
			loggers.error(color('Instagram fetch failed:', 'red'), err);
			process.exit(0);
		}

		if (!COOKIE) {
			COOKIE = !!COOKIE;
		}

		if (!UUID) {
			UUID = !!UUID;
		}

		if (!DEVICE_ID) {
			DEVICE_ID = !!DEVICE_ID;
		}

		return new InstagramApi(USERNAME, PASSWORD, { uuid: UUID, deviceId: DEVICE_ID, cookie: COOKIE });
	}

	_encryptPassword() {
		return `#PWD_INSTAGRAM_BROWSER:0:${Date.now()}:${this.#_password}`;
	}

	_isCacheExist(input) {
		return this.#cache.has(input);
	}

	_getFromCache(input) {
		return this.#cache.get(input);
	}

	_setToCache(input, data) {
		return this.#cache.set(input, data);
	}

	_clearUrl(url) {
		url = new URL(url);
		url = url.origin + url.pathname;

		return url;
	}
}

if (fs.existsSync('./.env.instagram')) {
	configuration.instagram = InstagramApi.init();
	configuration.isInstagramInitiated = true;
}
